-- name: CreateBalerProfile :one
INSERT INTO baler_profiles (
    user_id,
    organization_name,
    phone,
    vehicle_details,
    service_area,
    district,
    state
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING id, user_id, organization_name, phone, vehicle_details, service_area, district, state, created_at, updated_at;

-- name: GetBalerProfileByID :one
SELECT
    id, user_id, organization_name, phone, vehicle_details, service_area, district, state, created_at, updated_at
FROM baler_profiles
WHERE id = $1;

-- name: GetBalerProfileByUserID :one
SELECT
    id, user_id, organization_name, phone, vehicle_details, service_area, district, state, created_at, updated_at
FROM baler_profiles
WHERE user_id = $1;

-- name: ListBalerProfiles :many
SELECT
    id, user_id, organization_name, phone, vehicle_details, service_area, district, state, created_at, updated_at
FROM baler_profiles
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateBalerProfile :one
UPDATE baler_profiles
SET
    organization_name = $2,
    phone = $3,
    vehicle_details = $4,
    service_area = $5,
    district = $6,
    state = $7,
    updated_at = NOW()
WHERE id = $1
RETURNING id, user_id, organization_name, phone, vehicle_details, service_area, district, state, created_at, updated_at;

-- name: DeleteBalerProfile :exec
DELETE FROM baler_profiles
WHERE id = $1;
