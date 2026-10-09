# 10 — Troubleshooting

> **Read this when:** something broke and you need a fix fast.

---

## Login / Auth Issues

### `Invalid phone or password` for demo users

**Cause:** `-inMemory` DynamoDB wiped the `users` table.

**Fix:** Wait 5 seconds after app startup. Look for `Demo users seeded` in console. Users are re-seeded automatically.

### 401 Unauthorized on protected endpoint

**Cause:** No `Authorization: Bearer <token>` header, or token expired.

**Fix:**
1. Re-login: `POST /api/v1/auth/login`
2. Copy the `token` field
3. Add header: `Authorization: Bearer <token>`

### 403 Forbidden when settling or viewing impact

**Cause:** Wrong role.

**Fix:**
- `POST /settlements` → only BUYER can call
- `GET /impact/summary` → only AUTHORITY can call
- Re-login with the correct demo user

---

## Build / IDE Issues

### `ExceptionInInitializerError` on JDK 24

**Cause:** Older Lombok versions don't recognize JDK 24 class files.

**Fix (already applied in project):**
1. `lombok.version` set to `1.18.36` in `pom.xml`
2. IntelliJ: `Settings → Build, Execution, Deployment → Build Tools → Maven → Runner` → ✅ **Delegate IDE build/run actions to Maven**

### `Cannot resolve method 'setX(...)'` compile error

**Cause:** Missing setter on an entity. Happens when a getter block is deleted while adding an annotation.

**Fix:** Every field needs both getter and setter:
```java
@DynamoDbSecondaryPartitionKey(indexNames = "phone-index")
public String getPhone() { return phone; }

public void setPhone(String phone) { this.phone = phone; }   // ← don't forget
```

### IntelliJ shows red errors but `mvn` builds fine

**Cause:** IntelliJ cache out of sync.

**Fix:**
1. `File → Invalidate Caches...` → check all boxes → **Invalidate and Restart**
2. After restart, wait for indexing
3. Maven panel → 🔄 Reload All Maven Projects

---

## Runtime Issues

### Port 8080 already in use

**Cause:** Previous app instance didn't stop cleanly.

**Fix (Windows PowerShell):**
```powershell
netstat -ano | findstr :8080
taskkill /PID <pid> /F
```

**Fix (Git Bash):**
```bash
netstat -ano | grep :8080
taskkill //PID <pid> //F
```

### `The table does not have the specified index: farmerId-index`

**Cause:** Table exists but is missing the GSI (created before GSI was added to initializer).

**Fix:**
1. Ensure `docker-compose.yml` uses `-inMemory`
2. Stop and remove container: `docker rm -f dynamodb-local`
3. Restart: `docker-compose up -d`
4. Restart Spring Boot — tables rebuild fresh

### App starts but tables don't get created

**Cause:** `DynamoDbTableInitializer` is `@Profile("local")` — only runs in `local` profile.

**Fix:** Check `application.yml`:
```yaml
spring:
  profiles:
    active: local
```

### Invalid credentials for AWS DynamoDB Local

**Symptom:** App tries to hit real AWS instead of local.

**Cause:** `application.yml` missing or has wrong `aws.dynamodb.endpoint`.

**Fix:** Ensure it has:
```yaml
aws:
  dynamodb:
    endpoint: http://localhost:8000
```

---

## Docker Issues

### `error during connect: open //./pipe/dockerDesktopLinuxEngine`

**Cause:** Docker Desktop not running.

**Fix:**
1. Launch Docker Desktop from Start Menu
2. Wait 30–60 seconds for whale icon to stabilize
3. Run `docker ps` to confirm
4. Then `docker-compose up -d`

### Container name is `sharp_bhabha` instead of `dynamodb-local`

**Cause:** Container was created by older compose file or `docker run` without `container_name`.

**Fix:**
```bash
docker rm -f <random-name>
docker-compose up -d    # uses container_name: dynamodb-local
```

### Data persists across restarts (should wipe with `-inMemory`)

**Cause:** Old container has a mounted volume.

**Fix:**
```bash
docker rm -f dynamodb-local
docker volume prune -f
rm -rf ./docker/dynamodb    # if it exists
docker-compose up -d
```

---

## API Behavior Issues

### Quote reuse fails

**Symptom:** `POST /contracts` with a previously used quoteId returns `CONTRACT_ERROR: Quote already used`.

**This is correct behavior** — quotes are single-use. Create a new quote.

### Cannot sign as buyer before farmer signs

**Symptom:** `CONTRACT_ERROR: Not waiting for buyer signature. Current: PENDING_FARMER_SIGNATURE`.

**This is correct behavior** — signature order is enforced. Farmer signs first.

### Settle fails on unsigned contract

**Symptom:** `SETTLEMENT_ERROR: Contract must be ACTIVE to settle. Current: PENDING_FARMER_SIGNATURE`.

**This is correct behavior** — contract must be fully signed before payment.

### Double settle returns same record

**Symptom:** Calling settle twice returns the same settlementId.

**This is correct behavior** — settlement is idempotent to prevent double payments.

---

## Data Issues

### Lost all test data after restart

**Cause:** `-inMemory` DynamoDB wipes on restart — by design.

**Fix:** Complete demo flows without restarting. Or switch to persistent DynamoDB (see below).

### Want persistent data for final demo

**Fix:** Change `docker-compose.yml`:
```yaml
command: "-jar DynamoDBLocal.jar -sharedDb -dbPath ./data"
volumes:
  - ./docker/dynamodb:/home/dynamodblocal/data
```

**Warning:** You'll need to wipe the volume manually whenever you change table schemas. This is why we default to `-inMemory` for development.

---

## Performance Issues

### Slow startup

**Cause:** Maven download on first build, or JVM cold start.

**Fix:** First build downloads ~200MB of dependencies. Subsequent builds are fast. Cold start on Lambda adds 1–3 sec.

### Slow impact endpoint

**Cause:** Scans all settlements on every call.

**Fix:** Acceptable for hackathon. Production → pre-aggregate via DynamoDB Streams.

---

## Log Analysis

### Find the actual error

In IntelliJ console, scroll to bottom. Look for:
```
[ERROR] ...
```

Or filter for exceptions:
```
ERROR | Exception | Caused by
```

### Enable debug logging

Edit `application.yml`:
```yaml
logging:
  level:
    com.strawmarket: DEBUG
    software.amazon.awssdk: DEBUG    # very verbose
```

Restart.

---

## Getting Unstuck

**Nuclear reset (loses all data):**
```bash
# Stop Spring Boot in IntelliJ

# Kill and recreate DynamoDB
docker rm -f dynamodb-local
docker volume prune -f
rm -rf ./docker/dynamodb

# Fresh start
docker-compose up -d
mvn clean install -DskipTests -U

# Restart Spring Boot in IntelliJ
```

**Still broken?** Check:
1. `docker ps` — is DynamoDB running?
2. `curl http://localhost:8000` — does it respond?
3. `curl http://localhost:8080/api/v1/health` — does the app respond?
4. Console output — any exceptions?
5. `git status` — any uncommitted changes?

---

## Related Docs

- [02 — Getting Started](02-getting-started.md) — setup
- [09 — Demo Script](09-demo-script.md) — demo recovery plan