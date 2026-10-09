-- name: CreateUser :one
INSERT INTO users (
    name,
    email,
    phone,
    password_hash,
    role,
    is_active
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING id, name, email, phone, password_hash, role, is_active, created_at, updated_at;

-- name: GetUserByID :one
SELECT
    id, name, email, phone, password_hash, role, is_active, created_at, updated_at
FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT
    id, name, email, phone, password_hash, role, is_active, created_at, updated_at
FROM users
WHERE email = $1;

-- name: GetUserByPhone :one
SELECT
    id, name, email, phone, password_hash, role, is_active, created_at, updated_at
FROM users
WHERE phone = $1;

-- name: ListUsers :many
SELECT
    id, name, email, phone, password_hash, role, is_active, created_at, updated_at
FROM users
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateUser :one
UPDATE users
SET
    name = $2,
    email = $3,
    phone = $4,
    password_hash = $5,
    is_active = $6,
    updated_at = NOW()
WHERE id = $1
RETURNING id, name, email, phone, password_hash, role, is_active, created_at, updated_at;

-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;
