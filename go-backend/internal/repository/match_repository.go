package repository

import (
	"context"
	"fmt"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type MatchRepository interface {
	CreateMatchTx(ctx context.Context, store Store, listingID, reqID string, balerID *string, matchedQty float64, price *float64) (sqlc.Match, error)
	GetMatchByID(ctx context.Context, id string) (sqlc.Match, error)
	ListMatches(ctx context.Context, limit, offset int32) ([]sqlc.Match, error)
	ListMatchesByListingID(ctx context.Context, listingID string, limit, offset int32) ([]sqlc.Match, error)
	ListMatchesByRequirementID(ctx context.Context, reqID string, limit, offset int32) ([]sqlc.Match, error)
	ListMatchesByBalerID(ctx context.Context, balerID string, limit, offset int32) ([]sqlc.Match, error)
	UpdateMatch(ctx context.Context, id string, matchedQty, price, score *float64) (sqlc.Match, error)
	UpdateMatchStatus(ctx context.Context, id string, status string) (sqlc.Match, error)
	DeleteMatch(ctx context.Context, id string) error
}

type matchRepository struct {
	queries sqlc.Querier
}

func NewMatchRepository(queries sqlc.Querier) MatchRepository {
	return &matchRepository{
		queries: queries,
	}
}

func (r *matchRepository) CreateMatchTx(ctx context.Context, store Store, listingID, reqID string, balerID *string, matchedQty float64, price *float64) (sqlc.Match, error) {
	lUUID, err := parseUUID(listingID)
	if err != nil {
		return sqlc.Match{}, err
	}
	rUUID, err := parseUUID(reqID)
	if err != nil {
		return sqlc.Match{}, err
	}
	var bUUID pgtype.UUID
	if balerID != nil && *balerID != "" {
		bUUID, err = parseUUID(*balerID)
		if err != nil {
			return sqlc.Match{}, err
		}
	}

	var createdMatch sqlc.Match
	err = store.ExecTx(ctx, func(q sqlc.Querier) error {
		listing, err := q.GetStrawListingByID(ctx, lUUID)
		if err != nil {
			return fmt.Errorf("listing: %w", err)
		}
		if listing.Status != sqlc.ListingStatusAVAILABLE {
			return fmt.Errorf("listing is not available")
		}

		reqObj, err := q.GetBuyerRequirementByID(ctx, rUUID)
		if err != nil {
			return fmt.Errorf("requirement: %w", err)
		}
		if reqObj.Status == sqlc.RequirementStatusCANCELLED || reqObj.Status == sqlc.RequirementStatusFULFILLED {
			return fmt.Errorf("requirement is no longer open")
		}

		reqRemaining, _ := reqObj.RemainingQuantityKg.Float64Value()
		if matchedQty > reqRemaining.Float64 {
			return fmt.Errorf("matched quantity exceeds requirement remaining quantity")
		}

		newRemaining := reqRemaining.Float64 - matchedQty
		newReqStatus := sqlc.RequirementStatusPARTIALLYFULFILLED
		if newRemaining <= 0 {
			newReqStatus = sqlc.RequirementStatusFULFILLED
		}

		_, err = q.UpdateBuyerRequirement(ctx, sqlc.UpdateBuyerRequirementParams{
			ID:                  rUUID,
			RemainingQuantityKg: toPgNumeric(newRemaining),
			Status:              newReqStatus,
		})
		if err != nil {
			return fmt.Errorf("update requirement: %w", err)
		}

		_, err = q.UpdateStrawListingStatus(ctx, sqlc.UpdateStrawListingStatusParams{
			ID:     lUUID,
			Status: sqlc.ListingStatusMATCHED,
		})
		if err != nil {
			return fmt.Errorf("update listing status: %w", err)
		}

		arg := sqlc.CreateMatchParams{
			ListingID:         lUUID,
			RequirementID:     rUUID,
			MatchedQuantityKg: toPgNumeric(matchedQty),
			Status:            sqlc.MatchStatusPROPOSED,
		}
		if bUUID.Valid {
			arg.BalerID = bUUID
		}
		if price != nil {
			arg.AgreedPricePerKg = toPgNumeric(*price)
		}

		match, err := q.CreateMatch(ctx, arg)
		if err != nil {
			return fmt.Errorf("create match: %w", err)
		}
		createdMatch = match
		return nil
	})

	return createdMatch, handleError(err)
}

func (r *matchRepository) GetMatchByID(ctx context.Context, id string) (sqlc.Match, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.Match{}, err
	}
	res, err := r.queries.GetMatchByID(ctx, uuid)
	return res, handleError(err)
}

func (r *matchRepository) ListMatches(ctx context.Context, limit, offset int32) ([]sqlc.Match, error) {
	arg := sqlc.ListMatchesParams{Limit: limit, Offset: offset}
	res, err := r.queries.ListMatches(ctx, arg)
	return res, handleError(err)
}

func (r *matchRepository) ListMatchesByListingID(ctx context.Context, listingID string, limit, offset int32) ([]sqlc.Match, error) {
	uuid, err := parseUUID(listingID)
	if err != nil {
		return nil, err
	}
	arg := sqlc.ListMatchesByListingIDParams{ListingID: uuid, Limit: limit, Offset: offset}
	res, err := r.queries.ListMatchesByListingID(ctx, arg)
	return res, handleError(err)
}

func (r *matchRepository) ListMatchesByRequirementID(ctx context.Context, reqID string, limit, offset int32) ([]sqlc.Match, error) {
	uuid, err := parseUUID(reqID)
	if err != nil {
		return nil, err
	}
	arg := sqlc.ListMatchesByRequirementIDParams{RequirementID: uuid, Limit: limit, Offset: offset}
	res, err := r.queries.ListMatchesByRequirementID(ctx, arg)
	return res, handleError(err)
}

func (r *matchRepository) ListMatchesByBalerID(ctx context.Context, balerID string, limit, offset int32) ([]sqlc.Match, error) {
	uuid, err := parseUUID(balerID)
	if err != nil {
		return nil, err
	}
	arg := sqlc.ListMatchesByBalerIDParams{BalerID: uuid, Limit: limit, Offset: offset}
	res, err := r.queries.ListMatchesByBalerID(ctx, arg)
	return res, handleError(err)
}

func (r *matchRepository) UpdateMatch(ctx context.Context, id string, matchedQty, price, score *float64) (sqlc.Match, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.Match{}, err
	}
	arg := sqlc.UpdateMatchParams{ID: uuid}
	if matchedQty != nil {
		arg.MatchedQuantityKg = toPgNumeric(*matchedQty)
	}
	if price != nil {
		arg.AgreedPricePerKg = toPgNumeric(*price)
	}
	if score != nil {
		arg.MatchScore = toPgNumeric(*score)
	}
	res, err := r.queries.UpdateMatch(ctx, arg)
	return res, handleError(err)
}

func (r *matchRepository) UpdateMatchStatus(ctx context.Context, id string, status string) (sqlc.Match, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return sqlc.Match{}, err
	}
	arg := sqlc.UpdateMatchStatusParams{ID: uuid, Status: sqlc.MatchStatus(status)}
	res, err := r.queries.UpdateMatchStatus(ctx, arg)
	return res, handleError(err)
}

func (r *matchRepository) DeleteMatch(ctx context.Context, id string) error {
	uuid, err := parseUUID(id)
	if err != nil {
		return err
	}
	return handleError(r.queries.DeleteMatch(ctx, uuid))
}
