package repository

import (
	"context"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type UserRepository interface {
	Create(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error)
	GetByID(ctx context.Context, id pgtype.UUID) (sqlc.User, error)
	GetByEmail(ctx context.Context, email pgtype.Text) (sqlc.User, error)
	GetByPhone(ctx context.Context, phone string) (sqlc.User, error)
	List(ctx context.Context, arg sqlc.ListUsersParams) ([]sqlc.User, error)
	Update(ctx context.Context, arg sqlc.UpdateUserParams) (sqlc.User, error)
	Delete(ctx context.Context, id pgtype.UUID) error
}

type userRepository struct {
	queries sqlc.Querier
}

func NewUserRepository(queries sqlc.Querier) UserRepository {
	return &userRepository{
		queries: queries,
	}
}

func (r *userRepository) Create(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error) {
	res, err := r.queries.CreateUser(ctx, arg)
	return res, handleError(err)
}

func (r *userRepository) GetByID(ctx context.Context, id pgtype.UUID) (sqlc.User, error) {
	res, err := r.queries.GetUserByID(ctx, id)
	return res, handleError(err)
}

func (r *userRepository) GetByEmail(ctx context.Context, email pgtype.Text) (sqlc.User, error) {
	res, err := r.queries.GetUserByEmail(ctx, email)
	return res, handleError(err)
}

func (r *userRepository) GetByPhone(ctx context.Context, phone string) (sqlc.User, error) {
	res, err := r.queries.GetUserByPhone(ctx, phone)
	return res, handleError(err)
}

func (r *userRepository) List(ctx context.Context, arg sqlc.ListUsersParams) ([]sqlc.User, error) {
	res, err := r.queries.ListUsers(ctx, arg)
	return res, handleError(err)
}

func (r *userRepository) Update(ctx context.Context, arg sqlc.UpdateUserParams) (sqlc.User, error) {
	res, err := r.queries.UpdateUser(ctx, arg)
	return res, handleError(err)
}

func (r *userRepository) Delete(ctx context.Context, id pgtype.UUID) error {
	return handleError(r.queries.DeleteUser(ctx, id))
}
