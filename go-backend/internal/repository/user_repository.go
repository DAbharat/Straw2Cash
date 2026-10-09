package repository

import (
	"context"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
)

type UserRepository interface {
	CreateUser(ctx context.Context, name, email, phone, passwordHash, role string) (sqlc.User, error)
	GetUserByID(ctx context.Context, id string) (sqlc.User, error)
	GetUserByEmail(ctx context.Context, email string) (sqlc.User, error)
	GetUserByPhone(ctx context.Context, phone string) (sqlc.User, error)
	ListUsers(ctx context.Context, limit, offset int32) ([]sqlc.User, error)
	UpdateUser(ctx context.Context, id, name, email, phone, passwordHash, role string) (sqlc.User, error)
	DeleteUser(ctx context.Context, id string) error
}

type userRepository struct {
	queries sqlc.Querier
}

func NewUserRepository(queries sqlc.Querier) UserRepository {
	return &userRepository{
		queries: queries,
	}
}

func (r *userRepository) CreateUser(ctx context.Context, name, email, phone, passwordHash, role string) (sqlc.User, error) {
	arg := sqlc.CreateUserParams{
		Name:         name,
		Email:        toPgText(email),
		Phone:        phone,
		PasswordHash: passwordHash,
		Role:         sqlc.UserRole(role),
	}
	res, err := r.queries.CreateUser(ctx, arg)
	return res, handleError(err)
}

func (r *userRepository) GetUserByID(ctx context.Context, id string) (sqlc.User, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.User{}, err
	}
	res, err := r.queries.GetUserByID(ctx, uuid)
	return res, handleError(err)
}

func (r *userRepository) GetUserByEmail(ctx context.Context, email string) (sqlc.User, error) {
	res, err := r.queries.GetUserByEmail(ctx, toPgText(email))
	return res, handleError(err)
}

func (r *userRepository) GetUserByPhone(ctx context.Context, phone string) (sqlc.User, error) {
	res, err := r.queries.GetUserByPhone(ctx, phone)
	return res, handleError(err)
}

func (r *userRepository) ListUsers(ctx context.Context, limit, offset int32) ([]sqlc.User, error) {
	arg := sqlc.ListUsersParams{Limit: limit, Offset: offset}
	res, err := r.queries.ListUsers(ctx, arg)
	return res, handleError(err)
}

func (r *userRepository) UpdateUser(ctx context.Context, id, name, email, phone, passwordHash, role string) (sqlc.User, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.User{}, err
	}
	arg := sqlc.UpdateUserParams{
		ID:           uuid,
		Name:         name,
		Email:        toPgText(email),
		Phone:        phone,
		PasswordHash: passwordHash,
	}
	res, err := r.queries.UpdateUser(ctx, arg)
	return res, handleError(err)
}

func (r *userRepository) DeleteUser(ctx context.Context, id string) error {
	uuid, err := parseUUID(id)
	if err != nil {
		return err
	}
	return handleError(r.queries.DeleteUser(ctx, uuid))
}
