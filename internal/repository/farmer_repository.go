package repository

import (
	"context"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type FarmerRepository interface {
	Create(ctx context.Context, arg sqlc.CreateFarmerProfileParams) (sqlc.FarmerProfile, error)
	GetByID(ctx context.Context, id pgtype.UUID) (sqlc.FarmerProfile, error)
	GetByUserID(ctx context.Context, userID pgtype.UUID) (sqlc.FarmerProfile, error)
	List(ctx context.Context, arg sqlc.ListFarmerProfilesParams) ([]sqlc.FarmerProfile, error)
	Update(ctx context.Context, arg sqlc.UpdateFarmerProfileParams) (sqlc.FarmerProfile, error)
	Delete(ctx context.Context, id pgtype.UUID) error
}

type farmerRepository struct {
	queries sqlc.Querier
}

func NewFarmerRepository(queries sqlc.Querier) FarmerRepository {
	return &farmerRepository{
		queries: queries,
	}
}

func (r *farmerRepository) Create(ctx context.Context, arg sqlc.CreateFarmerProfileParams) (sqlc.FarmerProfile, error) {
	res, err := r.queries.CreateFarmerProfile(ctx, arg)
	return res, handleError(err)
}

func (r *farmerRepository) GetByID(ctx context.Context, id pgtype.UUID) (sqlc.FarmerProfile, error) {
	res, err := r.queries.GetFarmerProfileByID(ctx, id)
	return res, handleError(err)
}

func (r *farmerRepository) GetByUserID(ctx context.Context, userID pgtype.UUID) (sqlc.FarmerProfile, error) {
	res, err := r.queries.GetFarmerProfileByUserID(ctx, userID)
	return res, handleError(err)
}

func (r *farmerRepository) List(ctx context.Context, arg sqlc.ListFarmerProfilesParams) ([]sqlc.FarmerProfile, error) {
	res, err := r.queries.ListFarmerProfiles(ctx, arg)
	return res, handleError(err)
}

func (r *farmerRepository) Update(ctx context.Context, arg sqlc.UpdateFarmerProfileParams) (sqlc.FarmerProfile, error) {
	res, err := r.queries.UpdateFarmerProfile(ctx, arg)
	return res, handleError(err)
}

func (r *farmerRepository) Delete(ctx context.Context, id pgtype.UUID) error {
	return handleError(r.queries.DeleteFarmerProfile(ctx, id))
}
