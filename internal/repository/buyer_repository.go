package repository

import (
	"context"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type BuyerRepository interface {
	Create(ctx context.Context, arg sqlc.CreateBuyerProfileParams) (sqlc.BuyerProfile, error)
	GetByID(ctx context.Context, id pgtype.UUID) (sqlc.BuyerProfile, error)
	GetByUserID(ctx context.Context, userID pgtype.UUID) (sqlc.BuyerProfile, error)
	List(ctx context.Context, arg sqlc.ListBuyerProfilesParams) ([]sqlc.BuyerProfile, error)
	Update(ctx context.Context, arg sqlc.UpdateBuyerProfileParams) (sqlc.BuyerProfile, error)
	Delete(ctx context.Context, id pgtype.UUID) error
}

type buyerRepository struct {
	queries sqlc.Querier
}

func NewBuyerRepository(queries sqlc.Querier) BuyerRepository {
	return &buyerRepository{
		queries: queries,
	}
}

func (r *buyerRepository) Create(ctx context.Context, arg sqlc.CreateBuyerProfileParams) (sqlc.BuyerProfile, error) {
	res, err := r.queries.CreateBuyerProfile(ctx, arg)
	return res, handleError(err)
}

func (r *buyerRepository) GetByID(ctx context.Context, id pgtype.UUID) (sqlc.BuyerProfile, error) {
	res, err := r.queries.GetBuyerProfileByID(ctx, id)
	return res, handleError(err)
}

func (r *buyerRepository) GetByUserID(ctx context.Context, userID pgtype.UUID) (sqlc.BuyerProfile, error) {
	res, err := r.queries.GetBuyerProfileByUserID(ctx, userID)
	return res, handleError(err)
}

func (r *buyerRepository) List(ctx context.Context, arg sqlc.ListBuyerProfilesParams) ([]sqlc.BuyerProfile, error) {
	res, err := r.queries.ListBuyerProfiles(ctx, arg)
	return res, handleError(err)
}

func (r *buyerRepository) Update(ctx context.Context, arg sqlc.UpdateBuyerProfileParams) (sqlc.BuyerProfile, error) {
	res, err := r.queries.UpdateBuyerProfile(ctx, arg)
	return res, handleError(err)
}

func (r *buyerRepository) Delete(ctx context.Context, id pgtype.UUID) error {
	return handleError(r.queries.DeleteBuyerProfile(ctx, id))
}
