package repository

import (
	"context"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type MatchRepository interface {
	Create(ctx context.Context, arg sqlc.CreateMatchParams) (sqlc.Match, error)
	GetByID(ctx context.Context, id pgtype.UUID) (sqlc.Match, error)
	List(ctx context.Context, arg sqlc.ListMatchesParams) ([]sqlc.Match, error)
	ListByListingID(ctx context.Context, arg sqlc.ListMatchesByListingIDParams) ([]sqlc.Match, error)
	ListByRequirementID(ctx context.Context, arg sqlc.ListMatchesByRequirementIDParams) ([]sqlc.Match, error)
	ListByBalerID(ctx context.Context, arg sqlc.ListMatchesByBalerIDParams) ([]sqlc.Match, error)
	Update(ctx context.Context, arg sqlc.UpdateMatchParams) (sqlc.Match, error)
	UpdateStatus(ctx context.Context, arg sqlc.UpdateMatchStatusParams) (sqlc.Match, error)
	Delete(ctx context.Context, id pgtype.UUID) error
}

type matchRepository struct {
	queries sqlc.Querier
}

func NewMatchRepository(queries sqlc.Querier) MatchRepository {
	return &matchRepository{
		queries: queries,
	}
}

func (r *matchRepository) Create(ctx context.Context, arg sqlc.CreateMatchParams) (sqlc.Match, error) {
	res, err := r.queries.CreateMatch(ctx, arg)
	return res, handleError(err)
}

func (r *matchRepository) GetByID(ctx context.Context, id pgtype.UUID) (sqlc.Match, error) {
	res, err := r.queries.GetMatchByID(ctx, id)
	return res, handleError(err)
}

func (r *matchRepository) List(ctx context.Context, arg sqlc.ListMatchesParams) ([]sqlc.Match, error) {
	res, err := r.queries.ListMatches(ctx, arg)
	return res, handleError(err)
}

func (r *matchRepository) ListByListingID(ctx context.Context, arg sqlc.ListMatchesByListingIDParams) ([]sqlc.Match, error) {
	res, err := r.queries.ListMatchesByListingID(ctx, arg)
	return res, handleError(err)
}

func (r *matchRepository) ListByRequirementID(ctx context.Context, arg sqlc.ListMatchesByRequirementIDParams) ([]sqlc.Match, error) {
	res, err := r.queries.ListMatchesByRequirementID(ctx, arg)
	return res, handleError(err)
}

func (r *matchRepository) ListByBalerID(ctx context.Context, arg sqlc.ListMatchesByBalerIDParams) ([]sqlc.Match, error) {
	res, err := r.queries.ListMatchesByBalerID(ctx, arg)
	return res, handleError(err)
}

func (r *matchRepository) Update(ctx context.Context, arg sqlc.UpdateMatchParams) (sqlc.Match, error) {
	res, err := r.queries.UpdateMatch(ctx, arg)
	return res, handleError(err)
}

func (r *matchRepository) UpdateStatus(ctx context.Context, arg sqlc.UpdateMatchStatusParams) (sqlc.Match, error) {
	res, err := r.queries.UpdateMatchStatus(ctx, arg)
	return res, handleError(err)
}

func (r *matchRepository) Delete(ctx context.Context, id pgtype.UUID) error {
	return handleError(r.queries.DeleteMatch(ctx, id))
}
