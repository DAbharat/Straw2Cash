# Straw2Cash Go Backend Architecture Guide

## 1. Purpose

This document defines the architecture, folder structure, responsibilities, dependency flow, coding conventions, and database access pattern for the Straw2Cash Go backend.

Any developer or coding agent working on the Go backend must follow this architecture when creating or modifying files.

The backend follows a layered architecture:

```text
HTTP Request
     |
     v
  Handler
     |
     v
  Service
     |
     v
Repository
     |
     v
   sqlc
     |
     v
PostgreSQL
```

The reverse path is:

```text
PostgreSQL
     |
     v
   sqlc
     |
     v
Repository
     |
     v
  Service
     |
     v
  Handler
     |
     v
HTTP Response
```

The main responsibilities are:

- `Handler`: HTTP layer
- `Service`: business logic
- `Repository`: data-access abstraction
- `sqlc`: type-safe generated database access
- `queries`: SQL queries written by developers
- `PostgreSQL`: persistent data storage
- `main.go`: application initialization and dependency injection

The architecture intentionally keeps business logic away from HTTP handlers and SQL access away from services.

---

# 2. Core Architecture Rule

The most important rule is:

```text
Handler -> Service -> Repository -> sqlc -> PostgreSQL
```

Dependencies must flow in this direction.

A lower layer must never depend on a higher layer.

For example:

```text
Handler
  can depend on Service

Service
  can depend on Repository

Repository
  can depend on sqlc / database layer

sqlc
  provides generated database access

PostgreSQL
  stores persistent data
```

The following patterns are not allowed:

```text
Handler -> PostgreSQL

Handler -> sqlc

Service -> PostgreSQL

Service -> HTTP request/response objects

Service -> Gorilla Mux

Repository -> Handler

Repository -> Service
```

The goal is separation of responsibilities.

---

# 3. Recommended Folder Structure

The Go backend should follow this structure:

```text
go-backend/
|
├── cmd/
│   └── api/
│       └── main.go
|
├── internal/
│   ├── auth/
│   │   ├── jwt.go
│   │   └── password.go
│   │
│   ├── db/
│   │   ├── config/
│   │   │   └── config.go
│   │   │
│   │   ├── migrations/
│   │   │   ├── 001_create_users_table.up.sql
│   │   │   ├── 001_create_users_table.down.sql
│   │   │   ├── 002_create_farmer_profiles_table.up.sql
│   │   │   ├── 002_create_farmer_profiles_table.down.sql
│   │   │   ├── 003_create_buyer_profiles_table.up.sql
│   │   │   ├── 003_create_buyer_profiles_table.down.sql
│   │   │   ├── 004_create_baler_profiles_table.up.sql
│   │   │   ├── 004_create_baler_profiles_table.down.sql
│   │   │   ├── 005_create_straw_listings_table.up.sql
│   │   │   ├── 005_create_straw_listings_table.down.sql
│   │   │   ├── 006_create_buyer_requirements_table.up.sql
│   │   │   ├── 006_create_buyer_requirements_table.down.sql
│   │   │   ├── 007_create_matches_table.up.sql
│   │   │   └── 007_create_matches_table.down.sql
│   │   │
│   │   ├── queries/
│   │   │   ├── users.sql
│   │   │   ├── farmer_profiles.sql
│   │   │   ├── buyer_profiles.sql
│   │   │   ├── baler_profiles.sql
│   │   │   ├── straw_listings.sql
│   │   │   ├── buyer_requirements.sql
│   │   │   └── matches.sql
│   │   │
│   │   ├── sqlc/
│   │   │   ├── db.go
│   │   │   ├── models.go
│   │   │   ├── users.sql.go
│   │   │   ├── farmer_profiles.sql.go
│   │   │   ├── buyer_profiles.sql.go
│   │   │   ├── baler_profiles.sql.go
│   │   │   ├── straw_listings.sql.go
│   │   │   ├── buyer_requirements.sql.go
│   │   │   └── matches.sql.go
│   │   │
│   │   └── postgres.go
│   │
│   ├── dto/
│   │   ├── auth_dto.go
│   │   ├── farmer_dto.go
│   │   ├── buyer_dto.go
│   │   ├── baler_dto.go
│   │   ├── listing_dto.go
│   │   └── booking_dto.go
│   │
│   ├── handler/
│   │   ├── auth_handler.go
│   │   ├── farmer_handler.go
│   │   ├── buyer_handler.go
│   │   ├── baler_handler.go
│   │   ├── listing_handler.go
│   │   ├── matching_handler.go
│   │   └── booking_handler.go
│   │
│   ├── httpx/
│   │   ├── response.go
│   │   └── errors.go
│   │
│   ├── middleware/
│   │   ├── auth.go
│   │   ├── logging.go
│   │   ├── cors.go
│   │   └── recovery.go
│   │
│   ├── redis/
│   │   └── redis.go
│   │
│   ├── repository/
│   │   ├── user_repository.go
│   │   ├── farmer_repository.go
│   │   ├── buyer_repository.go
│   │   ├── baler_repository.go
│   │   ├── listing_repository.go
│   │   ├── requirement_repository.go
│   │   └── match_repository.go
│   │
│   ├── router/
│   │   └── router.go
│   │
│   ├── service/
│   │   ├── auth_service.go
│   │   ├── farmer_service.go
│   │   ├── buyer_service.go
│   │   ├── baler_service.go
│   │   ├── listing_service.go
│   │   ├── matching_service.go
│   │   └── booking_service.go
│   │
│   └── storage/
│       └── storage.go
|
├── docs/
│   └── ...
|
├── sqlc.yaml
├── go.mod
├── go.sum
├── Dockerfile
├── docker-compose.yml
└── README.md
```

The exact number of files can change as the application grows, but the architectural responsibilities must remain the same.

---

# 4. `internal` Directory

The `internal` directory contains the core application logic.

## `internal/auth`

Authentication-related functionality.

Examples:

```text
JWT generation and validation
Password hashing
Authentication helpers
```

Authentication business rules should remain in the appropriate service layer rather than being scattered throughout authentication utilities.

---

## `internal/db`

Everything directly related to PostgreSQL and database access infrastructure.

It contains:

```text
internal/db/
├── config/
├── migrations/
├── queries/
├── sqlc/
└── postgres.go
```

### `config`

Database-related configuration if needed.

### `migrations`

Database schema changes.

### `queries`

Handwritten SQL queries used by sqlc.

### `sqlc`

Generated Go code produced by sqlc.

### `postgres.go`

PostgreSQL connection initialization.

---

## `internal/dto`

DTO means Data Transfer Object.

DTOs represent data exchanged through the API.

For example:

```go
type CreateListingRequest struct {
    QuantityKg   float64 `json:"quantity_kg"`
    CropType     string  `json:"crop_type"`
    HarvestDate  string  `json:"harvest_date"`
}
```

DTOs are not database models.

---

## `internal/handler`

The HTTP layer.

Handlers:

- receive HTTP requests
- read URL parameters
- decode JSON
- perform basic request validation
- call services
- convert service errors into HTTP responses
- return JSON responses
- choose HTTP status codes

Handlers must not contain business logic.

---

## `internal/httpx`

Shared HTTP utilities.

Examples:

```text
JSON response helpers
Error response helpers
Request parsing helpers
Common HTTP utilities
```

This package should remain small and focused.

---

## `internal/middleware`

HTTP middleware.

Examples:

```text
Authentication
Authorization
Logging
CORS
Request ID
Rate limiting
Panic recovery
```

Middleware should not contain core Straw2Cash business logic.

---

## `internal/redis`

Redis connection and Redis-specific infrastructure.

Redis can be used for things such as:

```text
Caching
Temporary state
Rate limiting
Session-related data
```

The exact use depends on the final implementation.

---

## `internal/repository`

Data-access layer.

Repositories communicate with:

```text
sqlc
PostgreSQL
Redis where appropriate
```

Repositories should retrieve and persist data.

They should not make business decisions.

---

## `internal/router`

Defines API routes and connects routes to handlers.

For example:

```text
POST /api/listings
        |
        v
listingHandler.CreateListing
```

---

## `internal/service`

Business logic layer.

This is the main application/business layer.

Examples:

```text
Matching farmers with buyers
Finding suitable balers
Checking booking conflicts
Validating business rules
Handling booking state transitions
Calculating matching suitability
```

Services should not know about HTTP.

---

## `internal/storage`

External file/storage handling.

This can be used for things such as:

```text
Image uploads
Documents
Other uploaded files
```

If AWS S3 or another storage provider is used later, the provider-specific implementation belongs here rather than being scattered through handlers and services.

---

# 5. `cmd/api/main.go`

`main.go` is the composition root of the application.

Its job is to create dependencies and connect them together.

It should not contain business logic.

It should not contain SQL queries.

It should not implement HTTP endpoint behavior.

Its responsibilities are:

1. Load configuration.
2. Connect to PostgreSQL.
3. Initialize Redis if required.
4. Create the sqlc database client.
5. Create repositories.
6. Create services.
7. Create handlers.
8. Create the router.
9. Register middleware.
10. Start the HTTP server.
11. Handle graceful shutdown if required.

Conceptually:

```text
main.go
   |
   v
Configuration
   |
   v
Database / Redis
   |
   v
sqlc
   |
   v
Repositories
   |
   v
Services
   |
   v
Handlers
   |
   v
Router
   |
   v
HTTP Server
```

---

# 6. Dependency Injection

Use constructor-based dependency injection.

A service should not create its own repository.

Bad:

```go
func NewFarmerService() *FarmerService {
    repo := repository.NewFarmerRepository(...)
    return &FarmerService{
        repo: repo,
    }
}
```

Better:

```go
func NewFarmerService(repo FarmerRepository) *FarmerService {
    return &FarmerService{
        repo: repo,
    }
}
```

Then `main.go` connects the dependencies:

```text
main.go
   |
   +--> sqlc
   |
   +--> FarmerRepository
   |
   +--> FarmerService
   |
   +--> FarmerHandler
```

The object receives the dependency instead of creating the dependency itself.

---

# 7. Handler Layer

The handler is responsible for HTTP.

A handler deals with:

```text
HTTP request
URL parameters
Query parameters
Request body
JSON decoding
Basic input validation
Calling services
HTTP status codes
JSON responses
```

For example:

```http
POST /api/listings
```

The handler should:

1. Read the required parameters.
2. Decode the JSON body.
3. Perform basic request validation.
4. Call the service.
5. Convert the result into an HTTP response.

It should not decide:

```text
Which buyer should receive the straw?
Which baler should be assigned?
Is the quantity sufficient?
Which pickup slot is suitable?
Can this booking be cancelled?
```

Those are business decisions and belong in the service layer.

---

# 8. Service Layer

The service layer contains the application's business logic.

For Straw2Cash, this includes:

```text
Farmer creates straw listing
Buyer creates requirement
Find suitable buyer
Find suitable baler
Match farmer and buyer
Calculate matching suitability
Check booking conflicts
Create booking
Cancel booking
Change booking status
Validate business rules
```

Example:

```go
func (s *BookingService) CreateBooking(...) {
    farmer := s.farmerRepo.GetByID(...)
    buyer := s.buyerRepo.GetByID(...)
    baler := s.balerRepo.GetAvailable(...)

    // business rules

    return s.bookingRepo.Create(...)
}
```

The exact implementation can evolve as the requirements become clearer.

---

# 9. What Belongs in the Service

Business decisions belong in services.

Examples:

```text
Can this booking be created?

Is the farmer allowed to create this listing?

Is the buyer eligible?

Is the baler available?

Does the selected slot conflict with another booking?

Which baler is the best candidate?

Which buyer is the best match?

Can a booking be cancelled?

What status transition is allowed?
```

These are business questions, not database questions.

---

# 10. What Does Not Belong in the Service

Services should not directly manipulate HTTP.

Avoid:

```go
w.WriteHeader(...)
json.NewEncoder(w).Encode(...)
```

inside services.

Services should not depend on:

```text
http.Request
http.ResponseWriter
Gorilla Mux
HTTP status codes
HTTP-specific JSON formatting
```

Prefer:

```go
CreateBooking(ctx, request)
```

instead of:

```go
CreateBooking(w http.ResponseWriter, r *http.Request)
```

---

# 11. Repository Layer

The repository is responsible for data access.

The repository sits between the service and sqlc:

```text
Service
   |
   v
Repository
   |
   v
sqlc
   |
   v
PostgreSQL
```

Examples:

```text
Get farmer by ID
Create farmer
Get listing
Create listing
Find available balers
Get buyer requirements
Create match
Update match status
Create booking
Update booking status
```

The repository should not decide business rules.

For example, retrieving available balers belongs in the repository.

Deciding which baler is the "best" one based on business rules belongs in the service.

---

# 12. Repository Interfaces

Repositories should generally be represented using interfaces where this improves testability.

Example:

```go
type FarmerRepository interface {
    GetByID(ctx context.Context, id uuid.UUID) (model.Farmer, error)
    Create(ctx context.Context, farmer model.Farmer) (model.Farmer, error)
}
```

The concrete implementation can use sqlc:

```go
type farmerRepository struct {
    queries *sqlc.Queries
}
```

Constructor:

```go
func NewFarmerRepository(
    queries *sqlc.Queries,
) FarmerRepository {
    return &farmerRepository{
        queries: queries,
    }
}
```

The service depends on the interface:

```go
type FarmerService struct {
    repo FarmerRepository
}
```

This allows services to use mock repositories during testing.

---

# 13. SQL Queries

All handwritten SQL belongs in:

```text
internal/db/queries/
```

Example:

```text
internal/db/queries/
├── users.sql
├── farmer_profiles.sql
├── buyer_profiles.sql
├── baler_profiles.sql
├── straw_listings.sql
├── buyer_requirements.sql
└── matches.sql
```

These SQL files are written by developers.

Example:

```sql
-- name: GetFarmerByID :one

SELECT
    id,
    user_id,
    village,
    district,
    state,
    latitude,
    longitude,
    land_area_acres,
    created_at,
    updated_at
FROM farmer_profiles
WHERE id = $1;
```

Another example:

```sql
-- name: CreateStrawListing :one

INSERT INTO straw_listings (
    farmer_id,
    crop_type,
    quantity_kg,
    price_per_kg,
    harvest_date,
    available_from,
    available_until,
    pickup_latitude,
    pickup_longitude,
    status
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10
)
RETURNING *;
```

The SQL files are the source of truth for database queries.

---

# 14. What sqlc Does

sqlc takes handwritten SQL and generates type-safe Go database code.

The flow is:

```text
Handwritten SQL
      |
      v
    sqlc
      |
      v
Generated Go Code
      |
      v
Repository
      |
      v
PostgreSQL
```

For example, we write:

```sql
-- name: GetFarmerByID :one

SELECT *
FROM farmer_profiles
WHERE id = $1;
```

sqlc can generate a Go method similar to:

```go
func (q *Queries) GetFarmerByID(
    ctx context.Context,
    id uuid.UUID,
) (FarmerProfile, error)
```

The generated code should not normally be manually edited.

If the query needs to change:

```text
Modify SQL
    |
    v
Run sqlc generate
    |
    v
Generated code changes
```

---

# 15. sqlc Generated Folder

Generated code belongs in:

```text
internal/db/sqlc/
```

For example:

```text
internal/db/sqlc/
├── db.go
├── models.go
├── users.sql.go
├── farmer_profiles.sql.go
├── buyer_profiles.sql.go
├── baler_profiles.sql.go
├── straw_listings.sql.go
├── buyer_requirements.sql.go
└── matches.sql.go
```

These files are generated by sqlc.

Do not manually implement business logic inside them.

Do not manually edit generated files.

If generated code needs to change, modify the SQL or sqlc configuration and regenerate it.

---

# 16. `sqlc.yaml`

The `sqlc.yaml` file tells sqlc where the schema and SQL queries are and where generated code should be placed.

The configuration should follow the actual project structure.

Conceptually:

```yaml
version: "2"

sql:
  - engine: "postgresql"

    schema:
      - "internal/db/migrations"

    queries:
      - "internal/db/queries"

    gen:
      go:
        package: "sqlc"
        out: "internal/db/sqlc"
```

The exact configuration may be adjusted according to the project's requirements.

---

# 17. Database Migrations

Database schema changes belong in:

```text
internal/db/migrations/
```

Migrations define:

```text
Tables
Columns
Foreign keys
Indexes
Constraints
Schema changes
```

A migration is different from a query.

```text
Migration
    |
    | defines database structure
    v
PostgreSQL schema

Query
    |
    | reads/modifies data
    v
PostgreSQL data
```

## Important Migration Rule

**Every table must have its own migration pair.**

Do not create one giant:

```text
001_init.up.sql
001_init.down.sql
```

containing all seven tables.

Instead, create separate migration files for each table.

For the initial Straw2Cash schema:

```text
internal/db/migrations/

001_create_users_table.up.sql
001_create_users_table.down.sql

002_create_farmer_profiles_table.up.sql
002_create_farmer_profiles_table.down.sql

003_create_buyer_profiles_table.up.sql
003_create_buyer_profiles_table.down.sql

004_create_baler_profiles_table.up.sql
004_create_baler_profiles_table.down.sql

005_create_straw_listings_table.up.sql
005_create_straw_listings_table.down.sql

006_create_buyer_requirements_table.up.sql
006_create_buyer_requirements_table.down.sql

007_create_matches_table.up.sql
007_create_matches_table.down.sql
```

Each `.up.sql` file creates **only its corresponding table and the schema objects directly required for that table**.

Each `.down.sql` file reverses the corresponding migration.

For example:

```text
001_create_users_table.up.sql
```

creates the `users` table.

```text
001_create_users_table.down.sql
```

drops the `users` table.

This keeps the migration history clear and makes individual schema changes easier to understand and roll back.

---

# 18. Modifying an Existing Table

Do not directly modify an existing migration after it has already been created or applied.

If an existing table needs to change, create a new migration.

For example, if `users` already exists and we need to add a new column:

```text
008_add_user_status.up.sql
008_add_user_status.down.sql
```

The `.up.sql` file applies the change.

The `.down.sql` file reverses that change.

Do not edit:

```text
001_create_users_table.up.sql
```

after it has already become part of the migration history.

This keeps migration history intact.

---

# 19. Initial Straw2Cash Database Tables

The initial database contains these seven core tables:

```text
1. users
2. farmer_profiles
3. buyer_profiles
4. baler_profiles
5. straw_listings
6. buyer_requirements
7. matches
```

Do not add unnecessary tables at this stage.

Payments, contracts, fire hotspots, AI results, impact reports, and other future functionality can be added later if the project actually requires them.

---

# 20. Model Layer

The `internal/model` package represents application/domain structures that are not simply generated database models.

However, do not create duplicate structs unnecessarily.

If sqlc already generates a suitable database model, use it where appropriate.

For request-specific data, use DTOs.

For example:

```go
type CreateListingRequest struct {
    QuantityKg  float64 `json:"quantity_kg"`
    CropType    string  `json:"crop_type"`
    HarvestDate string  `json:"harvest_date"`
}
```

This is an HTTP input structure.

It is not automatically a database model.

---

# 21. DTO vs Database Model

Keep API request/response structures separate from database structures when they have different purposes.

Example request:

```json
{
  "quantity_kg": 8000,
  "crop_type": "paddy",
  "harvest_date": "2026-10-08"
}
```

The handler decodes it into:

```text
CreateListingRequest
```

The service validates and processes it.

The repository passes the required values to sqlc.

The database returns a generated sqlc model.

Flow:

```text
JSON
 |
 v
Request DTO
 |
 v
Service
 |
 v
Repository
 |
 v
sqlc Model
 |
 v
PostgreSQL
```

Do not expose database implementation details directly through the HTTP API unless there is a deliberate reason to do so.

---

# 22. Middleware

Middleware handles cross-cutting HTTP concerns.

Examples:

```text
Authentication
Authorization
Logging
Request ID
CORS
Rate limiting
Recovery
```

Example request flow:

```text
HTTP Request
     |
     v
Logging Middleware
     |
     v
Auth Middleware
     |
     v
Authorization Middleware
     |
     v
Handler
     |
     v
Service
```

Middleware should not contain core business logic.

For example:

```text
Checking whether a JWT is valid
```

belongs in authentication middleware.

But:

```text
Checking whether this farmer can cancel this particular booking
```

may belong in the service because it is application-specific business logic.

---

# 23. Router

The router connects HTTP endpoints to handlers.

For example:

```go
router.HandleFunc(
    "/api/farmers/{id}",
    farmerHandler.GetFarmer,
).Methods(http.MethodGet)
```

Routes should primarily define:

```text
HTTP method
URL path
Handler
Middleware
```

They should not contain business logic.

---

# 24. Complete Request Example

Consider:

```http
POST /api/listings
```

A farmer wants to list:

```text
8 tonnes of paddy straw
```

The request flow is:

```text
1. Client
     |
     | POST /api/listings
     v
2. Router
     |
     v
3. Middleware
     |
     v
4. Handler
     |
     | decode JSON
     | basic validation
     v
5. Service
     |
     | business rules
     v
6. Repository
     |
     v
7. sqlc
     |
     | generated Go method
     v
8. PostgreSQL
```

The response travels back:

```text
PostgreSQL
     |
     v
sqlc
     |
     v
Repository
     |
     v
Service
     |
     v
Handler
     |
     v
JSON Response
```

---

# 25. Straw2Cash Matching Example

The matching engine is business logic.

Suppose:

```text
Farmer:
Location = A
Quantity = 8 tonnes

Buyer:
Location = B
Required quantity = 5 tonnes

Baler:
Location = A
Available = true
Capacity = 10 tonnes
```

The handler should not calculate the match.

The repository should not decide the match.

The service should coordinate the operation.

```text
Matching Handler
       |
       v
Matching Service
       |
       +----> Farmer Repository
       |
       +----> Buyer Repository
       |
       +----> Baler Repository
       |
       v
Matching Decision
       |
       v
Match Repository
```

The service may:

1. Find eligible farmers.
2. Find buyers with open requirements.
3. Find nearby available balers.
4. Calculate suitability.
5. Select a match.
6. Create the match.
7. Return the result.

The matching algorithm can evolve without changing the HTTP layer.

---

# 26. Scheduling and Booking

Scheduling is also business logic.

Suppose:

```text
Baler:
Available 10:00 - 14:00

Buyer:
Available 11:00 - 13:00

Farmer:
Available 11:30 - 14:00
```

The service can determine the common availability:

```text
11:30 - 13:00
```

The repository retrieves existing bookings.

The service determines whether a new booking can be created.

The repository persists the booking.

```text
Handler
   |
   v
Booking Service
   |
   +----> Farmer Repository
   +----> Buyer Repository
   +----> Baler Repository
   +----> Booking Repository
   |
   v
Booking Decision
   |
   v
Booking Repository
   |
   v
sqlc
   |
   v
PostgreSQL
```

---

# 27. Error Handling

Errors should travel upward through the layers.

Example:

```text
PostgreSQL
    |
    | database error / not found / conflict
    v
sqlc
    |
    v
Repository
    |
    v
Service
    |
    v
Handler
    |
    v
HTTP Response
```

The service may convert low-level database errors into application-level errors.

For example:

```text
sql.ErrNoRows
```

can become:

```text
ErrFarmerNotFound
```

The handler can convert that into:

```http
404 Not Found
```

The handler is responsible for the HTTP representation.

---

# 28. HTTP Status Codes

Typical status codes:

```text
200 OK
```

Successful read/update operation.

```text
201 Created
```

Successful resource creation.

```text
204 No Content
```

Successful operation with no response body.

```text
400 Bad Request
```

Malformed or invalid request.

```text
401 Unauthorized
```

Authentication is missing or invalid.

```text
403 Forbidden
```

User is authenticated but not allowed to perform the operation.

```text
404 Not Found
```

Requested resource does not exist.

```text
409 Conflict
```

Operation conflicts with existing state.

```text
500 Internal Server Error
```

Unexpected server-side failure.

---

# 29. Context Propagation

Database and service operations should normally accept:

```go
context.Context
```

Example:

```go
func (s *FarmerService) GetFarmer(
    ctx context.Context,
    id uuid.UUID,
) (...)
```

The handler obtains the context from:

```go
r.Context()
```

and passes it down.

```text
HTTP Request
     |
     v
Handler
     |
     | r.Context()
     v
Service
     |
     v
Repository
     |
     v
sqlc
```

This allows cancellation, deadlines, and request-scoped behavior to propagate through the request.

---

# 30. Transactions

Operations that modify multiple related records should use database transactions when atomicity is required.

For example, creating a booking might involve:

```text
1. Check availability
2. Reserve slot
3. Create booking
4. Update related state
```

If these operations must either all succeed or all fail, they should occur inside a transaction.

Conceptually:

```text
BEGIN

check availability
create booking
reserve slot
update related state

COMMIT
```

If something fails:

```text
ROLLBACK
```

Transaction handling should be coordinated at the repository/data-access level or through an appropriate transaction abstraction.

The service decides when the business operation requires atomicity.

Do not scatter transaction handling randomly throughout handlers.

---

# 31. What Each Layer Knows

| Layer      | Knows About                             |
| ---------- | --------------------------------------- |
| Handler    | HTTP, JSON, URLs, status codes          |
| Service    | Business rules and application behavior |
| Repository | Data access                             |
| sqlc       | Generated database operations           |
| PostgreSQL | Persistent data                         |
| main.go    | Application wiring                      |

The key principle is:

```text
Handler knows HTTP.

Service knows business.

Repository knows data access.

sqlc provides generated database access.

PostgreSQL stores data.

main.go knows how everything is connected.
```

---

# 32. What Happens When Adding a New Feature

Suppose we add:

```text
Create Straw Listing
```

Follow this sequence.

## Step 1: Database

If the feature requires a schema change, create a new migration inside:

```text
internal/db/migrations/
```

Each schema change must have:

```text
.up.sql
.down.sql
```

For example:

```text
005_create_straw_listings_table.up.sql
005_create_straw_listings_table.down.sql
```

If the table already exists and needs modification, create a new migration instead of editing the original migration.

---

## Step 2: SQL

Write the required SQL inside:

```text
internal/db/queries/
```

For example:

```text
internal/db/queries/straw_listings.sql
```

---

## Step 3: Generate sqlc

Run:

```bash
sqlc generate
```

This updates:

```text
internal/db/sqlc/
```

---

## Step 4: Repository

Create or update the repository:

```text
internal/repository/listing_repository.go
```

---

## Step 5: Service

Implement the business logic:

```text
internal/service/listing_service.go
```

---

## Step 6: Handler

Implement the HTTP behavior:

```text
internal/handler/listing_handler.go
```

---

## Step 7: Route

Register the endpoint in the router.

For example:

```text
POST /api/listings
```

---

## Step 8: Wire Dependencies

Update `cmd/api/main.go` if a new repository, service, or handler needs to be constructed.

---

# 33. Feature Dependency Example

For a feature called `Booking`:

```text
internal/db/migrations/
    booking schema
        |
        v
internal/db/queries/
    booking.sql
        |
        | sqlc generate
        v
internal/db/sqlc/
    booking.sql.go
    models.go
        |
        v
internal/repository/
    booking_repository.go
        |
        v
internal/service/
    booking_service.go
        |
        v
internal/handler/
    booking_handler.go
        |
        v
internal/router/
    booking routes
        |
        v
HTTP Client
```

This is the normal development direction.

---

# 34. Naming Conventions

Use clear domain names.

Examples:

```text
farmer
buyer
baler
listing
requirement
matching
booking
scheduling
```

Avoid generic names such as:

```text
thing
data
manager
helper
utils
common
stuff
```

unless the package genuinely represents a reusable general-purpose utility.

Prefer:

```text
booking_service.go
```

over:

```text
manager.go
```

Prefer:

```text
booking_repository.go
```

over:

```text
database.go
```

---

# 35. Avoid a Giant Utility Package

Do not put unrelated functionality into one giant:

```text
utils/
```

For example, do not place all of these together:

```text
JWT functions
Matching functions
Date functions
Database functions
JSON functions
Pricing functions
```

Keep functionality close to the layer or domain where it belongs.

---

# 36. Avoid Fat Handlers

Bad:

```go
func CreateBooking(w http.ResponseWriter, r *http.Request) {
    // decode request
    // query database
    // find farmer
    // find buyer
    // find baler
    // calculate distance
    // calculate availability
    // decide matching
    // create booking
    // update baler
    // send response
}
```

Better:

```go
func (h *BookingHandler) CreateBooking(...) {
    // decode request

    booking, err := h.service.CreateBooking(...)

    // return response
}
```

The business complexity belongs in the service.

---

# 37. Avoid Fat Repositories

Bad:

```go
func (r *BookingRepository) FindBestBooking(...) {
    // calculate business score
    // determine best baler
    // decide which buyer wins
    // apply business rules
}
```

The repository should retrieve and persist data.

The service should make business decisions.

Better:

```text
Service:
    determine what data is needed
    make business decision

Repository:
    retrieve required data
    persist result
```

---

# 38. Avoid Direct Database Access From Services

Do not do:

```go
func (s *FarmerService) GetFarmer(...) {
    db.Query(...)
}
```

Instead:

```text
Service
   |
   v
Repository
   |
   v
sqlc
   |
   v
PostgreSQL
```

This keeps database implementation isolated.

---

# 39. Avoid Direct sqlc Usage in Handlers

Do not do:

```go
func Handler(...) {
    queries.GetFarmerByID(...)
}
```

Handlers should not know that sqlc exists.

They should only interact with the service layer:

```text
Handler
   |
   v
Service
```

---

# 40. Dependency Direction

The dependency graph should look like:

```text
                    main.go
                       |
          +------------+------------+
          |            |            |
          v            v            v
       Handler      Service    Repository
          |            |            |
          |            v            v
          |       Repository       sqlc
          |                         |
          |                         v
          |                    PostgreSQL
          |
          v
         HTTP
```

More simply:

```text
main
 |
 +--> handlers
 |       |
 |       +--> services
 |               |
 |               +--> repositories
 |                       |
 |                       +--> sqlc
 |
 +--> router
```

`main.go` is allowed to know about everything because it is responsible for application composition.

Individual layers should not know about everything.

---

# 41. Testing Strategy

The architecture should support testing at multiple levels.

## Handler Tests

Test:

```text
HTTP request
HTTP response
Status code
JSON
Request validation
```

Mock the service.

```text
Handler
   |
   v
Mock Service
```

## Service Tests

Test:

```text
Business rules
Matching
Scheduling
Authorization decisions
State transitions
```

Mock repositories.

```text
Service
   |
   +--> Mock Farmer Repository
   +--> Mock Buyer Repository
   +--> Mock Baler Repository
```

These tests do not require a real database.

## Repository Tests

Test:

```text
SQL behavior
Database interactions
Transactions
Constraints
```

These can use a test PostgreSQL database where appropriate.

---

# 42. Straw2Cash Domain Structure

The main Go backend domains are:

```text
Farmer
Buyer
Baler
Straw Listing
Buyer Requirement
Matching
Booking
Scheduling
```

Possible organization:

```text
internal/

├── handler/
│   ├── auth_handler.go
│   ├── farmer_handler.go
│   ├── buyer_handler.go
│   ├── baler_handler.go
│   ├── listing_handler.go
│   ├── matching_handler.go
│   └── booking_handler.go
│
├── service/
│   ├── auth_service.go
│   ├── farmer_service.go
│   ├── buyer_service.go
│   ├── baler_service.go
│   ├── listing_service.go
│   ├── matching_service.go
│   └── booking_service.go
│
└── repository/
    ├── user_repository.go
    ├── farmer_repository.go
    ├── buyer_repository.go
    ├── baler_repository.go
    ├── listing_repository.go
    ├── requirement_repository.go
    └── match_repository.go
```

The exact organization can evolve as the project grows.

---

# 43. Integration With Other Team Members

The Go backend is the central application API.

Conceptually:

```text
                 Frontend
                    |
                    v
               Go Backend
              /    |    \
             /     |     \
            v      v      v
     PostgreSQL   Java   Python
```

The Go backend should coordinate the core application flow.

For example:

```text
Farmer creates listing
        |
        v
Go Backend
        |
        +--> Python: residue estimation if required
        |
        +--> Matching logic
        |
        +--> Java: pricing/settlement if required
        |
        +--> PostgreSQL
```

Do not introduce unnecessary microservices merely because different team members use different technologies.

The architecture should remain as simple as possible for the hackathon.

---

# 44. AWS Deployment

AWS is the deployment environment.

The application does not need to use AWS-specific application architecture simply because it is deployed on AWS.

The team should primarily use technologies it already understands.

For example:

```text
Go
PostgreSQL
Docker
REST
sqlc
```

can remain the application stack.

AWS is responsible for hosting and deployment.

Do not introduce Lambda, DynamoDB, API Gateway, or other AWS-specific technologies unless there is a concrete project requirement.

---

# 45. Agent Rules

Any coding agent working on this repository must follow these rules.

### Rule 1

Follow:

```text
Handler -> Service -> Repository -> sqlc -> PostgreSQL
```

### Rule 2

Do not put business logic in handlers.

### Rule 3

Do not put HTTP-specific logic in services.

### Rule 4

Do not put business decisions in repositories.

### Rule 5

Do not directly access PostgreSQL from handlers or services.

### Rule 6

Use sqlc for database queries.

### Rule 7

Write handwritten SQL in:

```text
internal/db/queries/
```

and regenerate sqlc instead of manually editing generated files.

### Rule 8

Keep database schema changes in:

```text
internal/db/migrations/
```

### Rule 9

Every table/schema migration must have its own `.up.sql` and `.down.sql` files.

Do not combine all initial tables into one `init.up.sql` or `init.down.sql`.

### Rule 10

Use constructor-based dependency injection.

### Rule 11

`main.go` is responsible for wiring dependencies.

### Rule 12

Do not create unnecessary abstractions.

If a simple implementation is sufficient, prefer the simple implementation.

### Rule 13

Do not introduce a new library or framework without a concrete reason.

### Rule 14

Do not create a new folder simply because it is common in another Go project.

The architecture should serve Straw2Cash.

### Rule 15

Before creating a file, inspect the existing architecture and follow existing naming and dependency patterns.

### Rule 16

Do not manually edit generated sqlc files to implement application behavior.

### Rule 17

When a schema change is required, create a new migration instead of modifying an existing migration that has already been created/applied.

---

# 46. New File Decision Guide

Before creating a file, determine its responsibility.

If it handles HTTP:

```text
internal/handler/
```

If it contains business logic:

```text
internal/service/
```

If it performs database operations:

```text
internal/repository/
```

If it contains handwritten SQL:

```text
internal/db/queries/
```

If it defines database schema:

```text
internal/db/migrations/
```

If it is generated by sqlc:

```text
internal/db/sqlc/
```

If it handles database connection:

```text
internal/db/postgres.go
```

If it handles HTTP middleware:

```text
internal/middleware/
```

If it contains API request/response structures:

```text
internal/dto/
```

If it contains shared HTTP utilities:

```text
internal/httpx/
```

If it handles Redis:

```text
internal/redis/
```

If it handles external file storage:

```text
internal/storage/
```

If it wires application dependencies:

```text
cmd/api/main.go
```

---

# 47. Final Mental Model

When developing a new feature, think:

```text
What does the HTTP client send?
          |
          v
       Handler
"How do I receive this HTTP request?"
          |
          v
       Service
"What should the application do?"
          |
          v
     Repository
"What data do I need or need to save?"
          |
          v
        sqlc
"Execute the generated database operation."
          |
          v
     PostgreSQL
"Store or retrieve the data."
```

And the response:

```text
PostgreSQL
    |
    v
  sqlc
    |
    v
Repository
    |
    v
 Service
    |
    v
 Handler
    |
    v
HTTP Response
```

The single most important rule is:

```text
Handler     = HTTP
Service     = Business Logic
Repository  = Data Access
sqlc        = Generated Database Access
PostgreSQL  = Data Storage
main.go     = Dependency Injection / Application Wiring
```

Every new Go backend feature should fit into this model unless there is a clear architectural reason to do otherwise.
