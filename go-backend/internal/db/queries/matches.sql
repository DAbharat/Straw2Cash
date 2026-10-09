-- name: CreateMatch :one
INSERT INTO matches (
    listing_id,
    requirement_id,
    baler_id,
    matched_quantity_kg,
    agreed_price_per_kg,
    match_score,
    status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING id, listing_id, requirement_id, baler_id, matched_quantity_kg, agreed_price_per_kg, match_score, status, created_at, updated_at;

-- name: GetMatchByID :one
SELECT
    id, listing_id, requirement_id, baler_id, matched_quantity_kg, agreed_price_per_kg, match_score, status, created_at, updated_at
FROM matches
WHERE id = $1;

-- name: ListMatches :many
SELECT
    id, listing_id, requirement_id, baler_id, matched_quantity_kg, agreed_price_per_kg, match_score, status, created_at, updated_at
FROM matches
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListMatchesByListingID :many
SELECT
    id, listing_id, requirement_id, baler_id, matched_quantity_kg, agreed_price_per_kg, match_score, status, created_at, updated_at
FROM matches
WHERE listing_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListMatchesByRequirementID :many
SELECT
    id, listing_id, requirement_id, baler_id, matched_quantity_kg, agreed_price_per_kg, match_score, status, created_at, updated_at
FROM matches
WHERE requirement_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListMatchesByBalerID :many
SELECT
    id, listing_id, requirement_id, baler_id, matched_quantity_kg, agreed_price_per_kg, match_score, status, created_at, updated_at
FROM matches
WHERE baler_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateMatch :one
UPDATE matches
SET
    baler_id = $2,
    matched_quantity_kg = $3,
    agreed_price_per_kg = $4,
    match_score = $5,
    status = $6,
    updated_at = NOW()
WHERE id = $1
RETURNING id, listing_id, requirement_id, baler_id, matched_quantity_kg, agreed_price_per_kg, match_score, status, created_at, updated_at;

-- name: UpdateMatchStatus :one
UPDATE matches
SET
    status = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING id, listing_id, requirement_id, baler_id, matched_quantity_kg, agreed_price_per_kg, match_score, status, created_at, updated_at;

-- name: DeleteMatch :exec
DELETE FROM matches
WHERE id = $1;
