# 09 — Demo Script

> **Read this when:** it's demo day.

---

## Pre-Demo Checklist

- [ ] Docker Desktop running
- [ ] DynamoDB Local running (`docker ps`)
- [ ] Spring Boot app running (`▶️ Run` in IntelliJ)
- [ ] Console shows `Demo users seeded`
- [ ] `curl http://localhost:8080/api/v1/health` returns `{"status":"UP"}`
- [ ] Browser tab open at `/api/v1/health`
- [ ] Terminal open with base URL
- [ ] Demo credentials card in hand

---

## The 90-Second Walkthrough

> **"This is the money layer of Straw2Cash. When a farmer and buyer agree on a deal, four things have to happen: price it, contract it, sign it, settle it — and then report the impact.**

> **Login as the farmer.** [curl login, show JWT] Every request carries a JWT with a role. No passwords on the wire, no session state.

> **Price the deal.** [curl quote] The farmer has 5.2 tonnes of straw. Our pricing engine applies: base rate for biomass power plants, moisture penalty, grade adjustment — and returns **an itemized breakdown**. The farmer earns ₹13,000. The buyer pays ₹23,140 total, including ₹9,360 transport and a ₹780 platform fee.

> **Generate the contract.** [curl create] The quote becomes a contract in `PENDING_FARMER_SIGNATURE`.

> **Farmer signs.** [curl sign FARMER] Status moves to `PENDING_BUYER_SIGNATURE`.

> **Login as buyer, sign.** [curl login, sign BUYER] Contract is `ACTIVE`. An SNS event fired — in production this would notify both parties.

> **Settle.** [curl settle] Here's the money flow. The buyer's ₹23,140 splits three ways: **₹13,000 to the farmer, ₹9,360 to the transporter, ₹780 to the platform.** All itemized, all idempotent — calling settle twice returns the same record, doesn't double-pay.

> **Log in as the Punjab Pollution Board.** [curl login as authority] And here's the impact story: **10.7 tonnes diverted from burning, ₹26,760 into farmers' pockets, 16 tonnes of CO₂ avoided.** The methodology is in the response — 1.5 tonnes of CO₂ per tonne of straw burned.

> Every transaction uses BigDecimal, JWT auth, and role-based access. **This isn't a demo — it's a system that would survive a business audit."**

---

## The One-Liner

> *"Python says how much residue. Go says who and when. Frontend shows it. **I say what it's worth, who owes whom, and how much pollution we prevented.**"*

---

## Pre-Scripted curl Commands

Copy-paste these in order. Each takes ~5 seconds.

```bash
BASE="http://localhost:8080"

# 1. HEALTH
echo "=== 1. Health ==="
curl $BASE/api/v1/health

# 2. LOGIN FARMER
echo -e "\n\n=== 2. Login as Farmer ==="
FARMER_TOKEN=$(curl -s -X POST $BASE/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9000000001","password":"farmer123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token issued: ${FARMER_TOKEN:0:40}..."

# 3. QUOTE
echo -e "\n\n=== 3. Price the Deal ==="
QUOTE=$(curl -s -X POST $BASE/api/v1/pricing/quote \
  -H "Content-Type: application/json" -H "Authorization: Bearer $FARMER_TOKEN" \
  -d '{"farmerId":"F001","buyerId":"B021","buyerType":"BIOMASS_POWER_PLANT","estimatedTonnes":5.2,"moisturePct":12.0,"grade":"A","distanceKm":40}')
echo "$QUOTE" | python -m json.tool 2>/dev/null || echo "$QUOTE"
QUOTE_ID=$(echo $QUOTE | grep -o '"quoteId":"[^"]*"' | cut -d'"' -f4)

# 4. CONTRACT
echo -e "\n\n=== 4. Create Contract ==="
CONTRACT=$(curl -s -X POST $BASE/api/v1/contracts \
  -H "Content-Type: application/json" -H "Authorization: Bearer $FARMER_TOKEN" \
  -d "{\"quoteId\":\"$QUOTE_ID\",\"deliveryBy\":\"2026-10-20\"}")
CONTRACT_ID=$(echo $CONTRACT | grep -o '"contractId":"[^"]*"' | cut -d'"' -f4)
echo "Contract: $CONTRACT_ID"

# 5. FARMER SIGNS
echo -e "\n\n=== 5. Farmer Signs ==="
curl -s -X POST $BASE/api/v1/contracts/$CONTRACT_ID/sign \
  -H "Content-Type: application/json" -H "Authorization: Bearer $FARMER_TOKEN" \
  -d '{"signer":"FARMER"}'

# 6. LOGIN BUYER
echo -e "\n\n=== 6. Login as Buyer ==="
BUYER_TOKEN=$(curl -s -X POST $BASE/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9000000002","password":"buyer123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Buyer token: ${BUYER_TOKEN:0:40}..."

# 7. BUYER SIGNS
echo -e "\n\n=== 7. Buyer Signs ==="
curl -s -X POST $BASE/api/v1/contracts/$CONTRACT_ID/sign \
  -H "Content-Type: application/json" -H "Authorization: Bearer $BUYER_TOKEN" \
  -d '{"signer":"BUYER"}'

# 8. SETTLE
echo -e "\n\n=== 8. SETTLE — THE MONEY MOMENT ==="
curl -s -X POST $BASE/api/v1/settlements \
  -H "Content-Type: application/json" -H "Authorization: Bearer $BUYER_TOKEN" \
  -d "{\"contractId\":\"$CONTRACT_ID\"}" \
  | python -m json.tool 2>/dev/null

# 9. LOGIN AUTHORITY
echo -e "\n\n=== 9. Login as Authority ==="
AUTH_TOKEN=$(curl -s -X POST $BASE/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9000000003","password":"auth123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 10. IMPACT
echo -e "\n\n=== 10. IMPACT — THE ENVIRONMENTAL STORY ==="
curl -s $BASE/api/v1/impact/summary \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  | python -m json.tool 2>/dev/null

echo -e "\n\n=== Demo Complete ==="
```

---

## Judge Q&A — Anticipated Questions

| Question | Answer |
|---|---|
| "Why 6% platform fee?" | "Marketplace standard. Configurable in the pricing rules table — no code change needed." |
| "What if the buyer doesn't pay?" | "Escrow-style flow. In production, funds held until both parties confirm. Simulated here." |
| "How do you handle disputes?" | "Signature timestamps + immutable contracts. Arbitration flow is production roadmap." |
| "Is the CO₂ number real?" | "1.5 t CO₂e per tonne straw — a commonly cited agricultural factor. Methodology disclosed in the API response. Production would cite specific IPCC source." |
| "Why DynamoDB?" | "Serverless, scales to zero, cost-efficient for marketplace traffic. Relational would be overkill." |
| "What about multi-region?" | "Single-region for hackathon. DynamoDB Global Tables + multi-region App Runner in production." |
| "Can it handle real money?" | "Not yet — simulated. Production requires Razorpay/UPI, KYC, GST, escrow account." |
| "Why JWT over sessions?" | "Stateless — scales horizontally without sticky sessions. Format is Cognito-compatible for future swap." |
| "What happens if the DB goes down?" | "App Runner would show unhealthy; CloudWatch alarm fires. No retry logic in current version — production would add circuit breakers." |

---

## Screenshots to Have Ready

Save these locally as backup:

1. Health endpoint responding
2. Login response (with JWT visible)
3. Quote response (with breakdown[])
4. Contract in PENDING_FARMER_SIGNATURE
5. Contract in ACTIVE
6. Settlement response (the 3-flow diagram)
7. Impact summary

If live demo fails, switch to screenshots.

---

## Recovery Plan

If something breaks during demo:

1. **App crashes** → restart IntelliJ run
2. **DynamoDB unreachable** → `docker-compose up -d`
3. **Login fails** → wait 5 sec, restart app, demo users re-seed
4. **Wrong role error** → you used the wrong token — re-login as correct role
5. **Everything broken** → switch to screenshots

---

## Related Docs

- [02 — Getting Started](02-getting-started.md) — setup
- [03 — API Reference](03-api-reference.md) — endpoint details
- [10 — Troubleshooting](10-troubleshooting.md) — fixes