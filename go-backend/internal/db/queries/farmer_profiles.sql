-- name: CreateFarmerProfile :one
INSERT INTO farmer_profiles (
    user_id,
    village,
    district,
    state,
    latitude,
    longitude,
    land_area_acres
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING id, user_id, village, district, state, latitude, longitude, land_area_acres, created_at, updated_at;

-- name: GetFarmerProfileByID :one
SELECT
    id, user_id, village, district, state, latitude, longitude, land_area_acres, created_at, updated_at
FROM farmer_profiles
WHERE id = $1;

-- name: GetFarmerProfileByUserID :one
SELECT
    id, user_id, village, district, state, latitude, longitude, land_area_acres, created_at, updated_at
FROM farmer_profiles
WHERE user_id = $1;

-- name: ListFarmerProfiles :many
SELECT
    id, user_id, village, district, state, latitude, longitude, land_area_acres, created_at, updated_at
FROM farmer_profiles
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateFarmerProfile :one
UPDATE farmer_profiles
SET
    village = $2,
    district = $3,
    state = $4,
    latitude = $5,
    longitude = $6,
    land_area_acres = $7,
    updated_at = NOW()
WHERE id = $1
RETURNING id, user_id, village, district, state, latitude, longitude, land_area_acres, created_at, updated_at;

-- name: DeleteFarmerProfile :exec
DELETE FROM farmer_profiles
WHERE id = $1;
