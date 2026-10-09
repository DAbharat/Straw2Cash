# 02 — Getting Started

> **Read this when:** you're setting up the service locally for the first time.

---

## Prerequisites

| Tool | Minimum | Why |
|---|---|---|
| JDK | 17 (24 works too) | Spring Boot 3 requires 17+ |
| Maven | 3.9 | Build tool |
| Docker Desktop | Latest | For DynamoDB Local |
| IntelliJ IDEA | Community or Ultimate | IDE |
| Git | Latest | Version control |

**Verify:**
```bash
java -version      # 17.x or 24.x
mvn -version       # 3.9.x
docker --version   # Docker Desktop running
```

---

## First-Time Setup

### 1. Clone and navigate

```bash
git clone <repo-url>
cd Straw2Cash/rules-service
```

### 2. Start DynamoDB Local

```bash
docker-compose up -d
```

Wait 3–5 seconds.

**Verify it's alive:**
```bash
curl http://localhost:8000
```

Expected (this "error" is normal — means it's running):
```json
{"__type":"com.amazonaws.dynamodb.v20120810#MissingAuthenticationToken",...}
```

### 3. Build the project

```bash
mvn clean install -DskipTests -U
```

First build takes 2–5 minutes (downloads dependencies). Expected: `BUILD SUCCESS`.

### 4. Run the app

```bash
mvn spring-boot:run
```

Or click ▶️ in IntelliJ.

**Watch for these lines in the startup console:**
```
Creating table price_rules
Creating table quotes
Creating table contracts with GSI farmerId-index
Creating table settlements with GSI contractId-index
Creating table users with GSI phone-index
Price rules seeded
Demo users seeded
Tomcat started on port 8080
```

### 5. Verify it's up

```bash
curl http://localhost:8080/api/v1/health
```

Expected:
```json
{"status":"UP","service":"rules-service","timestamp":"..."}
```

---

## `docker-compose.yml`

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

**Why `-inMemory`?** Tables wipe on every restart, and the initializer rebuilds them fresh with correct GSIs. Eliminates stale-schema problems.

---

## Daily Routine

### Morning

```bash
# 1. Ensure Docker Desktop is running (from Start Menu / system tray)
# 2. Wait ~30 seconds for it to be ready

cd /d/Coding/Straw2Cash/rules-service
docker-compose up -d

# 3. In IntelliJ: click ▶️ Run
```

**Verify before starting Spring Boot:**
```bash
curl http://localhost:8000
# Should return MissingAuthenticationToken error
```

### Evening

```bash
# 1. In IntelliJ: click red ■ Stop
docker stop dynamodb-local
```

**Never `docker rm` at night** — just `stop`. `docker-compose up -d` in the morning restarts the same container.

---

## IDE Setup (IntelliJ)

1. **Open the correct folder:**
   `File → Open` → select `Straw2Cash/rules-service` (not the parent).

2. **Verify JDK:**
   `File → Project Structure → Project`
    - SDK: `17` or `24`
    - Language level: `21 - Record patterns, pattern matching for switch`

3. **Enable annotation processing:**
   `Settings → Build, Execution, Deployment → Compiler → Annotation Processors`
    - ✅ Check **Enable annotation processing**

4. **Delegate builds to Maven** (critical for JDK 24 + Lombok):
   `Settings → Build, Execution, Deployment → Build Tools → Maven → Runner`
    - ✅ Check **Delegate IDE build/run actions to Maven**

5. **Reload Maven:**
   Right edge → Maven panel → click 🔄 **Reload All Maven Projects**

---

## Configuration Files

### `application.yml` (local profile)

```yaml
spring:
  application:
    name: rules-service
  profiles:
    active: local

server:
  port: 8080

aws:
  region: ap-south-1
  dynamodb:
    endpoint: http://localhost:8000
  sns:
    contract-events-topic-arn: ""

jwt:
  secret: "change-this-secret-in-prod-use-a-32-byte-minimum-string-1234567890"
  expiration-seconds: 86400

logging:
  level:
    com.strawmarket: DEBUG
    software.amazon.awssdk: INFO
```

### `application-aws.yml` (AWS profile)

```yaml
aws:
  dynamodb:
    endpoint: ""
  sns:
    contract-events-topic-arn: "arn:aws:sns:ap-south-1:xxxx:contract-events"

jwt:
  secret: "${JWT_SECRET}"

logging:
  level:
    com.strawmarket: INFO
```

---

## First-Run Smoke Test

After the app starts, run this minimal flow to confirm everything works:

```bash
# 1. Health
curl http://localhost:8080/api/v1/health

# 2. Login as farmer
FARMER_TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9000000001","password":"farmer123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token length: ${#FARMER_TOKEN}"   # Should be > 100

# 3. Authenticated call
curl http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer $FARMER_TOKEN"
```

If you see the user's profile → **you're ready**.

Full test suite → [09 — Demo Script](09-demo-script.md)

---

## Next Steps

- [03 — API Reference](03-api-reference.md) — try every endpoint
- [04 — Pricing Model](04-pricing-model.md) — understand the numbers
- [05 — Auth & Roles](05-auth-and-roles.md) — get tokens, understand roles

---

## Related Docs

- [01 — Architecture](01-architecture.md)
- [10 — Troubleshooting](10-troubleshooting.md) — if something breaks