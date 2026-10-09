# Straw2Cash — Rules Service (Java Backend)

> **Owner:** Member 2 (Java Backend)
> **Purpose:** The money, rules, contract, and settlement layer of the Straw2Cash paddy-straw marketplace.

---

## 📌 What This Service Does

This Spring Boot service is the **"money and rules" backend** of the Straw2Cash platform. It answers four questions for every deal in the marketplace:

1. **What is this residue worth?** → Pricing Engine
2. **Who agreed to what, and when?** → Contract Service
3. **How does the money move?** → Settlement Service
4. **Who is allowed to do what?** → User & Role Management *(in progress)*

And one summary question for authorities and impact dashboards:

5. **How much pollution did we prevent?** → Impact Reporting *(planned)*

---

## 🏗️ Position In The Overall System

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
          │   rules-service (THIS REPO)          │◄───────────┘
          │   Pricing │ Contracts │ Settlements  │
          │   Users   │ Impact Reporting         │
          └──────────────────────────────────────┘
                       │
                       ▼
          DynamoDB  │  Cognito  │  SNS  │  S3
```

**Key rule:** This service is the **single source of truth for anything money-related**. Go calls *us* when a match is found. The Frontend calls *us* to display price, contract, and settlement. Python sends us the residue volume and quality grade to price against.

---

## 📁 Project Structure

```
rules-service/
├── pom.xml
├── docker-compose.yml                      # DynamoDB Local (in-memory)
├── README.md                                # this file
└── src/main/java/com/strawmarket/rules/
    ├── RulesServiceApplication.java         # Spring Boot entry point
    ├── config/
    │   ├── AwsConfig.java                   # DynamoDB + SNS client beans
    │   ├── SecurityConfig.java              # Auth rules (temporary: permitAll)
    │   └── DynamoDbTableInitializer.java    # Creates tables + seeds price rules
    ├── controller/
    │   ├── HealthController.java            # GET /api/v1/health
    │   ├── PricingController.java           # POST /api/v1/pricing/quote
    │   ├── ContractController.java          # POST /api/v1/contracts + sign
    │   └── SettlementController.java        # POST /api/v1/settlements
    ├── service/
    │   ├── PricingService.java              # The money formula
    │   ├── ContractService.java             # Contract lifecycle
    │   ├── SettlementService.java           # Payment flow (simulated)
    │   └── NotificationService.java         # SNS stub
    ├── repository/
    │   ├── PriceRuleRepository.java
    │   ├── QuoteRepository.java
    │   ├── ContractRepository.java
    │   └── SettlementRepository.java
    ├── model/
    │   ├── entity/                          # DynamoDB entities
    │   │   ├── PriceRule.java
    │   │   ├── QuoteEntity.java
    │   │   ├── ContractEntity.java
    │   │   └── SettlementEntity.java
    │   ├── dto/                             # Request/response objects
    │   │   ├── QuoteRequest.java
    │   │   ├── QuoteResponse.java
    │   │   ├── CreateContractRequest.java
    │   │   ├── ContractResponse.java
    │   │   ├── SignContractRequest.java
    │   │   ├── SettleContractRequest.java
    │   │   └── SettlementResponse.java
    │   └── enums/
    │       ├── BuyerType.java
    │       ├── Grade.java
    │       ├── ContractStatus.java
    │       ├── SettlementStatus.java
    │       └── SignerRole.java
    └── exception/
        ├── PricingException.java
        ├── ContractException.java
        ├── SettlementException.java
        └── GlobalExceptionHandler.java
```

---

## 🔄 The Complete Workflow

### Full deal lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  1. QUOTE        POST /api/v1/pricing/quote                             │
│                  Input: farmer, buyer, buyerType, tonnes, moisture,     │
│                         grade, distance                                 │
│                  Output: quoteId, pricePerTonne, breakdown[], buyerPays │
│                  Side effect: quote saved to `quotes` table             │
│                                                                         │
│  2. CONTRACT     POST /api/v1/contracts                                 │
│                  Input: quoteId, deliveryBy                             │
│                  Output: contractId, status=PENDING_FARMER_SIGNATURE    │
│                  Side effect: quote marked `consumed`, contract saved   │
│                                                                         │
│  3. FARMER SIGN  POST /api/v1/contracts/{id}/sign                       │
│                  Input: {"signer":"FARMER"}                             │
│                  Output: status=PENDING_BUYER_SIGNATURE                 │
│                  Side effect: farmerSignedAt set                        │
│                                                                         │
│  4. BUYER SIGN   POST /api/v1/contracts/{id}/sign                       │
│                  Input: {"signer":"BUYER"}                              │
│                  Output: status=ACTIVE                                  │
│                  Side effect: buyerSignedAt set, SNS stub fires         │
│                                                                         │
│  5. SETTLE       POST /api/v1/settlements                               │
│                  Input: contractId                                      │
│                  Output: settlement with 3-flow breakdown               │
│                  Side effect: contract marked COMPLETED, settlement     │
│                               saved to `settlements` table              │
│                                                                         │
│  6. REPORT       GET /api/v1/impact/summary        (planned, D5)       │
│                  Output: tonnes diverted, ₹ income, CO₂ avoided         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💰 Pricing Model (v1 — the formula that runs)

The pricing engine uses a **table-driven rule set**. Rules live in the `price_rules` DynamoDB table and can be updated without code changes.

### Per-tonne price formula

```
pricePerTonne = baseRate
              - moisturePenalty
              + gradeAdjustment
```

Where:
- `baseRate` = f(buyerType) — from `price_rules` table
- `moisturePenalty` = 0 if moisture ≤ threshold, else `(moisture − threshold) × penaltyPerPct`
- `gradeAdjustment` = `+premium` for A, `−discount` for B/C

### Amounts

```
grossAmount     = pricePerTonne × tonnes
transportCost   = distanceKm × distanceRate × tonnes
platformFee     = grossAmount × 6%
buyerPays       = grossAmount + transportCost + platformFee
netToFarmer     = grossAmount  (transport is paid separately to transporter)
```

**Note:** Transport is a **separate cost line**, NOT deducted from what the farmer earns. This keeps the "farmer income" story clean.

### Seeded rules (v1)

| Buyer Type | Base (₹/t) | Dist (₹/km/t) | Moisture Threshold | Penalty (₹/t/%) | Grade A | Grade B | Grade C |
|---|---|---|---|---|---|---|---|
| BIOMASS_POWER_PLANT | 2500 | 45 | 14 | 80 | +0 | −100 | −250 |
| BRICK_KILN | 1800 | 40 | 16 | 70 | +0 | −80 | −200 |
| PAPER_MILL | 2200 | 50 | 12 | 90 | +50 | −100 | −250 |
| CATTLE_FEED_MAKER | 3000 | 55 | 18 | 60 | +100 | −100 | −300 |

### Worked examples

**Example 1 — Clean biomass deal**
- Buyer: Biomass Power Plant, 5.2 t, 12% moisture, Grade A, 40 km
- `pricePerTonne` = 2500 (no penalties, no premium)
- `netToFarmer` = ₹13,000
- `transportCost` = 40 × 45 × 5.2 = ₹9,360
- `platformFee` = 6% × 13000 = ₹780
- `buyerPays` = ₹23,140

**Example 2 — Wet, lower-grade straw**
- Buyer: Biomass Power Plant, 3 t, 18% moisture, Grade B, 20 km
- Moisture penalty = (18 − 14) × 80 = ₹320/t
- Grade B = −₹100/t
- `pricePerTonne` = 2500 − 320 − 100 = ₹2,080
- `netToFarmer` = ₹6,240
- `buyerPays` = ₹9,314.40

**Example 3 — High-grade cattle feed**
- Buyer: Cattle Feed Maker, 2.5 t, 10% moisture, Grade A, 15 km
- `pricePerTonne` = 3000 + 100 (grade A premium) = ₹3,100
- `netToFarmer` = ₹7,750
- `buyerPays` = ₹10,277.50

---

## 📊 DynamoDB Tables

| Table | PK | SK | GSI | Purpose |
|---|---|---|---|---|
| `price_rules` | buyerType | version | — | Pricing config |
| `quotes` | quoteId | — | — | Immutable price quotes |
| `contracts` | contractId | — | farmerId-index | Contracts |
| `settlements` | settlementId | — | contractId-index | Payment records |

All tables use **PAY_PER_REQUEST** billing. Created on startup by `DynamoDbTableInitializer` (only under the `local` profile).

**Important:** The initializer uses **`@Profile("local")`**, so it only runs against DynamoDB Local. In production these tables will be provisioned by Infrastructure-as-Code (Member 1's responsibility).

---

## 🚀 Local Development Setup

### Prerequisites

| Tool | Version |
|---|---|
| JDK | 17 or 24 (project targets Java 21 bytecode) |
| Maven | 3.9+ |
| Docker Desktop | Latest |
| IntelliJ IDEA | Community or Ultimate |

### One-time setup

```bash
# Clone
git clone <repo-url>
cd Straw2Cash/rules-service

# Start DynamoDB Local (in-memory, wipes on every restart)
docker-compose up -d

# Verify DynamoDB is alive
curl http://localhost:8000
# Expect: {"__type":"com.amazonaws.dynamodb.v20120810#MissingAuthenticationToken",...}

# Build
mvn clean install -DskipTests -U

# Run
mvn spring-boot:run
```

App starts on **http://localhost:8080**.

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: dynamodb-local
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb -inMemory"
```

**Why `-inMemory`?** It eliminates stale-table problems. Every restart wipes the tables and the initializer rebuilds them fresh with correct GSIs.

### Daily routine

```bash
# Start (morning)
docker-compose up -d
# In IntelliJ: click ▶️ Run

# Stop (evening)
# In IntelliJ: click red ■ Stop
docker stop dynamodb-local
```

---

## 🧪 API Reference

### Health

```http
GET /api/v1/health
```

Response:
```json
{"status":"UP","service":"rules-service","timestamp":"2026-10-09T..."}
```

### Pricing

```http
POST /api/v1/pricing/quote
Content-Type: application/json

{
  "farmerId": "F001",
  "buyerId": "B021",
  "buyerType": "BIOMASS_POWER_PLANT",
  "estimatedTonnes": 5.2,
  "moisturePct": 12.0,
  "grade": "A",
  "distanceKm": 40
}
```

Response:
```json
{
  "quoteId": "Q-ee49677d",
  "currency": "INR",
  "pricePerTonne": 2500.00,
  "grossAmount": 13000.00,
  "transportCost": 9360.00,
  "netToFarmer": 13000.00,
  "platformFee": 780.00,
  "buyerPays": 23140.00,
  "breakdown": [
    {"label": "Base price (BIOMASS_POWER_PLANT)", "value": 2500},
    {"label": "Moisture penalty (12.0%)", "value": 0},
    {"label": "Grade A adjustment", "value": 0},
    {"label": "Net price per tonne to farmer", "value": 2500.00},
    {"label": "Transport cost (40 km)", "value": 9360.00},
    {"label": "Platform fee (6%)", "value": 780.00}
  ],
  "validUntil": "2026-10-09T..."
}
```

### Contracts

**Create:**
```http
POST /api/v1/contracts
Content-Type: application/json

{
  "quoteId": "Q-ee49677d",
  "deliveryBy": "2026-10-20"
}
```

**Sign:**
```http
POST /api/v1/contracts/{contractId}/sign
Content-Type: application/json

{"signer": "FARMER"}     // or "BUYER"
```

**Get by ID:**
```http
GET /api/v1/contracts/{contractId}
```

**List by farmer (uses `farmerId-index` GSI):**
```http
GET /api/v1/contracts?farmerId=F001
```

### Settlements

**Settle a contract:**
```http
POST /api/v1/settlements
Content-Type: application/json

{"contractId": "C-2281e487"}
```

Response:
```json
{
  "settlementId": "S-e7319842",
  "contractId": "C-2281e487",
  "farmerId": "F001",
  "buyerId": "B021",
  "currency": "INR",
  "status": "COMPLETED",
  "simulated": true,
  "totalBuyerPaid": 23140.00,
  "flows": [
    {"from": "BUYER_ESCROW", "to": "FARMER",      "amount": 13000.00},
    {"from": "BUYER_ESCROW", "to": "TRANSPORTER", "amount": 9360.00},
    {"from": "BUYER_ESCROW", "to": "PLATFORM",    "amount": 780.00}
  ],
  "settledAt": "2026-10-09T...",
  "disclaimer": "SIMULATED FOR HACKATHON — no real money movement. In production this would route through Razorpay/UPI/escrow."
}
```

**Note:** The settlement is **idempotent** — calling it twice returns the same record, doesn't double-pay.

---

## 🧠 Business Rules & Guards

| Guard | Description |
|---|---|
| Quote must exist | `POST /contracts` fails if quote ID not found |
| Quote single-use | A quote can only generate one contract (`consumed` flag) |
| Signature order enforced | Farmer must sign before buyer; buyer can't sign while waiting for farmer |
| Contract must be ACTIVE to settle | Cannot settle `PENDING_FARMER_SIGNATURE` or `PENDING_BUYER_SIGNATURE` |
| Settlement idempotent | Re-settling returns the existing settlement |
| Settlement balance check | `farmer + transporter + platform` must equal `buyerPays`, otherwise throws |
| Money uses BigDecimal | Never `double` — all money is `BigDecimal` with scale 2 |

---

## 📋 Endpoint ↔ Status Quick Reference

| Endpoint | Auth Required | Role |
|---|---|---|
| `GET  /api/v1/health` | No | — |
| `POST /api/v1/pricing/quote` | *(TBD D4)* | Any |
| `POST /api/v1/contracts` | *(TBD D4)* | FARMER or BUYER |
| `POST /api/v1/contracts/{id}/sign` | *(TBD D4)* | FARMER or BUYER |
| `GET  /api/v1/contracts/{id}` | *(TBD D4)* | Any party to the contract |
| `GET  /api/v1/contracts?farmerId=...` | *(TBD D4)* | FARMER |
| `POST /api/v1/settlements` | *(TBD D4)* | BUYER |
| `GET  /api/v1/impact/summary` | *(TBD D4)* | AUTHORITY |

**Currently (as of D3):** `SecurityConfig` uses `permitAll()` — **temporary**. D4 will replace it with JWT + role guards.

---

## ✅ Completed Work (as of D3)

| Phase | Deliverable | Status |
|---|---|---|
| **D0** | Spring Boot 3.4.1 scaffold, Java 21 bytecode, health endpoint | ✅ |
| **D1** | Pricing engine with table-driven rules + DynamoDB persistence | ✅ |
| **D2** | Contract service with sign flow, quote consumption, SNS stub | ✅ |
| **D3** | Settlement service with money-flow breakdown, idempotency | ✅ |

### Verified working flows

- ✅ Create a quote with a detailed price breakdown
- ✅ Generate a contract from a quote
- ✅ Farmer signs → status moves to `PENDING_BUYER_SIGNATURE`
- ✅ Buyer signs → status `ACTIVE`, SNS stub fires
- ✅ Settle an ACTIVE contract → 3-flow money diagram + contract marked `COMPLETED`
- ✅ List contracts by farmer (GSI works)
- ✅ Guards: cannot reuse quote, cannot re-sign, cannot settle non-ACTIVE

---

## 🔜 Planned Work (D4 & D5)

### D4 — User & Role Management

**Goal:** Bring authentication and role-based access into the service.

**Plan:**
- Add `UserEntity` in DynamoDB (`users` table)
- `POST /api/v1/auth/login` — returns a JWT
- `POST /api/v1/users/register` — create user with a role
- `GET  /api/v1/users/me` — returns current user's profile and role
- Update `SecurityConfig` to require JWT and enforce:
    - Only `FARMER` can sign as farmer
    - Only `BUYER` can sign as buyer
    - Only `BUYER` can fund settlements
    - Only `AUTHORITY` can view cross-region impact
    - Users can only list their own contracts
- **Local stub first**, Cognito swap ready — structure the code so `application-aws.yml` swaps the auth provider.

**Roles:** `FARMER`, `BALER_OPERATOR`, `BUYER`, `AUTHORITY`

**Integration with other members:** Cognito pool will be shared across services. Member 1 owns the deployment; we consume the pool ID via config.

### D5 — Impact Reporting

**Goal:** Aggregate settlement data for the impact dashboard judges will see.

**Plan:**
- `impact_counters` DynamoDB table, keyed by region + period
- Update counters when a settlement is created
- `GET /api/v1/impact/summary?region=PB&from=...&to=...` returns:
    - `tonnesDiverted` — sum of tonne across all settlements
    - `farmerIncomeINR` — sum of `netToFarmer`
    - `co2AvoidedTonnes` — tonnes × 1.5 (to be verified against a citable source)
    - `contractsCompleted`
    - `methodologyNote` — cite the CO₂ factor source
- `GET /api/v1/impact/contract/{id}` — per-contract impact

### Beyond Hackathon (out of scope but noted for reference)

- Real payment gateway integration (Razorpay/UPI)
- PDF contract generation via OpenPDF (dependency already added)
- Event-driven settlement triggers via SQS
- Billing reconciliation reports
- Multi-language contract terms

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Language | Java 21 (compiled to 21, runs on JDK 24 locally) |
| Framework | Spring Boot 3.4.1 |
| Web | Spring Web (REST) |
| Security | Spring Security 6.4 |
| Validation | Spring Validation + Hibernate Validator |
| Persistence | DynamoDB via AWS SDK v2 + Enhanced Client |
| JSON | Jackson 2.18 |
| Logging | SLF4J + Logback |
| Build | Maven |
| Container | Docker (DynamoDB Local via docker-compose) |
| Deploy Target | AWS Lambda (container) or App Runner — decided with Member 1 |

---

## 🐛 Known Issues / Gotchas

### `-inMemory` DynamoDB wipes on every restart

**Cause:** `docker-compose.yml` uses `-inMemory` flag by design.
**Impact:** All test data is lost on app restart.
**Workaround:** Complete a full demo flow without restarting the app. For persistence, switch to `-dbPath` — but you'll need to wipe the volume manually whenever table schemas change.

### `ExceptionInInitializerError` on JDK 24

**Cause:** Older Lombok versions don't recognize JDK 24 class files.
**Fix:** Set `lombok.version` to `1.18.36` in `pom.xml` (already done). IDE must delegate builds to Maven — enable under `Settings → Build, Execution, Deployment → Build Tools → Maven → Runner → Delegate IDE build/run actions to Maven`.

### Port 8080 already in use

**Cause:** Previous app instance didn't stop cleanly.
**Fix:**
```bash
netstat -ano | findstr :8080
taskkill /PID <pid> /F
```

### `farmerId-index` GSI missing

**Cause:** Table was created before GSI was added to the initializer, and DynamoDB Local persisted it.
**Fix:** Ensure `docker-compose.yml` uses `-inMemory` (no persistence). Restart everything. The initializer rebuilds tables with GSIs.

---

## 🧭 Development Conventions

| Rule | Why |
|---|---|
| Money uses `BigDecimal`, scale 2, `HALF_UP` | No floating-point loss |
| Amounts formatted to ₹ only in responses, not internally | Easy to reason about |
| All timestamps UTC ISO-8601 (`Instant.now().toString()`) | Consistent across services |
| IDs prefixed by type: `Q-`, `C-`, `S-` | Human-readable logs during demo |
| Errors use `GlobalExceptionHandler` with typed codes | Frontend can map to messages |
| No Lombok on `@DynamoDbBean` entities | Manual getters/setters avoid class-generation conflicts |
| Every entity has both `getX()` and `setX()` for GSI keys | Required by the Enhanced Client |

---

## 📖 For New Developers — Read In This Order

1. **This README** — you're here.
2. `RulesServiceApplication.java` — entry point.
3. `DynamoDbTableInitializer.java` — how the data layer is set up.
4. `PricingService.java` — the core money formula.
5. `ContractService.java` — the workflow that ties quotes to contracts.
6. `SettlementService.java` — the money-movement story.
7. The DTO classes — the JSON contract with the rest of the system.
8. `application.yml` — configuration.

**The best way to understand this service** is to run the 6-step curl flow in "API Reference" above and watch the responses. Each response maps directly to a state transition in the database.

---

## 🎯 Service Ownership & Boundaries

### This service OWNS:
- ✅ Pricing formulas and rules
- ✅ Contract records and state machine
- ✅ Settlement records and money flow
- ✅ User roles and permissions (D4)
- ✅ Impact aggregates (D5)

### This service does NOT own:
- ❌ Volume estimation, moisture sensing, burn-zone detection → **Python service**
- ❌ Farmer ↔ buyer ↔ baler matching, slot scheduling, API gateway → **Go service**
- ❌ Any UI → **Frontend**
- ❌ Real payment gateway integration → **out of scope for hackathon**

---

## 📞 Contact

**Owner:** Member 2 — Java Backend
**Hackathon:** Straw2Cash — Crop Residue Marketplace
**Repo:** `Straw2Cash/rules-service`

For questions about interfaces, check the DTOs first. The JSON shapes in `/model/dto` are the contract with the rest of the team.

---

## 📝 Changelog

| Date | Milestone |
|---|---|
| D0 | Project scaffold, health endpoint |
| D1 | Pricing engine working end-to-end |
| D2 | Contract creation + dual-signature flow |
| D3 | Settlement service with money-flow breakdown |
| D4 | *(planned)* Auth, roles, protected endpoints |
| D5 | *(planned)* Impact reporting |

---

*Last updated: after D3 completion.*