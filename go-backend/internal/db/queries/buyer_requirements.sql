-- name: CreateBuyerRequirement :one
INSERT INTO buyer_requirements (
    buyer_id,
    crop_type,
    quantity_required_kg,
    remaining_quantity_kg,
    max_price_per_kg,
    preferred_radius_km,
    required_from,
    required_until,
    status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING id, buyer_id, crop_type, quantity_required_kg, remaining_quantity_kg, max_price_per_kg, preferred_radius_km, required_from, required_until, status, created_at, updated_at;

-- name: GetBuyerRequirementByID :one
SELECT
    id, buyer_id, crop_type, quantity_required_kg, remaining_quantity_kg, max_price_per_kg, preferred_radius_km, required_from, required_until, status, created_at, updated_at
FROM buyer_requirements
WHERE id = $1;

-- name: ListBuyerRequirements :many
SELECT
    id, buyer_id, crop_type, quantity_required_kg, remaining_quantity_kg, max_price_per_kg, preferred_radius_km, required_from, required_until, status, created_at, updated_at
FROM buyer_requirements
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListBuyerRequirementsByBuyerID :many
SELECT
    id, buyer_id, crop_type, quantity_required_kg, remaining_quantity_kg, max_price_per_kg, preferred_radius_km, required_from, required_until, status, created_at, updated_at
FROM buyer_requirements
WHERE buyer_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListBuyerRequirementsByStatus :many
SELECT
    id, buyer_id, crop_type, quantity_required_kg, remaining_quantity_kg, max_price_per_kg, preferred_radius_km, required_from, required_until, status, created_at, updated_at
FROM buyer_requirements
WHERE status = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateBuyerRequirement :one
UPDATE buyer_requirements
SET
    crop_type = $2,
    quantity_required_kg = $3,
    remaining_quantity_kg = $4,
    max_price_per_kg = $5,
    preferred_radius_km = $6,
    required_from = $7,
    required_until = $8,
    status = $9,
    updated_at = NOW()
WHERE id = $1
RETURNING id, buyer_id, crop_type, quantity_required_kg, remaining_quantity_kg, max_price_per_kg, preferred_radius_km, required_from, required_until, status, created_at, updated_at;

-- name: UpdateBuyerRequirementStatus :one
UPDATE buyer_requirements
SET
    status = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING id, buyer_id, crop_type, quantity_required_kg, remaining_quantity_kg, max_price_per_kg, preferred_radius_km, required_from, required_until, status, created_at, updated_at;

-- name: DeleteBuyerRequirement :exec
DELETE FROM buyer_requirements
WHERE id = $1;
