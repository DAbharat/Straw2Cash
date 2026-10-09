# 05 — Auth & Roles

> **Read this when:** you're integrating auth into the frontend or debugging login issues.

---

## Overview

- **Login identifier:** Phone number (rural-friendly, no email)
- **Password hashing:** BCrypt
- **Token:** JWT signed HMAC-SHA256
- **Lifetime:** 24 hours (configurable)
- **Storage:** Client-side only (stateless server)

---

## Demo Credentials

Auto-seeded on startup.

| Role | Phone | Password | Name |
|---|---|---|---|
| **FARMER** | `9000000001` | `farmer123` | Gurpreet Singh |
| **BUYER** | `9000000002` | `buyer123` | Punjab Biomass Pvt Ltd |
| **AUTHORITY** | `9000000003` | `auth123` | Punjab Pollution Board |

`BALER_OPERATOR` has no seeded user — register on the fly if needed.

---

## Register

```http
POST /api/v1/users/register
Content-Type: application/json

{
  "phone": "9000000004",
  "name": "Test User",
  "password": "test1234",
  "role": "FARMER",
  "region": "PB"
}
```

**Response:** `UserResponse` (no token — must login separately).

---

## Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{"phone": "9000000001", "password": "farmer123"}
```

**Response:**
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

### Using the token

Add the header to every protected request:

```
Authorization: Bearer <token>
```

---

## JWT Structure

Payload (decoded):
```json
{
  "sub": "U-5144d652",
  "role": "FARMER",
  "region": "PB",
  "iat": 1728456789,
  "exp": 1728543189
}
```

The token is signed but not encrypted — don't put secrets in it.

---

## Role-Based Access Matrix

| Endpoint | FARMER | BUYER | AUTHORITY | BALER_OP |
|---|---|---|---|---|
| `GET  /api/v1/health` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/auth/login` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/users/register` | ✅ | ✅ | ✅ | ✅ |
| `GET  /api/v1/users/me` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/pricing/quote` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/contracts` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/contracts/{id}/sign` | ✅ | ✅ | ✅ | ✅ |
| `GET  /api/v1/contracts/{id}` | ✅ | ✅ | ✅ | ✅ |
| `GET  /api/v1/contracts?farmerId=` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/settlements` | ❌ 403 | ✅ | ❌ 403 | ❌ 403 |
| `GET  /api/v1/settlements/{id}` | ✅ | ✅ | ✅ | ✅ |
| `GET  /api/v1/impact/summary` | ❌ 403 | ❌ 403 | ✅ | ❌ 403 |

**Legend:** ✅ allowed · ❌ 403 forbidden · ❌ 401 unauthenticated

---

## How It Works Internally

1. Client sends `Authorization: Bearer <token>`
2. `JwtAuthFilter` intercepts the request
3. Parses and verifies signature using shared secret
4. Extracts `userId`, `role`, `region`
5. Creates Spring Security `Authentication` with `ROLE_<role>` authority
6. Puts it in `SecurityContextHolder`
7. `SecurityConfig` rules evaluate against it
8. On success, controller executes; on failure, 401 or 403

---

## SecurityConfig Rules

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/v1/health").permitAll()
    .requestMatchers("/api/v1/auth/**").permitAll()
    .requestMatchers("/api/v1/users/register").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/impact/summary").hasRole("AUTHORITY")
    .requestMatchers(HttpMethod.POST, "/api/v1/settlements").hasRole("BUYER")
    .anyRequest().authenticated()
)
.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
```

---

## Cognito Swap Path

The JWT format is **Cognito-compatible**. To swap:

1. Provision Cognito User Pool with same roles
2. Change `JwtService` to verify against Cognito's public key (JWKS)
3. Move JWT secret from `application.yml` to Secrets Manager
4. No client-side changes needed

This is why we chose this format — future-proof without extra work now.

---

## Security Limitations (documented)

- ❌ No refresh tokens (re-login after 24h)
- ❌ No email verification
- ❌ No password reset flow
- ❌ No MFA
- ❌ JWT secret in `application.yml` (production uses Secrets Manager)
- ❌ No login rate limiting

All acceptable for hackathon scope. Production roadmap → [11 — Roadmap](11-roadmap.md).

---

## Frontend Integration Checklist

- [ ] Store JWT after login (`localStorage` or `sessionStorage`)
- [ ] Attach `Authorization: Bearer <token>` on every protected request
- [ ] On 401 → clear token, redirect to login
- [ ] On 403 → show "not allowed" message, don't redirect
- [ ] Decode JWT to display current user's role/name in UI
- [ ] Handle token expiry (24h) — check `exp` claim before requests

---

## Related Docs

- [03 — API Reference](03-api-reference.md) — endpoint details
- [07 — Integrations](07-integrations.md) — how Go and Frontend use auth