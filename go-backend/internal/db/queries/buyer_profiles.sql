-- name: CreateBuyerProfile :one
INSERT INTO buyer_profiles (
    user_id,
    organization_name,
    buyer_type,
    address,
    district,
    state,
    latitude,
    longitude
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING id, user_id, organization_name, buyer_type, address, district, state, latitude, longitude, created_at, updated_at;

-- name: GetBuyerProfileByID :one
SELECT
    id, user_id, organization_name, buyer_type, address, district, state, latitude, longitude, created_at, updated_at
FROM buyer_profiles
WHERE id = $1;

-- name: GetBuyerProfileByUserID :one
SELECT
    id, user_id, organization_name, buyer_type, address, district, state, latitude, longitude, created_at, updated_at
FROM buyer_profiles
WHERE user_id = $1;

-- name: ListBuyerProfiles :many
SELECT
    id, user_id, organization_name, buyer_type, address, district, state, latitude, longitude, created_at, updated_at
FROM buyer_profiles
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateBuyerProfile :one
UPDATE buyer_profiles
SET
    organization_name = $2,
    buyer_type = $3,
    address = $4,
    district = $5,
    state = $6,
    latitude = $7,
    longitude = $8,
    updated_at = NOW()
WHERE id = $1
RETURNING id, user_id, organization_name, buyer_type, address, district, state, latitude, longitude, created_at, updated_at;

-- name: DeleteBuyerProfile :exec
DELETE FROM buyer_profiles
WHERE id = $1;
