# 01 — Architecture

> **Read this when:** you want the big picture of how the service is designed.

---

## Purpose

The `rules-service` is the **money, contracts, and rules layer** of the Straw2Cash marketplace. It is the single source of truth for:
- Pricing
- Contracts
- Settlements
- Users & roles
- Impact reporting

No other service computes money.

---

## Service Boundaries

### ✅ This service OWNS
- Pricing formulas and rules
- Contract records and state machine
- Settlement records and money flow
- User roles and permissions
- Impact aggregates

### ❌ This service does NOT own
- Volume estimation, moisture sensing, burn-zone detection → **Python**
- Matching, slot scheduling, API gateway → **Go**
- Any UI → **Frontend**
- Real payment gateway → **out of scope**

---

## Position In The System

```
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  Python (Member 3) │    │   Go (Member 1)    │    │ Frontend (Member 4)│
│  volume + grade    │    │  matching engine   │    │  farmer/buyer UI   │
└─────────┬──────────┘    └─────────┬──────────┘    └─────────┬──────────┘
          │                         │                         │
          │  volume + grade         │  deal request           │  price,
          └────────────┬────────────┘                         │  contract,
                       ▼                                      │  settlement,
          ┌──────────────────────────────────────┐            │  impact
          │   rules-service  (THIS REPO)         │◄───────────┘
          │   Pricing │ Contracts │ Settlements  │
          │   Users   │ Impact Reporting         │
          └──────────────────────────────────────┘
                       │
                       ▼
          DynamoDB  │  JWT Auth  │  SNS  │  S3
```

---

## Application Layers

```
┌─────────────────────────────────────────────────────────┐
│  Controller Layer (REST endpoints)                      │
│  - DTO validation, HTTP concerns, ResponseEntity        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Service Layer (business logic)                         │
│  - Money math (BigDecimal)                              │
│  - State machine enforcement                            │
│  - SNS notifications                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Repository Layer (DynamoDB access)                     │
│  - Thin wrappers around DynamoDbTable<T>                │
│  - No business logic                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  AWS SDK v2 (DynamoDB Enhanced Client)                  │
└─────────────────────────────────────────────────────────┘
```

---

## Cross-Cutting Concerns

| Concern | Handled by |
|---|---|
| Authentication | `JwtAuthFilter` (Spring Security filter chain) |
| Authorization | `SecurityConfig` role rules |
| Error responses | `GlobalExceptionHandler` with typed exceptions |
| Logging | SLF4J + Logback |
| Money precision | `BigDecimal` scale 2, `HALF_UP` |
| Timestamps | `Instant.now().toString()` UTC ISO-8601 |
| IDs | Type-prefixed: `Q-`, `C-`, `S-`, `U-` |

---

## Design Decisions & Rationale

| Decision | Why |
|---|---|
| Manual getters/setters on DynamoDB entities | Lombok + DynamoDB Enhanced Client can clash on bytecode generation |
| Money as `BigDecimal` | Float arithmetic loses precision — unacceptable for financial records |
| `-inMemory` DynamoDB for dev | Eliminates stale-schema problems; tables rebuild each restart |
| Table-driven pricing rules | Business can update rates via DynamoDB without redeploying |
| Idempotent settlement | Network retries don't cause double payments |
| JWT format Cognito-compatible | Swapping to real Cognito is a config change, not a rewrite |
| DTOs separate from entities | Decouples JSON API surface from DynamoDB schema |
| Global exception handler | Consistent error responses across the API |
| No Lombok on entities | Safer with DynamoDB Enhanced Client |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Language | Java (bytecode target) | 21 |
| Runs on | JDK | 17 or 24 |
| Framework | Spring Boot | 3.4.1 |
| Web | Spring Web MVC | 6.2.1 |
| Security | Spring Security | 6.4.2 |
| JWT | jjwt | 0.12.6 |
| Password hashing | BCrypt (spring-security-crypto) | 6.4.2 |
| Validation | Hibernate Validator | 8.0.2 |
| Persistence | AWS SDK v2 DynamoDB Enhanced Client | 2.28.16 |
| JSON | Jackson | 2.18.2 |
| Logging | SLF4J + Logback | 2.0.16 / 1.5.12 |
| Build | Maven | 3.9+ |
| Local DB | DynamoDB Local (Docker) | latest |

---

## Project Structure

```
src/main/java/com/strawmarket/rules/
├── RulesServiceApplication.java
├── config/                          # Spring configuration
│   ├── AwsConfig.java               # DynamoDB + SNS client beans
│   ├── SecurityConfig.java          # Auth rules, filter chain
│   └── DynamoDbTableInitializer.java # Table creation + seeding
├── security/                        # JWT infrastructure
│   ├── JwtService.java
│   ├── JwtAuthFilter.java
│   ├── AuthenticatedUser.java
│   └── CurrentUser.java
├── controller/                      # REST endpoints
│   ├── HealthController.java
│   ├── PricingController.java
│   ├── ContractController.java
│   ├── SettlementController.java
│   ├── AuthController.java
│   ├── UserController.java
│   └── ImpactController.java
├── service/                         # Business logic
│   ├── PricingService.java
│   ├── ContractService.java
│   ├── SettlementService.java
│   ├── NotificationService.java
│   ├── UserService.java
│   └── ImpactService.java
├── repository/                      # DynamoDB access
│   ├── PriceRuleRepository.java
│   ├── QuoteRepository.java
│   ├── ContractRepository.java
│   ├── SettlementRepository.java
│   └── UserRepository.java
├── model/
│   ├── entity/                      # DynamoDB entities
│   ├── dto/                         # Request/response objects
│   └── enums/                       # Domain enums
└── exception/                       # Error handling
    ├── PricingException.java
    ├── ContractException.java
    ├── SettlementException.java
    ├── AuthException.java
    └── GlobalExceptionHandler.java
```

---

## Reading Order For New Developers

1. This file — big picture
2. `02-getting-started.md` — get it running
3. `RulesServiceApplication.java` — entry point
4. `DynamoDbTableInitializer.java` — data layer setup
5. `PricingService.java` — the core money formula
6. `ContractService.java` — state machine
7. `SettlementService.java` — payment flow
8. `SecurityConfig.java` + `JwtAuthFilter.java` — auth
9. `03-api-reference.md` — run the 5-step flow and watch state changes

**Best way to learn:** run the flow in [03 — API Reference](../docs/03-api-reference.md) and map each response to a database state transition.

---

## Related Docs

- [02 — Getting Started](02-getting-started.md)
- [03 — API Reference](03-api-reference.md)
- [04 — Pricing Model](04-pricing-model.md)
- [06 — Workflows](06-workflows.md)