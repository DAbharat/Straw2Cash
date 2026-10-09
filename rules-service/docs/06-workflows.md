# 06 — Workflows

> **Read this when:** you're building the UX flow or debugging state transitions.

---

## The Deal Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1 — QUOTE                                                          │
│  POST /api/v1/pricing/quote                                              │
│  Auth: any authenticated user                                           │
│  Input:  farmerId, buyerId, buyerType, tonnes, moisturePct, grade, dist │
│  Output: quoteId, pricePerTonne, breakdown[], buyerPays                 │
│  Side effects:                                                           │
│    - Quote saved to `quotes` table (consumed=false)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2 — CONTRACT                                                       │
│  POST /api/v1/contracts                                                  │
│  Auth: any authenticated user                                           │
│  Input:  quoteId, deliveryBy                                            │
│  Output: contractId, status=PENDING_FARMER_SIGNATURE                    │
│  Side effects:                                                           │
│    - Quote marked `consumed=true` (single-use)                          │
│    - Contract saved to `contracts` table                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3 — FARMER SIGNS                                                   │
│  POST /api/v1/contracts/{id}/sign                                        │
│  Input:  {"signer":"FARMER"}                                            │
│  Output: status=PENDING_BUYER_SIGNATURE                                 │
│  Guards: contract must currently be PENDING_FARMER_SIGNATURE           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4 — BUYER SIGNS                                                    │
│  POST /api/v1/contracts/{id}/sign                                        │
│  Input:  {"signer":"BUYER"}                                             │
│  Output: status=ACTIVE                                                  │
│  Guards: contract must currently be PENDING_BUYER_SIGNATURE            │
│  Side effects:                                                           │
│    - SNS notification stub fires                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 5 — SETTLE                                                         │
│  POST /api/v1/settlements                                                │
│  Auth: BUYER role only                                                  │
│  Input:  contractId                                                     │
│  Output: settlement with 3-flow breakdown                               │
│  Guards: contract must be ACTIVE                                        │
│  Side effects:                                                           │
│    - Settlement saved to `settlements` table                            │
│    - Contract marked COMPLETED                                          │
│  Idempotent: yes — re-calling returns same record                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 6 — IMPACT                                                         │
│  GET /api/v1/impact/summary?region=PB&from=...&to=...                   │
│  Auth: AUTHORITY role only                                              │
│  Output: tonnesDiverted, farmerIncomeINR, co2AvoidedTonnes              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Contract State Machine

```
                  [CREATE CONTRACT]
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │  PENDING_FARMER_SIGNATURE            │
        └─────────────────┬───────────────────┘
                          │  POST /sign {signer: FARMER}
                          ▼
        ┌─────────────────────────────────────┐
        │  PENDING_BUYER_SIGNATURE             │
        └─────────────────┬───────────────────┘
                          │  POST /sign {signer: BUYER}
                          │  → SNS notification fires
                          ▼
        ┌─────────────────────────────────────┐
        │  ACTIVE                              │
        └─────────────────┬───────────────────┘
                          │  POST /settlements
                          ▼
        ┌─────────────────────────────────────┐
        │  COMPLETED                           │
        └─────────────────────────────────────┘
```

### Transition guards

| Transition | Guard |
|---|---|
| Create → PENDING_FARMER_SIGNATURE | Quote exists and `consumed == false` |
| PENDING_FARMER_SIGNATURE → PENDING_BUYER_SIGNATURE | `signer == FARMER` |
| PENDING_BUYER_SIGNATURE → ACTIVE | `signer == BUYER` |
| ACTIVE → COMPLETED | Triggered by settlement |

### Invalid transitions

- Sign as FARMER on `PENDING_BUYER_SIGNATURE` → `CONTRACT_ERROR`
- Sign as BUYER on `PENDING_FARMER_SIGNATURE` → `CONTRACT_ERROR`
- Sign a `COMPLETED` contract → `CONTRACT_ERROR`
- Settle a `PENDING_*` contract → `SETTLEMENT_ERROR`

---

## Settlement Money Flow

```
                  BUYER (pays buyerPays)
                       │
                       ▼
              ┌──────────────────┐
              │  BUYER_ESCROW    │
              └────────┬─────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌────────┐    ┌────────────┐   ┌──────────┐
   │ FARMER │    │TRANSPORTER │   │ PLATFORM │
   │ 13,000 │    │   9,360    │   │   780    │
   └────────┘    └────────────┘   └──────────┘
```

The three flows sum to `totalBuyerPaid`. A sanity check throws if they don't.

**Idempotency:** Calling settle twice on the same contract returns the same settlement record.

---

## Impact Aggregation

```
All `settlements` table records
        │
        ▼
  Sum tonnes → tonnesDiverted
  Sum amountToFarmer → farmerIncomeINR
  Sum tonnes × 1.5 → co2AvoidedTonnes
  Count → contractsCompleted
```

---

## Actor Responsibilities

| Actor | Role in workflow |
|---|---|
| **Farmer** | Prices deals, signs as farmer, views own contracts |
| **Buyer** | Prices deals, signs as buyer, settles payment |
| **Authority** | Views region-wide impact dashboard |
| **Baler Operator** | Not in this service — matching & scheduling in Go service |

---

## Frontend UX Mapping

| Screen | Backend calls |
|---|---|
| Farmer dashboard | `GET /contracts?farmerId=...`, `GET /users/me` |
| Create deal | `POST /pricing/quote` → show breakdown → `POST /contracts` |
| Sign contract | `POST /contracts/{id}/sign` |
| Buyer dashboard | `GET /contracts?buyerId=...` (future), `POST /settlements` |
| Authority dashboard | `GET /impact/summary` |

---

## Related Docs

- [03 — API Reference](03-api-reference.md) — endpoint details
- [04 — Pricing Model](04-pricing-model.md) — the money formula
- [09 — Demo Script](09-demo-script.md) — walkthrough