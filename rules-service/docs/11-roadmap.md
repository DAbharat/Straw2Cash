# 11 — Roadmap (Beyond Hackathon)

> **Read this when:** you're thinking past the demo.

---

## Payment & Money

### Real payment gateway

**Current:** Simulated escrow.
**Production:**
- Razorpay / Cashfree / PayU integration
- Escrow account with NPCI / bank partner
- Webhook handling for payment status
- Refund flow
- GST-compliant invoicing

### Reconciliation

**Current:** None.
**Production:**
- Daily reconciliation reports
- Mismatch alerts
- Manual override workflow

---

## Authentication

### Real AWS Cognito

**Current:** Local JWT issuer.
**Production:**
- Cognito User Pool with phone sign-up
- MFA
- Verify against Cognito's public key (JWKS)
- Roles in Cognito groups

**Why easy:** JWT format is already Cognito-compatible.

### Additional auth features

- Refresh tokens
- Password reset flow
- Email/phone verification
- Login rate limiting (anti-brute-force)

---

## Documents

### PDF contract generation

**Current:** JSON only.
**Production:**
- Wire OpenPDF (dependency present)
- Generate bilingual contract (Hindi/Punjabi/English)
- Store in S3
- Return pre-signed URL

### Digital signatures

**Current:** Timestamps only.
**Production:**
- Aadhaar e-Sign integration
- Legally enforceable contracts

---

## Architecture

### Event-driven design

**Current:** Synchronous REST.
**Production:**
- SQS queues between services
- EventBridge for cross-service events
- Idempotency keys everywhere

### Pre-aggregated impact

**Current:** Scan-all-settlements on every impact call.
**Production:**
- DynamoDB Streams on `settlements`
- Lambda updates `impact_counters` table
- Impact call reads from counters (O(1) vs O(n))

### Regional + date filtering

**Current:** Stubbed (params accepted, ignored).
**Production:**
- Add `region` to settlement record (denormalized)
- GSI on `region + settledAt`
- Real filtering

---

## Observability

### Distributed tracing

- AWS X-Ray across all services
- Trace IDs propagated via headers

### Metrics

- CloudWatch custom metrics:
    - Contracts created per hour
    - Settlements per hour
    - Average price per tonne
    - Failed signature attempts

### Alarms

- Error rate > 1%
- Settlement failure
- DynamoDB throttling
- Lambda cold start > 3 sec

### Dashboards

- CloudWatch Logs Insights
- Business metrics (tonnes/day, ₹/day)

---

## Security

### Secrets management

**Current:** JWT secret in `application.yml`.
**Production:** AWS Secrets Manager, rotated regularly.

### Rate limiting

**Current:** None.
**Production:**
- API Gateway throttling
- Per-user quotas
- Per-IP limits on login

### Audit log

**Current:** None.
**Production:**
- Append-only `audit_log` table
- Every state change written
- Tamper-evident (hash chain)

### Data privacy

- PII encryption at rest
- GDPR/DPDP compliance
- Right to deletion

---

## Scale

### DynamoDB autoscaling

**Current:** PAY_PER_REQUEST.
**Production:** Consider provisioned + autoscaling for predictable loads.

### Multi-region

**Current:** Single-region (ap-south-1).
**Production:**
- DynamoDB Global Tables
- Multi-region App Runner
- Route 53 latency-based routing

### Caching

- ElastiCache for pricing rules
- CloudFront for static assets

---

## Business Features

### Pricing

- Seasonality (harvest season pricing)
- Volume discounts
- Loyalty pricing
- Carbon credits
- Government MSP floor prices

### Contracting

- Multi-party contracts (farmer + baler + transporter + buyer)
- Recurring contracts (weekly pickup)
- Contract templates
- Penalties for no-show

### Matching

- (Go service owns this, but we'd consume more data)
- Quality-based matching
- Distance optimization
- Time-window optimization

### Impact

- Real CO₂ measurement (not just factor)
- Third-party verification
- Carbon credit issuance
- CSR reporting exports

---

## Testing

### Unit tests

**Current:** None.
**Production:**
- JUnit 5 + Mockito
- > 80% coverage on service layer

### Integration tests

- Testcontainers for DynamoDB Local
- Full flow tests
- Contract tests against Go/Python/Frontend stubs

### Load testing

- Gatling or k6
- Target: 100 concurrent users

---

## Deployment

### Infrastructure as Code

**Current:** Manual + docker-compose.
**Production:**
- AWS CDK or Terraform
- All resources version-controlled
- One-click environment provisioning

### Blue/green deployments

- Canary releases
- Automatic rollback on error rate spike

### Disaster recovery

- Cross-region backups
- RPO: 1 hour
- RTO: 4 hours

---

## Compliance

### Regulatory

- GST registration
- Payment gateway compliance (PCI-DSS)
- Agricultural commodity trading rules
- State-specific stubble-burning regulations

### Data

- Data localization (India)
- Consent management
- Right to deletion
- Data processing agreements

---

## Priority Order (For Real Buildout)

1. **Real payment gateway** — money is the whole point
2. **Real Cognito** — security
3. **PDF contracts** — legal enforceability
4. **Pre-aggregated impact** — scale
5. **Rate limiting** — abuse prevention
6. **Audit log** — compliance
7. **Distributed tracing** — debuggability
8. **Multi-region** — resilience
9. **IaC** — reproducibility
10. **Advanced pricing** — business sophistication

---

## Related Docs

- [01 — Architecture](01-architecture.md)
- [08 — Deployment](08-deployment.md)