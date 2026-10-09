package repository

import (
	"context"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
)

type BalerRepository interface {
	CreateProfile(ctx context.Context, userID, orgName, phone, vehicle, area, district, state string) (sqlc.BalerProfile, error)
	GetProfileByID(ctx context.Context, id string) (sqlc.BalerProfile, error)
	GetProfileByUserID(ctx context.Context, userID string) (sqlc.BalerProfile, error)
	ListProfiles(ctx context.Context, limit, offset int32) ([]sqlc.BalerProfile, error)
	UpdateProfile(ctx context.Context, id string, orgName, phone, vehicle *string, area, district, state string) (sqlc.BalerProfile, error)
	DeleteProfile(ctx context.Context, id string) error
}

type balerRepository struct {
	queries sqlc.Querier
}

func NewBalerRepository(queries sqlc.Querier) BalerRepository {
	return &balerRepository{
		queries: queries,
	}
}

func (r *balerRepository) CreateProfile(ctx context.Context, userID, orgName, phone, vehicle, area, district, state string) (sqlc.BalerProfile, error) {
	uUUID, err := parseUUID(userID)
	if err != nil {
		return sqlc.BalerProfile{}, err
	}
	arg := sqlc.CreateBalerProfileParams{
		UserID:           uUUID,
		OrganizationName: toPgText(orgName),
		Phone:            toPgText(phone),
		VehicleDetails:   toPgText(vehicle),
		ServiceArea:      area,
		District:         district,
		State:            state,
	}
	res, err := r.queries.CreateBalerProfile(ctx, arg)
	return res, handleError(err)
}

func (r *balerRepository) GetProfileByID(ctx context.Context, id string) (sqlc.BalerProfile, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.BalerProfile{}, err
	}
	res, err := r.queries.GetBalerProfileByID(ctx, uuid)
	return res, handleError(err)
}

func (r *balerRepository) GetProfileByUserID(ctx context.Context, userID string) (sqlc.BalerProfile, error) {
	uuid, err := parseUUID(userID)
	if err != nil {
		return sqlc.BalerProfile{}, err
	}
	res, err := r.queries.GetBalerProfileByUserID(ctx, uuid)
	return res, handleError(err)
}

func (r *balerRepository) ListProfiles(ctx context.Context, limit, offset int32) ([]sqlc.BalerProfile, error) {
	arg := sqlc.ListBalerProfilesParams{Limit: limit, Offset: offset}
	res, err := r.queries.ListBalerProfiles(ctx, arg)
	return res, handleError(err)
}

func (r *balerRepository) UpdateProfile(ctx context.Context, id string, orgName, phone, vehicle *string, area, district, state string) (sqlc.BalerProfile, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.BalerProfile{}, err
	}
	arg := sqlc.UpdateBalerProfileParams{
		ID:          uuid,
		ServiceArea: area,
		District:    district,
		State:       state,
	}
	if orgName != nil {
		arg.OrganizationName = toPgText(*orgName)
	}
	if phone != nil {
		arg.Phone = toPgText(*phone)
	}
	if vehicle != nil {
		arg.VehicleDetails = toPgText(*vehicle)
	}
	res, err := r.queries.UpdateBalerProfile(ctx, arg)
	return res, handleError(err)
}

func (r *balerRepository) DeleteProfile(ctx context.Context, id string) error {
	uuid, err := parseUUID(id)
	if err != nil {
		return err
	}
	return handleError(r.queries.DeleteBalerProfile(ctx, uuid))
}
