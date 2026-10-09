package repository

import (
	"context"
	"time"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type RequirementRepository interface {
	CreateRequirement(ctx context.Context, buyerID, cropType string, qty float64, reqFrom, reqUntil time.Time, maxPrice, radius *float64) (sqlc.BuyerRequirement, error)
	GetRequirementByID(ctx context.Context, id string) (sqlc.BuyerRequirement, error)
	ListRequirements(ctx context.Context, limit, offset int32) ([]sqlc.BuyerRequirement, error)
	ListRequirementsByBuyerID(ctx context.Context, buyerID string, limit, offset int32) ([]sqlc.BuyerRequirement, error)
	ListRequirementsByStatus(ctx context.Context, status string, limit, offset int32) ([]sqlc.BuyerRequirement, error)
	UpdateRequirement(ctx context.Context, id string, cropType *string, qty, remQty *float64, reqFrom, reqUntil *time.Time, maxPrice, radius *float64) (sqlc.BuyerRequirement, error)
	UpdateRequirementStatus(ctx context.Context, id string, status string) (sqlc.BuyerRequirement, error)
	DeleteRequirement(ctx context.Context, id string) error
}

type requirementRepository struct {
	queries sqlc.Querier
}

func NewRequirementRepository(queries sqlc.Querier) RequirementRepository {
	return &requirementRepository{
		queries: queries,
	}
}

func (r *requirementRepository) CreateRequirement(ctx context.Context, buyerID, cropType string, qty float64, reqFrom, reqUntil time.Time, maxPrice, radius *float64) (sqlc.BuyerRequirement, error) {
	bUUID, err := parseUUID(buyerID)
	if err != nil {
		return sqlc.BuyerRequirement{}, err
	}
	arg := sqlc.CreateBuyerRequirementParams{
		BuyerID:             bUUID,
		CropType:            cropType,
		QuantityRequiredKg:  toPgNumeric(qty),
		RemainingQuantityKg: toPgNumeric(qty),
		RequiredFrom:        pgtype.Date{Time: reqFrom, Valid: true},
		RequiredUntil:       pgtype.Date{Time: reqUntil, Valid: true},
		Status:              sqlc.RequirementStatusOPEN,
	}
	if maxPrice != nil {
		arg.MaxPricePerKg = toPgNumeric(*maxPrice)
	}
	if radius != nil {
		arg.PreferredRadiusKm = toPgNumeric(*radius)
	}
	res, err := r.queries.CreateBuyerRequirement(ctx, arg)
	return res, handleError(err)
}

func (r *requirementRepository) GetRequirementByID(ctx context.Context, id string) (sqlc.BuyerRequirement, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.BuyerRequirement{}, err
	}
	res, err := r.queries.GetBuyerRequirementByID(ctx, uuid)
	return res, handleError(err)
}

func (r *requirementRepository) ListRequirements(ctx context.Context, limit, offset int32) ([]sqlc.BuyerRequirement, error) {
	arg := sqlc.ListBuyerRequirementsParams{Limit: limit, Offset: offset}
	res, err := r.queries.ListBuyerRequirements(ctx, arg)
	return res, handleError(err)
}

func (r *requirementRepository) ListRequirementsByBuyerID(ctx context.Context, buyerID string, limit, offset int32) ([]sqlc.BuyerRequirement, error) {
	uuid, err := parseUUID(buyerID)
	if err != nil {
		return nil, err
	}
	arg := sqlc.ListBuyerRequirementsByBuyerIDParams{BuyerID: uuid, Limit: limit, Offset: offset}
	res, err := r.queries.ListBuyerRequirementsByBuyerID(ctx, arg)
	return res, handleError(err)
}

func (r *requirementRepository) ListRequirementsByStatus(ctx context.Context, status string, limit, offset int32) ([]sqlc.BuyerRequirement, error) {
	arg := sqlc.ListBuyerRequirementsByStatusParams{Status: sqlc.RequirementStatus(status), Limit: limit, Offset: offset}
	res, err := r.queries.ListBuyerRequirementsByStatus(ctx, arg)
	return res, handleError(err)
}

func (r *requirementRepository) UpdateRequirement(ctx context.Context, id string, cropType *string, qty, remQty *float64, reqFrom, reqUntil *time.Time, maxPrice, radius *float64) (sqlc.BuyerRequirement, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.BuyerRequirement{}, err
	}
	arg := sqlc.UpdateBuyerRequirementParams{ID: uuid}
	if cropType != nil {
		arg.CropType = *cropType
	}
	if qty != nil {
		arg.QuantityRequiredKg = toPgNumeric(*qty)
	}
	if remQty != nil {
		arg.RemainingQuantityKg = toPgNumeric(*remQty)
	}
	if reqFrom != nil {
		arg.RequiredFrom = pgtype.Date{Time: *reqFrom, Valid: true}
	}
	if reqUntil != nil {
		arg.RequiredUntil = pgtype.Date{Time: *reqUntil, Valid: true}
	}
	if maxPrice != nil {
		arg.MaxPricePerKg = toPgNumeric(*maxPrice)
	}
	if radius != nil {
		arg.PreferredRadiusKm = toPgNumeric(*radius)
	}
	res, err := r.queries.UpdateBuyerRequirement(ctx, arg)
	return res, handleError(err)
}

func (r *requirementRepository) UpdateRequirementStatus(ctx context.Context, id string, status string) (sqlc.BuyerRequirement, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.BuyerRequirement{}, err
	}
	arg := sqlc.UpdateBuyerRequirementStatusParams{ID: uuid, Status: sqlc.RequirementStatus(status)}
	res, err := r.queries.UpdateBuyerRequirementStatus(ctx, arg)
	return res, handleError(err)
}

func (r *requirementRepository) DeleteRequirement(ctx context.Context, id string) error {
	uuid, err := parseUUID(id)
	if err != nil {
		return err
	}
	return handleError(r.queries.DeleteBuyerRequirement(ctx, uuid))
}
