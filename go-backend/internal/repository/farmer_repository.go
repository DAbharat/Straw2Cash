package repository

import (
	"context"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
)

type FarmerRepository interface {
	CreateProfile(ctx context.Context, userID, village, district, state string, lat, lon, land float64) (sqlc.FarmerProfile, error)
	GetProfileByID(ctx context.Context, id string) (sqlc.FarmerProfile, error)
	GetProfileByUserID(ctx context.Context, userID string) (sqlc.FarmerProfile, error)
	ListProfiles(ctx context.Context, limit, offset int32) ([]sqlc.FarmerProfile, error)
	UpdateProfile(ctx context.Context, id, village, district, state string, lat, lon, land float64) (sqlc.FarmerProfile, error)
	DeleteProfile(ctx context.Context, id string) error
}

type farmerRepository struct {
	queries sqlc.Querier
}

func NewFarmerRepository(queries sqlc.Querier) FarmerRepository {
	return &farmerRepository{
		queries: queries,
	}
}

func (r *farmerRepository) CreateProfile(ctx context.Context, userID, village, district, state string, lat, lon, land float64) (sqlc.FarmerProfile, error) {
	uUUID, err := parseUUID(userID)
	if err != nil {
		return sqlc.FarmerProfile{}, err
	}
	arg := sqlc.CreateFarmerProfileParams{
		UserID:        uUUID,
		Village:       village,
		District:      district,
		State:         state,
		Latitude:      toPgNumeric(lat),
		Longitude:     toPgNumeric(lon),
		LandAreaAcres: toPgNumeric(land),
	}
	res, err := r.queries.CreateFarmerProfile(ctx, arg)
	return res, handleError(err)
}

func (r *farmerRepository) GetProfileByID(ctx context.Context, id string) (sqlc.FarmerProfile, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.FarmerProfile{}, err
	}
	res, err := r.queries.GetFarmerProfileByID(ctx, uuid)
	return res, handleError(err)
}

func (r *farmerRepository) GetProfileByUserID(ctx context.Context, userID string) (sqlc.FarmerProfile, error) {
	uuid, err := parseUUID(userID)
	if err != nil {
		return sqlc.FarmerProfile{}, err
	}
	res, err := r.queries.GetFarmerProfileByUserID(ctx, uuid)
	return res, handleError(err)
}

func (r *farmerRepository) ListProfiles(ctx context.Context, limit, offset int32) ([]sqlc.FarmerProfile, error) {
	arg := sqlc.ListFarmerProfilesParams{Limit: limit, Offset: offset}
	res, err := r.queries.ListFarmerProfiles(ctx, arg)
	return res, handleError(err)
}

func (r *farmerRepository) UpdateProfile(ctx context.Context, id, village, district, state string, lat, lon, land float64) (sqlc.FarmerProfile, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.FarmerProfile{}, err
	}
	arg := sqlc.UpdateFarmerProfileParams{
		ID:            uuid,
		Village:       village,
		District:      district,
		State:         state,
		Latitude:      toPgNumeric(lat),
		Longitude:     toPgNumeric(lon),
		LandAreaAcres: toPgNumeric(land),
	}
	res, err := r.queries.UpdateFarmerProfile(ctx, arg)
	return res, handleError(err)
}

func (r *farmerRepository) DeleteProfile(ctx context.Context, id string) error {
	uuid, err := parseUUID(id)
	if err != nil {
		return err
	}
	return handleError(r.queries.DeleteFarmerProfile(ctx, uuid))
}
