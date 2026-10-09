# 04 — Pricing Model

> **Read this when:** you need to understand how deal prices are calculated.

---

## The Formula

### Per-tonne price

```
pricePerTonne = baseRate
              − moisturePenalty
              + gradeAdjustment
```

### Amounts

```
grossAmount     = pricePerTonne × estimatedTonnes
transportCost   = distanceKm × distanceRatePerKmTonne × estimatedTonnes
platformFee     = grossAmount × 6%
buyerPays       = grossAmount + transportCost + platformFee
netToFarmer     = grossAmount
```

**Key design:** Transport is charged **separately to the buyer** and is **NOT deducted from the farmer's earnings**. The farmer's net income is exactly `pricePerTonne × tonnes`. Clean story.

---

## Seeded Rules (v1)

| Buyer Type | Base (₹/t) | Dist (₹/km/t) | Moisture Threshold (%) | Moisture Penalty (₹/t per %) | Grade A | Grade B | Grade C |
|---|---|---|---|---|---|---|---|
| BIOMASS_POWER_PLANT | 2500 | 45 | 14 | 80 | +0 | −100 | −250 |
| BRICK_KILN | 1800 | 40 | 16 | 70 | +0 | −80 | −200 |
| PAPER_MILL | 2200 | 50 | 12 | 90 | +50 | −100 | −250 |
| CATTLE_FEED_MAKER | 3000 | 55 | 18 | 60 | +100 | −100 | −300 |

Stored in the `price_rules` DynamoDB table (PK = buyerType, SK = "v1"). Updated without redeployment.

---

## Worked Examples

### Example 1 — Clean biomass deal

**Input:**
```
buyerType:     BIOMASS_POWER_PLANT
tonnes:        5.2
moisturePct:   12.0
grade:         A
distanceKm:    40
```

**Calculation:**
```
baseRate         = 2500
moisturePenalty  = 0          (12 ≤ 14)
gradeAdjustment  = 0          (Grade A)
pricePerTonne    = 2500

grossAmount      = 2500 × 5.2 = 13,000
transportCost    = 45 × 40 × 5.2 = 9,360
platformFee      = 6% × 13000 = 780
buyerPays        = 13000 + 9360 + 780 = 23,140
netToFarmer      = 13,000
```

### Example 2 — Wet, lower grade

**Input:**
```
buyerType:     BIOMASS_POWER_PLANT
tonnes:        3.0
moisturePct:   18.0
grade:         B
distanceKm:    20
```

**Calculation:**
```
baseRate         = 2500
moisturePenalty  = (18 − 14) × 80 = 320
gradeAdjustment  = −100 (Grade B)
pricePerTonne    = 2500 − 320 − 100 = 2,080

grossAmount      = 2080 × 3.0 = 6,240
transportCost    = 45 × 20 × 3.0 = 2,700
platformFee      = 6% × 6240 = 374.40
buyerPays        = 6240 + 2700 + 374.40 = 9,314.40
netToFarmer      = 6,240
```

### Example 3 — Premium cattle feed

**Input:**
```
buyerType:     CATTLE_FEED_MAKER
tonnes:        2.5
moisturePct:   10.0
grade:         A
distanceKm:    15
```

**Calculation:**
```
baseRate         = 3000
moisturePenalty  = 0          (10 ≤ 18)
gradeAdjustment  = +100       (Grade A premium)
pricePerTonne    = 3100

grossAmount      = 3100 × 2.5 = 7,750
transportCost    = 55 × 15 × 2.5 = 2,062.50
platformFee      = 6% × 7750 = 465
buyerPays        = 7750 + 2062.50 + 465 = 10,277.50
netToFarmer      = 7,750
```

---

## The Breakdown Array

Every quote response includes a `breakdown[]` array — this is what the frontend renders line-by-line. For Example 1:

```json
[
  {"label": "Base price (BIOMASS_POWER_PLANT)", "value": 2500},
  {"label": "Moisture penalty (12.0%)",          "value": 0},
  {"label": "Grade A adjustment",                "value": 0},
  {"label": "Net price per tonne to farmer",     "value": 2500.00},
  {"label": "Transport cost (40 km)",            "value": 9360.00},
  {"label": "Platform fee (6%)",                 "value": 780.00}
]
```

**Why this matters for judges:** The math is not a black box. Every rupee is accounted for.

---

## Money Precision Rules

| Rule | Value |
|---|---|
| Type | `java.math.BigDecimal` |
| Scale | 2 decimal places |
| Rounding | `HALF_UP` |
| Never use | `double`, `float` |

Every monetary value is `BigDecimal`. Non-negotiable for financial logic.

---

## Updating Pricing Rules

To change rates without redeploying:

1. Update the `price_rules` DynamoDB record for the buyer type
2. Bump version (e.g., `v1` → `v2`)
3. Update `PriceRuleRepository.findActive()` to fetch the new version, OR
4. Overwrite the `v1` record (simpler for hackathon)

For the hackathon, all versions are `v1` and are re-seeded on every startup.

---

## What's NOT in the formula (yet)

- **Seasonality** — prices could vary by harvest season
- **Volume discounts** — bulk buyers could get better rates
- **Loyalty pricing** — repeat farmers could get bonuses
- **Carbon credits** — verified diversion could earn extra revenue
- **Government subsidies** — MSP-style floor prices

These are future features, noted in [11 — Roadmap](11-roadmap.md).

---

## Related Docs

- [03 — API Reference](03-api-reference.md) — the quote endpoint
- [06 — Workflows](06-workflows.md) — how pricing feeds into contracts