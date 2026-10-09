# Straw2Cash — Rules Service

> **Owner:** Member 2 (Java Backend)
> **Purpose:** The money, contracts, and rules layer of the Straw2Cash paddy straw marketplace.
> **Status:** ✅ Feature-complete for hackathon (D0–D5)

---

## 🎯 What This Service Does

This Spring Boot service is the **money layer** of Straw2Cash. It:

1. **Prices** every deal (per-tonne breakdown by buyer type, moisture, grade, distance)
2. **Generates and signs** contracts between farmers and buyers
3. **Settles payments** — simulated 3-way flow to farmer, transporter, platform
4. **Manages users and roles** — FARMER, BUYER, AUTHORITY, BALER_OPERATOR
5. **Reports impact** — tonnes diverted, farmer income, CO₂ avoided

> **One-liner:** *Python says how much residue. Go says who and when. Frontend shows it. **I say what it's worth, who owes whom, and how much pollution we prevented.***

---

## 🚀 Quick Start

```bash
# 1. Start DynamoDB Local
cd rules-service
docker-compose up -d

# 2. Build
mvn clean install -DskipTests -U

# 3. Run
mvn spring-boot:run
```

App runs on **http://localhost:8080**.

**Verify:** `curl http://localhost:8080/api/v1/health`

---

## 🔑 Demo Credentials

| Role | Phone | Password |
|---|---|---|
| FARMER | `9000000001` | `farmer123` |
| BUYER | `9000000002` | `buyer123` |
| AUTHORITY | `9000000003` | `auth123` |

Login:
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9000000001","password":"farmer123"}'
```

---

## 📚 Documentation

| Doc | What it covers | Read this when… |
|---|---|---|
| [**01 — Architecture**](docs/01-architecture.md) | Layers, design decisions, tech stack | You want the big picture |
| [**02 — Getting Started**](docs/02-getting-started.md) | Setup, IDE config, daily routine | You're running it for the first time |
| [**03 — API Reference**](docs/03-api-reference.md) | Every endpoint with request/response | You're integrating |
| [**04 — Pricing Model**](docs/04-pricing-model.md) | The money formula, worked examples | You need to understand the numbers |
| [**05 — Auth & Roles**](docs/05-auth-and-roles.md) | JWT, roles, access matrix | You're wiring auth into the frontend |
| [**06 — Workflows**](docs/06-workflows.md) | Contract state machine, settlement flow | You're building the UX flow |
| [**07 — Integrations**](docs/07-integrations.md) | Interfaces with Go, Python, Frontend | You're connecting services |
| [**08 — Deployment**](docs/08-deployment.md) | Lambda/App Runner, AWS resources | You're deploying to AWS |
| [**09 — Demo Script**](docs/09-demo-script.md) | 90-second pitch + judge Q&A | It's demo day |
| [**10 — Troubleshooting**](docs/10-troubleshooting.md) | Known issues and fixes | Something broke |
| [**11 — Roadmap**](docs/11-roadmap.md) | Beyond-hackathon work | You're thinking past the demo |

---

## 🏗️ Position In The System

```
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  Python (Member 3) │    │   Go (Member 1)    │    │ Frontend (Member 4)│
│  volume + grade    │    │  matching engine   │    │  farmer/buyer UI   │
└─────────┬──────────┘    └─────────┬──────────┘    └─────────┬──────────┘
          │                         │                         │
          └────────────┬────────────┘                         │
                       ▼                                      │
          ┌──────────────────────────────────────┐            │
          │   rules-service  (THIS REPO)         │◄───────────┘
          │   Pricing │ Contracts │ Settlements  │
          │   Users   │ Impact Reporting         │
          └──────────────────────────────────────┘
                       │
                       ▼
          DynamoDB  │  JWT Auth  │  SNS  │  S3
```

---

## ✅ Completion Status

| Phase | Deliverable | Status |
|---|---|---|
| D0 | Spring Boot scaffold + health endpoint | ✅ |
| D1 | Pricing engine with table-driven rules | ✅ |
| D2 | Contract service with dual-signature flow | ✅ |
| D3 | Settlement service with money-flow breakdown | ✅ |
| D4 | JWT auth, roles, protected endpoints | ✅ |
| D5 | Impact reporting with CO₂ methodology | ✅ |

---

## 🛠️ Tech Stack (Quick)

| Layer | Tech |
|---|---|
| Language | Java 21 (bytecode) |
| Framework | Spring Boot 3.4.1 |
| Security | Spring Security 6.4 + JWT (jjwt 0.12.6) |
| Persistence | DynamoDB (AWS SDK v2) |
| Build | Maven |
| Local DB | DynamoDB Local (Docker, in-memory) |

Full details → [**01 — Architecture**](docs/01-architecture.md)

---

## 📞 Contact

**Owner:** Member 2 — Java Backend
**Repo:** `Straw2Cash/rules-service`

**For integration questions:** check [**07 — Integrations**](docs/07-integrations.md). The JSON shapes in `src/main/java/com/strawmarket/rules/model/dto/` are the frozen interface contract.

---

*Documentation split into `docs/` for readability. Root README is the index.*