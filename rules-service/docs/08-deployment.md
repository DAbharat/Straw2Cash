# 08 — Deployment

> **Read this when:** you're deploying to AWS.

---

## Deployment Options

### Option A — AWS Lambda (container)

**Setup:**
- Package Spring Boot as Docker container with Lambda Web Adapter
- Deploy as Lambda function
- API Gateway in front for routing

**Pros:**
- Pay-per-request
- Scales to zero
- Cheap for hackathon

**Cons:**
- Cold starts (~1–3 sec)
- Not ideal for streaming

### Option B — AWS App Runner

**Setup:**
- Container deployment
- Auto-scaling managed by AWS

**Pros:**
- No cold starts
- Simpler

**Cons:**
- Pay for idle (minimum instance)

### Recommendation for hackathon demo

**App Runner** — avoid cold start during the live demo.

---

## Containerization

### `Dockerfile`

```dockerfile
FROM public.ecr.aws/amazoncorretto/amazoncorretto:21-alpine
WORKDIR /app
COPY target/rules-service-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=aws"]
```

### Build and push

```bash
# Build jar
mvn clean package -DskipTests

# Build Docker image
docker build -t rules-service:latest .

# Tag and push to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin <account>.dkr.ecr.ap-south-1.amazonaws.com

docker tag rules-service:latest <account>.dkr.ecr.ap-south-1.amazonaws.com/rules-service:latest
docker push <account>.dkr.ecr.ap-south-1.amazonaws.com/rules-service:latest
```

---

## AWS Resources Needed

| Resource | Purpose | Owner |
|---|---|---|
| ECR repository | Docker image storage | Member 1 |
| App Runner service / Lambda function | Compute | Member 1 |
| API Gateway (if Lambda) | HTTP routing | Member 1 |
| DynamoDB tables × 5 | Persistence | IaC |
| SNS topic | Contract notifications | IaC |
| Secrets Manager secret | JWT secret | IaC |
| IAM role | Permissions | IaC |
| CloudWatch log group | Logs | Auto |

---

## Environment Variables

These need to be injected at runtime:

| Var | Value |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `aws` |
| `AWS_REGION` | `ap-south-1` |
| `JWT_SECRET` | From Secrets Manager |

**DynamoDB endpoint:** leave blank in `application-aws.yml` — AWS SDK auto-resolves to real AWS.

---

## DynamoDB Tables — Production Setup

In `local` profile, `DynamoDbTableInitializer` creates tables on startup. **In production, this must be done by IaC, not by the app.**

**Reason:** Lambda/App Runner should not have `CreateTable` permission. Tables are infrastructure.

### Tables to provision

| Table | PK | SK | GSI |
|---|---|---|---|
| `price_rules` | buyerType | version | — |
| `quotes` | quoteId | — | — |
| `contracts` | contractId | — | `farmerId-index` (farmerId) |
| `settlements` | settlementId | — | `contractId-index` (contractId) |
| `users` | userId | — | `phone-index` (phone) |

**Billing mode:** `PAY_PER_REQUEST`

### Seeding in production

- **`price_rules`:** Seed via a one-time script or IaC
- **Demo users:** Do NOT seed in production. Users register.

---

## Health Check

Use `/api/v1/health` as load balancer health check. No auth required.

---

## CI/CD (recommended)

**GitHub Actions workflow:**

```yaml
name: Deploy rules-service

on:
  push:
    branches: [main]
    paths: [rules-service/**]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: 21, distribution: corretto }
      - run: mvn clean package -DskipTests
        working-directory: rules-service
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::xxx:role/github-actions
          aws-region: ap-south-1
      - name: Build & push Docker
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR
          docker build -t $ECR/rules-service:$GITHUB_SHA rules-service
          docker push $ECR/rules-service:$GITHUB_SHA
      - name: Deploy to App Runner
        run: aws apprunner start-deployment --service-arn $APP_RUNNER_ARN
```

---

## Secrets Handling

| Environment | JWT Secret Source |
|---|---|
| Local | Hardcoded in `application.yml` |
| AWS | Secrets Manager → env var `JWT_SECRET` |

**Never commit a real secret to git.**

---

## Rollback Plan

If deployment fails:

1. **App Runner:** Rollback to previous image tag
2. **Lambda:** Point to previous version/alias
3. **DynamoDB:** No rollback needed — schema is stable

---

## Deployment Checklist

- [ ] Dockerfile at `rules-service/Dockerfile`
- [ ] `application-aws.yml` committed
- [ ] DynamoDB tables provisioned via IaC
- [ ] SNS topic created, ARN in `application-aws.yml`
- [ ] JWT secret in Secrets Manager
- [ ] IAM role with `dynamodb:*`, `sns:Publish`, `logs:*` permissions
- [ ] App Runner service / Lambda function configured
- [ ] Health check path set to `/api/v1/health`
- [ ] ECR repository created
- [ ] CI/CD workflow in place

---

## Related Docs

- [01 — Architecture](01-architecture.md) — service internals
- [11 — Roadmap](11-roadmap.md) — production improvements