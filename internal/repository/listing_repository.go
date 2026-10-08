package repository

import (
	"context"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type ListingRepository interface {
	Create(ctx context.Context, arg sqlc.CreateStrawListingParams) (sqlc.StrawListing, error)
	GetByID(ctx context.Context, id pgtype.UUID) (sqlc.StrawListing, error)
	List(ctx context.Context, arg sqlc.ListStrawListingsParams) ([]sqlc.StrawListing, error)
	ListByFarmerID(ctx context.Context, arg sqlc.ListStrawListingsByFarmerIDParams) ([]sqlc.StrawListing, error)
	ListByStatus(ctx context.Context, arg sqlc.ListStrawListingsByStatusParams) ([]sqlc.StrawListing, error)
	Update(ctx context.Context, arg sqlc.UpdateStrawListingParams) (sqlc.StrawListing, error)
	UpdateStatus(ctx context.Context, arg sqlc.UpdateStrawListingStatusParams) (sqlc.StrawListing, error)
	Delete(ctx context.Context, id pgtype.UUID) error
}

type listingRepository struct {
	queries sqlc.Querier
}

func NewListingRepository(queries sqlc.Querier) ListingRepository {
	return &listingRepository{
		queries: queries,
	}
}

func (r *listingRepository) Create(ctx context.Context, arg sqlc.CreateStrawListingParams) (sqlc.StrawListing, error) {
	res, err := r.queries.CreateStrawListing(ctx, arg)
	return res, handleError(err)
}

func (r *listingRepository) GetByID(ctx context.Context, id pgtype.UUID) (sqlc.StrawListing, error) {
	res, err := r.queries.GetStrawListingByID(ctx, id)
	return res, handleError(err)
}

func (r *listingRepository) List(ctx context.Context, arg sqlc.ListStrawListingsParams) ([]sqlc.StrawListing, error) {
	res, err := r.queries.ListStrawListings(ctx, arg)
	return res, handleError(err)
}

func (r *listingRepository) ListByFarmerID(ctx context.Context, arg sqlc.ListStrawListingsByFarmerIDParams) ([]sqlc.StrawListing, error) {
	res, err := r.queries.ListStrawListingsByFarmerID(ctx, arg)
	return res, handleError(err)
}

func (r *listingRepository) ListByStatus(ctx context.Context, arg sqlc.ListStrawListingsByStatusParams) ([]sqlc.StrawListing, error) {
	res, err := r.queries.ListStrawListingsByStatus(ctx, arg)
	return res, handleError(err)
}

func (r *listingRepository) Update(ctx context.Context, arg sqlc.UpdateStrawListingParams) (sqlc.StrawListing, error) {
	res, err := r.queries.UpdateStrawListing(ctx, arg)
	return res, handleError(err)
}

func (r *listingRepository) UpdateStatus(ctx context.Context, arg sqlc.UpdateStrawListingStatusParams) (sqlc.StrawListing, error) {
	res, err := r.queries.UpdateStrawListingStatus(ctx, arg)
	return res, handleError(err)
}

func (r *listingRepository) Delete(ctx context.Context, id pgtype.UUID) error {
	return handleError(r.queries.DeleteStrawListing(ctx, id))
}
