package repository

import (
	"context"
	"time"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type ListingRepository interface {
	CreateListing(ctx context.Context, farmerID string, cropType string, qty float64, harvest, availFrom, availUntil time.Time, pickLat, pickLon float64, price, moisture *float64) (sqlc.StrawListing, error)
	GetListingByID(ctx context.Context, id string) (sqlc.StrawListing, error)
	ListListings(ctx context.Context, limit, offset int32) ([]sqlc.StrawListing, error)
	ListListingsByFarmerID(ctx context.Context, farmerID string, limit, offset int32) ([]sqlc.StrawListing, error)
	ListListingsByStatus(ctx context.Context, status string, limit, offset int32) ([]sqlc.StrawListing, error)
	UpdateListing(ctx context.Context, id string, cropType *string, qty *float64, harvest, availFrom, availUntil *time.Time, pickLat, pickLon, price, moisture *float64) (sqlc.StrawListing, error)
	UpdateListingStatus(ctx context.Context, id string, status string) (sqlc.StrawListing, error)
	DeleteListing(ctx context.Context, id string) error
}

type listingRepository struct {
	queries sqlc.Querier
}

func NewListingRepository(queries sqlc.Querier) ListingRepository {
	return &listingRepository{
		queries: queries,
	}
}

func (r *listingRepository) CreateListing(ctx context.Context, farmerID string, cropType string, qty float64, harvest, availFrom, availUntil time.Time, pickLat, pickLon float64, price, moisture *float64) (sqlc.StrawListing, error) {
	fUUID, err := parseUUID(farmerID)
	if err != nil {
		return sqlc.StrawListing{}, err
	}
	arg := sqlc.CreateStrawListingParams{
		FarmerID:        fUUID,
		CropType:        cropType,
		QuantityKg:      toPgNumeric(qty),
		HarvestDate:     pgtype.Date{Time: harvest, Valid: true},
		AvailableFrom:   pgtype.Date{Time: availFrom, Valid: true},
		AvailableUntil:  pgtype.Date{Time: availUntil, Valid: true},
		PickupLatitude:  toPgNumeric(pickLat),
		PickupLongitude: toPgNumeric(pickLon),
		Status:          sqlc.ListingStatusAVAILABLE,
	}
	if price != nil {
		arg.PricePerKg = toPgNumeric(*price)
	}
	if moisture != nil {
		arg.MoisturePercentage = toPgNumeric(*moisture)
	}
	res, err := r.queries.CreateStrawListing(ctx, arg)
	return res, handleError(err)
}

func (r *listingRepository) GetListingByID(ctx context.Context, id string) (sqlc.StrawListing, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.StrawListing{}, err
	}
	res, err := r.queries.GetStrawListingByID(ctx, uuid)
	return res, handleError(err)
}

func (r *listingRepository) ListListings(ctx context.Context, limit, offset int32) ([]sqlc.StrawListing, error) {
	arg := sqlc.ListStrawListingsParams{Limit: limit, Offset: offset}
	res, err := r.queries.ListStrawListings(ctx, arg)
	return res, handleError(err)
}

func (r *listingRepository) ListListingsByFarmerID(ctx context.Context, farmerID string, limit, offset int32) ([]sqlc.StrawListing, error) {
	uuid, err := parseUUID(farmerID)
	if err != nil {
		return nil, err
	}
	arg := sqlc.ListStrawListingsByFarmerIDParams{FarmerID: uuid, Limit: limit, Offset: offset}
	res, err := r.queries.ListStrawListingsByFarmerID(ctx, arg)
	return res, handleError(err)
}

func (r *listingRepository) ListListingsByStatus(ctx context.Context, status string, limit, offset int32) ([]sqlc.StrawListing, error) {
	arg := sqlc.ListStrawListingsByStatusParams{Status: sqlc.ListingStatus(status), Limit: limit, Offset: offset}
	res, err := r.queries.ListStrawListingsByStatus(ctx, arg)
	return res, handleError(err)
}

func (r *listingRepository) UpdateListing(ctx context.Context, id string, cropType *string, qty *float64, harvest, availFrom, availUntil *time.Time, pickLat, pickLon, price, moisture *float64) (sqlc.StrawListing, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.StrawListing{}, err
	}
	arg := sqlc.UpdateStrawListingParams{ID: uuid}
	if cropType != nil {
		arg.CropType = *cropType
	}
	if qty != nil {
		arg.QuantityKg = toPgNumeric(*qty)
	}
	if harvest != nil {
		arg.HarvestDate = pgtype.Date{Time: *harvest, Valid: true}
	}
	if availFrom != nil {
		arg.AvailableFrom = pgtype.Date{Time: *availFrom, Valid: true}
	}
	if availUntil != nil {
		arg.AvailableUntil = pgtype.Date{Time: *availUntil, Valid: true}
	}
	if pickLat != nil {
		arg.PickupLatitude = toPgNumeric(*pickLat)
	}
	if pickLon != nil {
		arg.PickupLongitude = toPgNumeric(*pickLon)
	}
	if price != nil {
		arg.PricePerKg = toPgNumeric(*price)
	}
	if moisture != nil {
		arg.MoisturePercentage = toPgNumeric(*moisture)
	}
	res, err := r.queries.UpdateStrawListing(ctx, arg)
	return res, handleError(err)
}

func (r *listingRepository) UpdateListingStatus(ctx context.Context, id string, status string) (sqlc.StrawListing, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.StrawListing{}, err
	}
	arg := sqlc.UpdateStrawListingStatusParams{ID: uuid, Status: sqlc.ListingStatus(status)}
	res, err := r.queries.UpdateStrawListingStatus(ctx, arg)
	return res, handleError(err)
}

func (r *listingRepository) DeleteListing(ctx context.Context, id string) error {
	uuid, err := parseUUID(id)
	if err != nil {
		return err
	}
	return handleError(r.queries.DeleteStrawListing(ctx, uuid))
}
