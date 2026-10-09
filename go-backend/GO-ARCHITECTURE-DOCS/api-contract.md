# Straw2Cash API Contract

This document provides a comprehensive contract of the HTTP API layer for frontend integration. It strictly documents endpoints, data structures, headers, and behaviors that are *actually implemented* in the backend codebase.

---

## 1. Frontend Quick-Start & Authentication

### Base URL
All API requests must be prefixed with:
`http://localhost:8080` (Local Development)

### Authentication Flow
The backend uses **JWT (JSON Web Tokens)** for authentication. No cookies are used.
1. Call `POST /api/v1/auth/register` or `POST /api/v1/auth/login`.
2. The response will contain a `token` string.
3. For all protected endpoints, attach the token in the request headers:
   ```http
   Authorization: Bearer <your_jwt_token_here>
   ```

*Notes on Tokens:*
- Tokens currently expire after exactly 15 minutes.
- **There is no implemented token refresh or token revocation/logout endpoint**. To "logout", simply discard the token on the frontend. If a token expires, the backend will return a `401 Unauthorized` with `{"error": "token expired"}`, and the frontend should force the user to re-authenticate via `/login`.

### General Error Format
The API returns errors in three distinct formats depending on where the error occurs:

**1. Service & Domain Errors (Standard)**
When business logic fails (e.g. `404 Not Found`, `400 Invalid State`, `403 Forbidden`), handlers use `RespondWithDomainError`. This returns an envelope:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "not found: farmer profile not found"
  }
}
```

**2. Validation & Request Parsing Errors**
When the handler fails to parse the JSON body or a required field is missing, it uses `RespondWithError`:
```json
{
  "error": "invalid request body"
}
```

**3. Routing (404/405) & Authentication (401)**
- `404 Not Found` and `405 Method Not Allowed` from the router return a simple JSON object: `{"error": "not found"}`.
- `401 Unauthorized` errors triggered by the authentication middleware (like `{"error": "token expired"}`) are returned as raw strings with the `Content-Type` header set to `text/plain; charset=utf-8` (not JSON).

### Logical Workflow
1. User registers or logs in -> gets JWT.
2. User creates a role-specific profile (`/farmers/profile`, `/buyers/profile`, or `/balers/profile`).
3. If Farmer: Create Straw Listings (`/listings`).
4. If Buyer: Create Requirements (`/requirements`).
5. A Match is created between a Listing and Requirement (`/matches`).

---

## 2. Endpoints

### 2.1 Authentication

#### POST `/api/v1/auth/register`
Creates a new user and returns a JWT.
- **Authentication**: Public
- **Request Body**:
  ```json
  {
    "name": "Ramesh Kumar",
    "email": "ramesh@example.com",
    "phone": "+919876543210",
    "password": "securepassword123",
    "role": "FARMER"
  }
  ```
  *(Valid roles: `FARMER`, `BUYER`, `BALER`)*
- **Success (201 Created)**:
  ```json
  {
    "token": "eyJhbG...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Ramesh Kumar",
      "email": "ramesh@example.com",
      "phone": "+919876543210",
      "role": "FARMER",
      "is_active": true,
      "created_at": "2023-10-09T10:00:00Z"
    }
  }
  ```
- **Errors**: `400 Bad Request` (Invalid payload or validation failed), `409 Conflict` (Phone/email already exists)

#### POST `/api/v1/auth/login`
Authenticates a user and returns a JWT.
- **Authentication**: Public
- **Request Body**:
  ```json
  {
    "phone": "+919876543210",
    "password": "securepassword123"
  }
  ```
- **Success (200 OK)**:
  *(Same structure as Register response)*
- **Errors**: `400 Bad Request` (malformed json), `401 Unauthorized` (invalid credentials)

---

### 2.2 Users

#### GET `/api/v1/users/me`
Fetches the currently authenticated user based on the JWT token.
- **Authentication**: Protected
- **Success (200 OK)**: Returns `UserResponse` object (see Register success body).
- **Errors**: `401 Unauthorized`, `404 Not Found`

#### GET `/api/v1/users/{id}`
Fetches a user by their UUID.
- **Authentication**: Protected
- **Path Parameter**: `id` (UUID of the user)
- **Success (200 OK)**: Returns `UserResponse` object.
- **Errors**: `404 Not Found`, `400 Bad Request` (Invalid ID format)

---

### 2.3 Farmers

#### POST `/api/v1/farmers/profile`
Creates a farmer profile for the authenticated user.
- **Authentication**: Protected
- **Authorization**: Only allowed if user's role is `FARMER`.
- **Request Body**:
  ```json
  {
    "village": "Rampur",
    "district": "Ludhiana",
    "state": "Punjab",
    "latitude": 30.900965,
    "longitude": 75.8572758,
    "land_area_acres": 12.5
  }
  ```
- **Success (201 Created)**:
  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "village": "Rampur",
    "district": "Ludhiana",
    "state": "Punjab",
    "latitude": 30.900965,
    "longitude": 75.8572758,
    "land_area_acres": 12.5,
    "created_at": "2023-10-09T10:00:00Z",
    "updated_at": "2023-10-09T10:00:00Z"
  }
  ```
- **Errors**: `400 Bad Request`, `403 Forbidden` (wrong role), `409 Conflict` (profile already exists)

#### GET `/api/v1/farmers/profile/me`
Fetches the authenticated farmer's profile.
- **Authentication**: Protected
- **Success (200 OK)**: Returns `FarmerProfileResponse` object.
- **Errors**: `404 Not Found`

#### PUT `/api/v1/farmers/profile`
Updates the authenticated farmer's profile.
- **Authentication**: Protected
- **Request Body**: Fields are optional, only sent fields will be updated.
  ```json
  {
    "land_area_acres": 15.0
  }
  ```
- **Success (200 OK)**: Returns updated `FarmerProfileResponse` object.

#### GET `/api/v1/farmers/profile/{id}`
Fetches a specific farmer profile by profile ID.
- **Authentication**: Protected
- **Path Parameter**: `id` (UUID of the farmer profile)
- **Success (200 OK)**: Returns `FarmerProfileResponse` object.

---

### 2.4 Buyers

#### POST `/api/v1/buyers/profile`
Creates a buyer profile.
- **Authentication**: Protected
- **Authorization**: Role must be `BUYER`.
- **Request Body**:
  ```json
  {
    "organization_name": "Green Energy Solutions",
    "buyer_type": "BIOMASS_PLANT",
    "address": "123 Industrial Area",
    "district": "Patiala",
    "state": "Punjab",
    "latitude": 30.339780,
    "longitude": 76.386880
  }
  ```
  *(Valid `buyer_type`: `BIOMASS_PLANT`, `BRICK_KILN`, `PAPER_MILL`, `CATTLE_FEED`, `OTHER`)*
- **Success (201 Created)**: Returns `BuyerProfileResponse`.

#### GET `/api/v1/buyers/profile/me`
- **Authentication**: Protected
- **Success (200 OK)**: Returns `BuyerProfileResponse`.

#### PUT `/api/v1/buyers/profile`
- **Authentication**: Protected
- **Request Body**: Fields optional.
- **Success (200 OK)**: Returns updated `BuyerProfileResponse`.

#### GET `/api/v1/buyers/profile/{id}`
- **Authentication**: Protected
- **Path Parameter**: `id` (UUID of buyer profile)
- **Success (200 OK)**: Returns `BuyerProfileResponse`.

---

### 2.5 Balers

#### POST `/api/v1/balers/profile`
Creates a baler profile.
- **Authentication**: Protected
- **Authorization**: Role must be `BALER`.
- **Request Body**:
  ```json
  {
    "organization_name": "AgriBale Co.",
    "phone": "+918888888888",
    "vehicle_details": "Tractor Model X with Square Baler",
    "service_area": "Ludhiana and surrounding",
    "district": "Ludhiana",
    "state": "Punjab"
  }
  ```
- **Success (201 Created)**: Returns `BalerProfileResponse`.

#### GET `/api/v1/balers/profile/me`
- **Authentication**: Protected
- **Success (200 OK)**: Returns `BalerProfileResponse`.

#### PUT `/api/v1/balers/profile`
- **Authentication**: Protected
- **Request Body**: Fields optional.
- **Success (200 OK)**: Returns updated `BalerProfileResponse`.

#### GET `/api/v1/balers/profile/{id}`
- **Authentication**: Protected
- **Path Parameter**: `id` (UUID of baler profile)
- **Success (200 OK)**: Returns `BalerProfileResponse`.

---

### 2.6 Straw Listings

#### POST `/api/v1/listings`
Creates a new straw listing (offered by a Farmer).
- **Authentication**: Protected
- **Authorization**: User must have a `FARMER` profile (Enforced via Cedar policy).
- **Request Body**:
  ```json
  {
    "crop_type": "PADDY",
    "quantity_kg": 5000.0,
    "price_per_kg": 2.5,
    "moisture_percentage": 14.5,
    "harvest_date": "2023-11-01",
    "available_from": "2023-11-05",
    "available_until": "2023-12-05",
    "pickup_latitude": 30.9009,
    "pickup_longitude": 75.8572
  }
  ```
- **Success (201 Created)**: Returns `ListingResponse`.

#### GET `/api/v1/listings`
Lists available straw listings, supporting pagination and status filtering.
- **Authentication**: Protected
- **Query Parameters**:
  - `status` (Optional): Filter by status (e.g. `AVAILABLE`).
  - `limit` (Optional): Max records (defaults to 20).
  - `offset` (Optional): Starting index for pagination (defaults to 0).
- **Success (200 OK)**: Returns an array `[]ListingResponse`.

#### GET `/api/v1/listings/{id}`
- **Authentication**: Protected
- **Path Parameter**: `id` (UUID of the listing)
- **Success (200 OK)**: Returns `ListingResponse`.

#### PUT `/api/v1/listings/{id}/status`
Updates the status of a listing.
- **Authentication**: Protected
- **Path Parameter**: `id`
- **Request Body**:
  ```json
  {
    "status": "BOOKED"
  }
  ```
  *(Valid statuses: `AVAILABLE`, `MATCHED`, `BOOKED`, `COLLECTED`, `CANCELLED`)*
- **Success (200 OK)**: Returns updated `ListingResponse`.

---

### 2.7 Requirements (Buyer Needs)

#### POST `/api/v1/requirements`
Creates a requirement indicating a Buyer's demand for straw.
- **Authentication**: Protected
- **Authorization**: User must have a `BUYER` profile (Enforced via Cedar policy).
- **Request Body**:
  ```json
  {
    "crop_type": "PADDY",
    "quantity_required_kg": 10000.0,
    "max_price_per_kg": 3.0,
    "preferred_radius_km": 50.0,
    "required_from": "2023-11-01",
    "required_until": "2024-01-31"
  }
  ```
- **Success (201 Created)**: Returns `RequirementResponse`.

#### GET `/api/v1/requirements`
Lists requirements.
- **Authentication**: Protected
- **Query Parameters**:
  - `status` (Optional): Filter by status (e.g. `OPEN`).
  - `limit` (Optional, defaults to 20)
  - `offset` (Optional, defaults to 0)
- **Success (200 OK)**: Returns an array `[]RequirementResponse`.

#### GET `/api/v1/requirements/{id}`
- **Authentication**: Protected
- **Path Parameter**: `id` (UUID of the requirement)
- **Success (200 OK)**: Returns `RequirementResponse`.

#### PUT `/api/v1/requirements/{id}/status`
Updates the status of a requirement.
- **Authentication**: Protected
- **Request Body**:
  ```json
  {
    "status": "PARTIALLY_FULFILLED"
  }
  ```
  *(Valid statuses: `OPEN`, `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED`)*
- **Success (200 OK)**: Returns updated `RequirementResponse`.

---

### 2.8 Matches

#### POST `/api/v1/matches`
Creates a proposed match between a Farmer's Listing and a Buyer's Requirement.
- **Authentication**: Protected
- **Authorization**: User must be either a `FARMER` or `BUYER` (Enforced via Cedar policy).
- **Request Body**:
  ```json
  {
    "listing_id": "uuid-of-listing",
    "requirement_id": "uuid-of-requirement",
    "baler_id": null,
    "matched_quantity_kg": 5000.0,
    "agreed_price_per_kg": 2.8
  }
  ```
- **Success (201 Created)**: Returns `MatchResponse`.

#### GET `/api/v1/matches/{id}`
- **Authentication**: Protected
- **Path Parameter**: `id`
- **Success (200 OK)**: Returns `MatchResponse`.

#### PUT `/api/v1/matches/{id}/status`
Updates the match status (e.g. accepting a proposed match).
- **Authentication**: Protected
- **Authorization**: User must be the owner of either the `Listing` or the `Requirement` in the match (Enforced via Cedar policy).
- **Path Parameter**: `id`
- **Request Body**:
  ```json
  {
    "status": "ACCEPTED"
  }
  ```
  *(Valid statuses: `PROPOSED`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `COMPLETED`)*
- **Success (200 OK)**: Returns updated `MatchResponse`.

---

## 3. Known Gaps and Frontend Notes

- **Token Expiration**: As mentioned in the Authentication section, tokens have a hardcoded 15-minute expiration time, and there is no implemented `Refresh` mechanism.
- **Pagination Returns Arrays Not Envelopes**: The `ListListings` and `ListRequirements` endpoints return raw JSON arrays (`[]`) on success. They **do not** return a `{ "data": [], "total": 100 }` envelope format. The frontend must parse the array directly.
- **Missing Resource Error**: Handlers use HTTP 404 for `repository.ErrNotFound`. 
- **JSON Field Strictness**: All POST and PUT bodies are parsed using strict JSON decoding (`decoder.DisallowUnknownFields()`). Sending fields not explicitly defined in the DTO (or even typos) will trigger a `400 Bad Request`.
- **Date Format**: Dates like `harvest_date` or `available_from` are currently handled as plain strings natively (`"2023-11-01"`). Ensure the format you send aligns with backend expectations (usually YYYY-MM-DD).
- **Foreign Keys in Payloads (`farmer_id`, `buyer_id`)**: The `farmer_id` and `buyer_id` properties returned in JSON responses (e.g., in `ListingResponse` and `RequirementResponse`) are the UUIDs of their respective **profiles** (`farmer_profile.id` and `buyer_profile.id`), not their global `user.id`.
