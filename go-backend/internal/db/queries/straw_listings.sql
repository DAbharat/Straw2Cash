-- name: CreateStrawListing :one
INSERT INTO straw_listings (
    farmer_id,
    crop_type,
    quantity_kg,
    price_per_kg,
    moisture_percentage,
    harvest_date,
    available_from,
    available_until,
    pickup_latitude,
    pickup_longitude,
    status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
) RETURNING id, farmer_id, crop_type, quantity_kg, price_per_kg, moisture_percentage, harvest_date, available_from, available_until, pickup_latitude, pickup_longitude, status, created_at, updated_at;

-- name: GetStrawListingByID :one
SELECT
    id, farmer_id, crop_type, quantity_kg, price_per_kg, moisture_percentage, harvest_date, available_from, available_until, pickup_latitude, pickup_longitude, status, created_at, updated_at
FROM straw_listings
WHERE id = $1;

-- name: ListStrawListings :many
SELECT
    id, farmer_id, crop_type, quantity_kg, price_per_kg, moisture_percentage, harvest_date, available_from, available_until, pickup_latitude, pickup_longitude, status, created_at, updated_at
FROM straw_listings
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListStrawListingsByFarmerID :many
SELECT
    id, farmer_id, crop_type, quantity_kg, price_per_kg, moisture_percentage, harvest_date, available_from, available_until, pickup_latitude, pickup_longitude, status, created_at, updated_at
FROM straw_listings
WHERE farmer_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListStrawListingsByStatus :many
SELECT
    id, farmer_id, crop_type, quantity_kg, price_per_kg, moisture_percentage, harvest_date, available_from, available_until, pickup_latitude, pickup_longitude, status, created_at, updated_at
FROM straw_listings
WHERE status = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateStrawListing :one
UPDATE straw_listings
SET
    crop_type = $2,
    quantity_kg = $3,
    price_per_kg = $4,
    moisture_percentage = $5,
    harvest_date = $6,
    available_from = $7,
    available_until = $8,
    pickup_latitude = $9,
    pickup_longitude = $10,
    status = $11,
    updated_at = NOW()
WHERE id = $1
RETURNING id, farmer_id, crop_type, quantity_kg, price_per_kg, moisture_percentage, harvest_date, available_from, available_until, pickup_latitude, pickup_longitude, status, created_at, updated_at;

-- name: UpdateStrawListingStatus :one
UPDATE straw_listings
SET
    status = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING id, farmer_id, crop_type, quantity_kg, price_per_kg, moisture_percentage, harvest_date, available_from, available_until, pickup_latitude, pickup_longitude, status, created_at, updated_at;

-- name: DeleteStrawListing :exec
DELETE FROM straw_listings
WHERE id = $1;
