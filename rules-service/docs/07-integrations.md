# 07 — Integrations

> **Read this when:** you're connecting this service to Go, Python, or the Frontend.

---

## Service Interfaces

| Service | Direction | Interface |
|---|---|---|
| **Go (Member 1)** | Go → this service | HTTP POST for pricing, contract, settlement |
| **Python (Member 3)** | Python → Frontend → this service | Volume/grade passed through quote request |
| **Frontend (Member 4)** | Frontend → this service | Full API surface |

---

## Interface with Go Service

**Direction:** Go → this service.

**Trigger:** Go's matching engine finds a farmer ↔ buyer ↔ baler match. It sends a deal request.

**Endpoint:** `POST /api/v1/pricing/quote`

**Expected payload:**
```json
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

**Response:**
```json
{
  "quoteId": "Q-ee49677d",
  "pricePerTonne": 2500.00,
  "buyerPays": 23140.00,
  ...
}
```

**Go's responsibility:**
- Obtain JWT via `POST /auth/login`
- Send `Authorization: Bearer <token>` on every call
- Handle 400/401/403 responses

---

## Interface with Python Service

**Direction:** Python → Frontend → this service (indirect).

**Contract:** Python provides volume + grade estimates to the frontend. The frontend then forwards to `POST /pricing/quote`.

**Data shape from Python:**
```json
{
  "fieldId": "FLD-778",
  "estimatedTonnes": 5.2,
  "moisturePct": 12.0,
  "grade": "A"
}
```

**Note:** Python does NOT call this service directly.

---

## Interface with Frontend

**Direction:** Frontend → this service.

**Contract:** Full API surface — see [03 — API Reference](03-api-reference.md).

**Frontend's responsibility:**

1. **Auth**
    - Store JWT after login (localStorage/sessionStorage)
    - Attach `Authorization: Bearer <token>` on every protected request
    - On 401 → clear token, redirect to login
    - On 403 → show "not allowed", don't redirect

2. **Pricing display**
    - Render the `breakdown[]` array line-by-line
    - Show `netToFarmer`, `platformFee`, `transportCost`, `buyerPays` clearly

3. **Contract flow**
    - Show status badges (PENDING_FARMER_SIGNATURE, ACTIVE, etc.)
    - Two-step sign UI (farmer then buyer)

4. **Settlement**
    - Show the 3-flow money diagram
    - Show `disclaimer` prominently

5. **Impact**
    - Show tonnes, income, CO₂ with `methodologyNote` visible

---

## Interface Contracts (Frozen)

These JSON shapes are the **frozen interface** between services:

| Contract | File | Freeze rule |
|---|---|---|
| Quote request | `model/dto/QuoteRequest.java` | Add optional fields only |
| Quote response | `model/dto/QuoteResponse.java` | Add fields only; never rename |
| Contract request | `model/dto/CreateContractRequest.java` | Same |
| Contract response | `model/dto/ContractResponse.java` | Same |
| Settlement request | `model/dto/SettleContractRequest.java` | Same |
| Settlement response | `model/dto/SettlementResponse.java` | Same |
| Auth response | `model/dto/AuthResponse.java` | Same |
| Impact response | `model/dto/ImpactSummaryResponse.java` | Same |

**Any breaking change requires a version bump** (`/api/v2/...`).

---

## Integration Expectations

| Aspect | Contract |
|---|---|
| Base URL (local) | `http://localhost:8080` |
| Auth header | `Authorization: Bearer <jwt>` |
| Content type | `application/json` |
| Timestamps | UTC ISO-8601 (`2026-10-09T02:46:25Z`) |
| Currency | Decimal rupees in responses |
| IDs | Type-prefixed strings (`Q-`, `C-`, `S-`, `U-`) |
| Error format | `{"error": "...", "message": "...", "timestamp": "..."}` |

---

## Testing Your Integration

Quick smoke test from Go or Frontend:

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9000000001","password":"farmer123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Call pricing
curl -X POST http://localhost:8080/api/v1/pricing/quote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"farmerId":"F001","buyerId":"B021","buyerType":"BIOMASS_POWER_PLANT","estimatedTonnes":5.2,"moisturePct":12.0,"grade":"A","distanceKm":40}'
```

If you get a `quoteId` back, integration works.

---

## Communication Protocol

When integration breaks:

1. **Verify the other service can hit us:**
   ```bash
   curl http://localhost:8080/api/v1/health
   ```

2. **Verify auth works:**
   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/login -d '...'
   ```

3. **Check the endpoint contract** in [03 — API Reference](03-api-reference.md)

4. **Check our error response** — the `message` field usually says what's wrong

5. **Ping Member 2** with the exact request + response

---

## Related Docs

- [03 — API Reference](03-api-reference.md) — full endpoints
- [05 — Auth & Roles](05-auth-and-roles.md) — tokens
- [10 — Troubleshooting](10-troubleshooting.md) — common issues