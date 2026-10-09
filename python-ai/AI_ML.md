# Straw2Cash — Turn Stubble into Income

> **An Agricultural-Residue Marketplace connecting farmers with biomass plants, feed makers, and baler operators to eliminate crop burning through guaranteed economic incentives.**

---

## 🏛️ System Architecture & Team Ownership

```
                        Member 4 (Frontend / Mobile)
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│ Member 1 (Go Backend)   │ │ Member 2 (Java Backend) │ │ Member 3 (Python AI/ML) │
│ Port: 8000              │ │ Port: 8080              │ │ Port: 8001 (Ready ✅)   │
│ - Matching Engine       │ │ - Pricing Rules Matrix  │ │ - Residue Estimation    │
│ - Scheduling & Bookings │ │ - Contracts & Escrow    │ │ - NASA FIRMS Satellites │
│ - Farmer/Buyer Profiles │ │ - Simulated Settlements │ │ - Multilingual Assistant│
│ - PostgreSQL + sqlc     │ │ - DynamoDB + SpringBoot │ │ - Strands Agents SDK    │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

---

## 📁 Repository Services

| Service | Directory / Branch | Tech Stack | Status | Primary Port |
|---|---|---|---|---|
| **Python AI/ML & Intelligence** | `python-ai/` (branch: `ai-ml`) | FastAPI, Pydantic, Strands Agents, Pytest | ✅ Complete (29/29 tests pass) | `8001` |
| **Java Rules & Settlements** | `rules-service/` (branch: `java-backend`) | Java 21, Spring Boot 3.4.1, DynamoDB Local | ✅ Complete | `8080` |
| **Go Matching & Scheduling** | `cmd/api/` (branch: `go-backend`) | Go 1.22+, PostgreSQL, sqlc, Docker | 🔨 In Progress | `8000` |
| **Farmer & Buyer UI** | Branch: `frontend` | React, TypeScript, Maps | 🔨 In Progress | `5173` |

---

## 🚀 Running the Services

### 1. Python AI/ML Service (Member 3)
```bash
cd python-ai
uv venv .venv
uv pip install --python .venv/Scripts/python.exe -r requirements.txt
.venv/Scripts/python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
- **Interactive Farmer Bench:** [http://localhost:8001/demo](http://localhost:8001/demo)
- **API Swagger Docs:** [http://localhost:8001/docs](http://localhost:8001/docs)

### 2. Java Rules & Pricing Service (Member 2)
```bash
cd rules-service
docker-compose up -d  # DynamoDB Local
./mvnw spring-boot:run
```
- Health: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)

### 3. Go Matching Engine (Member 1)
```bash
go run cmd/api/main.go
```
- Health: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🌾 Core Platform Story
1. **Residue Calculation (Python):** Farmer enters acreage (e.g. 5 acres). Python scientifically estimates recoverable straw (~12 tonnes / 27 round bales) using ICAR/PAU standards.
2. **Pricing Transparency (Java):** Java rules engine calculates guaranteed payout (e.g., ₹2,500/t base). **Transport is charged to the buyer, never deducted from farmer earnings.**
3. **Dispatch & Matching (Go):** Nearby balers and commercial buyers are algorithmically matched and scheduled.
4. **Satellite Monitoring (Python):** NASA FIRMS tracks regional thermal anomalies, verifying risk reduction and proving environmental impact without accusatory claims.
