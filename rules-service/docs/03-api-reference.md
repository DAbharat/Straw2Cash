# 03 — API Reference

> **Read this when:** you're integrating with this service or testing endpoints.

**Base URL:** `http://localhost:8080`

All authenticated endpoints require `Authorization: Bearer <token>` header.

---

## Health

### `GET /api/v1/health`

No auth required.

**Response 200:**
```json
{"status":"UP","service":"rules-service","timestamp":"2026-10-09T..."}
```

---

## Auth

### `POST /api/v1/auth/login`

No auth required.

**Request:**
```json
{
  "phone": "9000000001",
  "password": "farmer123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresInSeconds": 86400,
  "userId": "U-5144d652",
  "name": "Gurpreet Singh",
  "role": "FARMER",
  "region": "PB"
}
```

**Errors:**
| Status | Code | Cause |
|---|---|---|
| 401 | AUTH_ERROR | Invalid phone or password |

---

## Users

### `POST /api/v1/users/register`

No auth required.

**Request:**
```json
{
  "phone": "9000000004",
  "name": "Test User",
  "password": "test1234",
  "role": "FARMER",
  "region": "PB"
}
```

**Validations:**
- Phone: 10–15 chars, unique
- Password: 6–100 chars
- Role: FARMER / BALER_OPERATOR / BUYER / AUTHORITY
- Region: non-blank

**Response 200:**
```json
{
  "userId": "U-xxxxxxxx",
  "phone": "9000000004",
  "name": "Test User",
  "role": "FARMER",
  "region": "PB"
}
```

### `GET /api/v1/users/me`

**Auth:** any authenticated user.

**Response 200:**
```json
{
  "userId": "U-5144d652",
  "phone": "9000000001",
  "name": "Gurpreet Singh",
  "role": "FARMER",
  "region": "PB"
}
```

---

## Pricing

### `POST /api/v1/pricing/quote`

**Auth:** any authenticated user.

**Request:**
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

**buyerType options:** `BIOMASS_POWER_PLANT`, `BRICK_KILN`, `PAPER_MILL`, `CATTLE_FEED_MAKER`

**grade options:** `A`, `B`, `C`

**Response 200:**
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

**Errors:**
| Status | Code | Cause |
|---|---|---|
| 400 | PRICING_ERROR | No active rule for buyerType |

---

## Contracts

### `POST /api/v1/contracts`

**Auth:** any authenticated user.

**Request:**
```json
{
  "quoteId": "Q-ee49677d",
  "deliveryBy": "2026-10-20"
}
```

**Response 200:**
```json
{
  "contractId": "C-2281e487",
  "quoteId": "Q-ee49677d",
  "farmerId": "F001",
  "buyerId": "B021",
  "buyerType": "BIOMASS_POWER_PLANT",
  "grade": "A",
  "tonnes": 5.2,
  "pricePerTonne": 2500,
  "netToFarmer": 13000,
  "transportCost": 9360,
  "platformFee": 780,
  "buyerPays": 23140,
  "deliveryBy": "2026-10-20",
  "status": "PENDING_FARMER_SIGNATURE",
  "farmerSignedAt": null,
  "buyerSignedAt": null,
  "createdAt": "2026-10-09T...",
  "updatedAt": "2026-10-09T..."
}
```

**Errors:**
| Status | Code | Cause |
|---|---|---|
| 400 | CONTRACT_ERROR | Quote not found |
| 400 | CONTRACT_ERROR | Quote already used |

### `POST /api/v1/contracts/{id}/sign`

**Auth:** any authenticated user.

**Request (farmer signs):**
```json
{"signer": "FARMER"}
```

**Request (buyer signs):**
```json
{"signer": "BUYER"}
```

**Response 200:** Updated `ContractResponse`.

**Errors:**
| Status | Code | Cause |
|---|---|---|
| 400 | CONTRACT_ERROR | Contract not found |
| 400 | CONTRACT_ERROR | Wrong signature order |

### `GET /api/v1/contracts/{id}`

**Auth:** any authenticated user.

**Response 200:** `ContractResponse`.

### `GET /api/v1/contracts?farmerId=F001`

**Auth:** any authenticated user.

Uses the `farmerId-index` GSI.

**Response 200:** Array of `ContractResponse`.

---

## Settlements

### `POST /api/v1/settlements`

**Auth:** **BUYER role only**.

**Request:**
```json
{"contractId": "C-2281e487"}
```

**Response 200:**
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

**Idempotent:** calling twice returns the same record.

**Errors:**
| Status | Code | Cause |
|---|---|---|
| 403 | — | Non-BUYER attempting to settle |
| 400 | SETTLEMENT_ERROR | Contract not found |
| 400 | SETTLEMENT_ERROR | Contract not ACTIVE |

### `GET /api/v1/settlements/{id}`

**Auth:** any authenticated user.

### `GET /api/v1/settlements?contractId=...`

**Auth:** any authenticated user. Uses `contractId-index` GSI.

---

## Impact

### `GET /api/v1/impact/summary`

**Auth:** **AUTHORITY role only**.

**Query params (all optional):**
- `region` — e.g., `PB`
- `from` — ISO date
- `to` — ISO date

**Response 200:**
```json
{
  "region": "ALL",
  "periodFrom": null,
  "periodTo": null,
  "tonnesDiverted": 10.70,
  "farmerIncomeINR": 26760.00,
  "co2AvoidedTonnes": 16.05,
  "contractsCompleted": 3,
  "contractDetails": [
    {
      "contractId": "C-xxx",
      "farmerId": "F001",
      "buyerId": "B021",
      "tonnes": 5.20,
      "farmerIncome": 13000.00,
      "co2Avoided": 7.80
    }
  ],
  "methodologyNote": "CO2 avoided calculated using 1.5 t CO2e per tonne of paddy straw burned. ...",
  "disclaimer": "SIMULATED FOR HACKATHON — ..."
}
```

**Errors:**
| Status | Code | Cause |
|---|---|---|
| 403 | — | Non-AUTHORITY attempting to access |

---

## Error Response Format

All errors return:

```json
{
  "error": "<ERROR_CODE>",
  "message": "<human-readable message>",
  "timestamp": "2026-10-09T..."
}
```

### Error code catalog

| HTTP | Code | Cause |
|---|---|---|
| 400 | PRICING_ERROR | No active rule for buyerType |
| 400 | CONTRACT_ERROR | Quote/contract issues |
| 400 | SETTLEMENT_ERROR | Contract/balance issues |
| 400 | VALIDATION_ERROR | Request body validation failed |
| 401 | AUTH_ERROR | Login failure or invalid token |
| 403 | *(default)* | Role not permitted |
| 500 | INTERNAL_ERROR | Unhandled exception |

---

## Related Docs

- [04 — Pricing Model](04-pricing-model.md) — the numbers behind the quote
- [05 — Auth & Roles](05-auth-and-roles.md) — tokens and access
- [06 — Workflows](06-workflows.md) — state machine