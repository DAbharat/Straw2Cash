package repository

import (
	"context"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
)

type BuyerRepository interface {
	CreateProfile(ctx context.Context, userID, orgName, buyerType, address, district, state string, lat, lon float64) (sqlc.BuyerProfile, error)
	GetProfileByID(ctx context.Context, id string) (sqlc.BuyerProfile, error)
	GetProfileByUserID(ctx context.Context, userID string) (sqlc.BuyerProfile, error)
	ListProfiles(ctx context.Context, limit, offset int32) ([]sqlc.BuyerProfile, error)
	UpdateProfile(ctx context.Context, id, orgName, buyerType, address, district, state string, lat, lon float64) (sqlc.BuyerProfile, error)
	DeleteProfile(ctx context.Context, id string) error
}

type buyerRepository struct {
	queries sqlc.Querier
}

func NewBuyerRepository(queries sqlc.Querier) BuyerRepository {
	return &buyerRepository{
		queries: queries,
	}
}

func (r *buyerRepository) CreateProfile(ctx context.Context, userID, orgName, buyerType, address, district, state string, lat, lon float64) (sqlc.BuyerProfile, error) {
	uUUID, err := parseUUID(userID)
	if err != nil {
		return sqlc.BuyerProfile{}, err
	}
	arg := sqlc.CreateBuyerProfileParams{
		UserID:           uUUID,
		OrganizationName: orgName,
		BuyerType:        sqlc.BuyerType(buyerType),
		Address:          address,
		District:         district,
		State:            state,
		Latitude:         toPgNumeric(lat),
		Longitude:        toPgNumeric(lon),
	}
	res, err := r.queries.CreateBuyerProfile(ctx, arg)
	return res, handleError(err)
}

func (r *buyerRepository) GetProfileByID(ctx context.Context, id string) (sqlc.BuyerProfile, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.BuyerProfile{}, err
	}
	res, err := r.queries.GetBuyerProfileByID(ctx, uuid)
	return res, handleError(err)
}

func (r *buyerRepository) GetProfileByUserID(ctx context.Context, userID string) (sqlc.BuyerProfile, error) {
	uuid, err := parseUUID(userID)
	if err != nil {
		return sqlc.BuyerProfile{}, err
	}
	res, err := r.queries.GetBuyerProfileByUserID(ctx, uuid)
	return res, handleError(err)
}

func (r *buyerRepository) ListProfiles(ctx context.Context, limit, offset int32) ([]sqlc.BuyerProfile, error) {
	arg := sqlc.ListBuyerProfilesParams{Limit: limit, Offset: offset}
	res, err := r.queries.ListBuyerProfiles(ctx, arg)
	return res, handleError(err)
}

func (r *buyerRepository) UpdateProfile(ctx context.Context, id, orgName, buyerType, address, district, state string, lat, lon float64) (sqlc.BuyerProfile, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.BuyerProfile{}, err
	}
	arg := sqlc.UpdateBuyerProfileParams{
		ID:               uuid,
		OrganizationName: orgName,
		BuyerType:        sqlc.BuyerType(buyerType),
		Address:          address,
		District:         district,
		State:            state,
		Latitude:         toPgNumeric(lat),
		Longitude:        toPgNumeric(lon),
	}
	res, err := r.queries.UpdateBuyerProfile(ctx, arg)
	return res, handleError(err)
}

func (r *buyerRepository) DeleteProfile(ctx context.Context, id string) error {
	uuid, err := parseUUID(id)
	if err != nil {
		return err
	}
	return handleError(r.queries.DeleteBuyerProfile(ctx, uuid))
}
