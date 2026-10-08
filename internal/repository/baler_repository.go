package repository

import (
	"context"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type BalerRepository interface {
	Create(ctx context.Context, arg sqlc.CreateBalerProfileParams) (sqlc.BalerProfile, error)
	GetByID(ctx context.Context, id pgtype.UUID) (sqlc.BalerProfile, error)
	GetByUserID(ctx context.Context, userID pgtype.UUID) (sqlc.BalerProfile, error)
	List(ctx context.Context, arg sqlc.ListBalerProfilesParams) ([]sqlc.BalerProfile, error)
	Update(ctx context.Context, arg sqlc.UpdateBalerProfileParams) (sqlc.BalerProfile, error)
	Delete(ctx context.Context, id pgtype.UUID) error
}

type balerRepository struct {
	queries sqlc.Querier
}

func NewBalerRepository(queries sqlc.Querier) BalerRepository {
	return &balerRepository{
		queries: queries,
	}
}

func (r *balerRepository) Create(ctx context.Context, arg sqlc.CreateBalerProfileParams) (sqlc.BalerProfile, error) {
	res, err := r.queries.CreateBalerProfile(ctx, arg)
	return res, handleError(err)
}

func (r *balerRepository) GetByID(ctx context.Context, id pgtype.UUID) (sqlc.BalerProfile, error) {
	res, err := r.queries.GetBalerProfileByID(ctx, id)
	return res, handleError(err)
}

func (r *balerRepository) GetByUserID(ctx context.Context, userID pgtype.UUID) (sqlc.BalerProfile, error) {
	res, err := r.queries.GetBalerProfileByUserID(ctx, userID)
	return res, handleError(err)
}

func (r *balerRepository) List(ctx context.Context, arg sqlc.ListBalerProfilesParams) ([]sqlc.BalerProfile, error) {
	res, err := r.queries.ListBalerProfiles(ctx, arg)
	return res, handleError(err)
}

func (r *balerRepository) Update(ctx context.Context, arg sqlc.UpdateBalerProfileParams) (sqlc.BalerProfile, error) {
	res, err := r.queries.UpdateBalerProfile(ctx, arg)
	return res, handleError(err)
}

func (r *balerRepository) Delete(ctx context.Context, id pgtype.UUID) error {
	return handleError(r.queries.DeleteBalerProfile(ctx, id))
}
