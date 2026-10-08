package repository

import (
	"context"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type RequirementRepository interface {
	Create(ctx context.Context, arg sqlc.CreateBuyerRequirementParams) (sqlc.BuyerRequirement, error)
	GetByID(ctx context.Context, id pgtype.UUID) (sqlc.BuyerRequirement, error)
	List(ctx context.Context, arg sqlc.ListBuyerRequirementsParams) ([]sqlc.BuyerRequirement, error)
	ListByBuyerID(ctx context.Context, arg sqlc.ListBuyerRequirementsByBuyerIDParams) ([]sqlc.BuyerRequirement, error)
	ListByStatus(ctx context.Context, arg sqlc.ListBuyerRequirementsByStatusParams) ([]sqlc.BuyerRequirement, error)
	Update(ctx context.Context, arg sqlc.UpdateBuyerRequirementParams) (sqlc.BuyerRequirement, error)
	UpdateStatus(ctx context.Context, arg sqlc.UpdateBuyerRequirementStatusParams) (sqlc.BuyerRequirement, error)
	Delete(ctx context.Context, id pgtype.UUID) error
}

type requirementRepository struct {
	queries sqlc.Querier
}

func NewRequirementRepository(queries sqlc.Querier) RequirementRepository {
	return &requirementRepository{
		queries: queries,
	}
}

func (r *requirementRepository) Create(ctx context.Context, arg sqlc.CreateBuyerRequirementParams) (sqlc.BuyerRequirement, error) {
	res, err := r.queries.CreateBuyerRequirement(ctx, arg)
	return res, handleError(err)
}

func (r *requirementRepository) GetByID(ctx context.Context, id pgtype.UUID) (sqlc.BuyerRequirement, error) {
	res, err := r.queries.GetBuyerRequirementByID(ctx, id)
	return res, handleError(err)
}

func (r *requirementRepository) List(ctx context.Context, arg sqlc.ListBuyerRequirementsParams) ([]sqlc.BuyerRequirement, error) {
	res, err := r.queries.ListBuyerRequirements(ctx, arg)
	return res, handleError(err)
}

func (r *requirementRepository) ListByBuyerID(ctx context.Context, arg sqlc.ListBuyerRequirementsByBuyerIDParams) ([]sqlc.BuyerRequirement, error) {
	res, err := r.queries.ListBuyerRequirementsByBuyerID(ctx, arg)
	return res, handleError(err)
}

func (r *requirementRepository) ListByStatus(ctx context.Context, arg sqlc.ListBuyerRequirementsByStatusParams) ([]sqlc.BuyerRequirement, error) {
	res, err := r.queries.ListBuyerRequirementsByStatus(ctx, arg)
	return res, handleError(err)
}

func (r *requirementRepository) Update(ctx context.Context, arg sqlc.UpdateBuyerRequirementParams) (sqlc.BuyerRequirement, error) {
	res, err := r.queries.UpdateBuyerRequirement(ctx, arg)
	return res, handleError(err)
}

func (r *requirementRepository) UpdateStatus(ctx context.Context, arg sqlc.UpdateBuyerRequirementStatusParams) (sqlc.BuyerRequirement, error) {
	res, err := r.queries.UpdateBuyerRequirementStatus(ctx, arg)
	return res, handleError(err)
}

func (r *requirementRepository) Delete(ctx context.Context, id pgtype.UUID) error {
	return handleError(r.queries.DeleteBuyerRequirement(ctx, id))
}
