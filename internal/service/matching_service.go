package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/repository"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type MatchingService interface {
	CreateMatch(ctx context.Context, req dto.CreateMatchRequest) (dto.MatchResponse, error)
	GetMatch(ctx context.Context, id string) (dto.MatchResponse, error)
	UpdateMatchStatus(ctx context.Context, id string, req dto.UpdateMatchStatusRequest) (dto.MatchResponse, error)
}

type matchingService struct {
	store repository.Store
}

func NewMatchingService(store repository.Store) MatchingService {
	return &matchingService{
		store: store,
	}
}

func (s *matchingService) CreateMatch(ctx context.Context, req dto.CreateMatchRequest) (dto.MatchResponse, error) {
	lUUID, err := parseUUID(req.ListingID)
	if err != nil {
		return dto.MatchResponse{}, fmt.Errorf("%w: invalid listing ID", ErrValidation)
	}

	rUUID, err := parseUUID(req.RequirementID)
	if err != nil {
		return dto.MatchResponse{}, fmt.Errorf("%w: invalid requirement ID", ErrValidation)
	}

	var bUUID pgtype.UUID
	if req.BalerID != nil && *req.BalerID != "" {
		parsed, err := parseUUID(*req.BalerID)
		if err != nil {
			return dto.MatchResponse{}, fmt.Errorf("%w: invalid baler ID", ErrValidation)
		}
		bUUID = parsed
	}

	var createdMatch sqlc.Match

	err = s.store.ExecTx(ctx, func(q sqlc.Querier) error {
		listing, err := q.GetStrawListingByID(ctx, lUUID)
		if err != nil {
			return fmt.Errorf("listing: %w", err)
		}

		if listing.Status != sqlc.ListingStatusAVAILABLE {
			return fmt.Errorf("%w: listing is not available", ErrInvalidState)
		}

		reqObj, err := q.GetBuyerRequirementByID(ctx, rUUID)
		if err != nil {
			return fmt.Errorf("requirement: %w", err)
		}

		if reqObj.Status == sqlc.RequirementStatusCANCELLED || reqObj.Status == sqlc.RequirementStatusFULFILLED {
			return fmt.Errorf("%w: requirement is no longer open", ErrInvalidState)
		}

		reqRemaining := fromPgNumeric(reqObj.RemainingQuantityKg)
		if req.MatchedQuantityKg > reqRemaining {
			return fmt.Errorf("%w: matched quantity exceeds requirement remaining quantity", ErrValidation)
		}

		// Calculate new remaining requirement quantity
		newRemaining := reqRemaining - req.MatchedQuantityKg
		newReqStatus := sqlc.RequirementStatusPARTIALLYFULFILLED
		if newRemaining <= 0 {
			newReqStatus = sqlc.RequirementStatusFULFILLED
		}

		// Update Requirement
		_, err = q.UpdateBuyerRequirement(ctx, sqlc.UpdateBuyerRequirementParams{
			ID:                  rUUID,
			RemainingQuantityKg: toPgNumeric(newRemaining),
			Status:              newReqStatus,
		})
		if err != nil {
			return fmt.Errorf("update requirement: %w", err)
		}

		// Update Listing to matched if fully booked (assuming full match for simplicity or just updating status)
		// Usually we'd check SUM(matched_quantity) from matches. For now, mark as MATCHED.
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
			MatchedQuantityKg: toPgNumeric(req.MatchedQuantityKg),
			Status:            sqlc.MatchStatusPROPOSED,
		}

		if bUUID.Valid {
			arg.BalerID = bUUID
		}
		if req.AgreedPricePerKg != nil {
			arg.AgreedPricePerKg = toPgNumeric(*req.AgreedPricePerKg)
		}

		match, err := q.CreateMatch(ctx, arg)
		if err != nil {
			return fmt.Errorf("create match: %w", err)
		}

		createdMatch = match
		return nil
	})

	if err != nil {
		if errors.Is(err, repository.ErrNotFound) || errors.Is(err, pgx.ErrNoRows) {
			return dto.MatchResponse{}, ErrNotFound
		}
		if errors.Is(err, ErrInvalidState) || errors.Is(err, ErrValidation) {
			return dto.MatchResponse{}, err
		}
		return dto.MatchResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapMatchResponse(createdMatch), nil
}

func (s *matchingService) GetMatch(ctx context.Context, id string) (dto.MatchResponse, error) {
	mUUID, err := parseUUID(id)
	if err != nil {
		return dto.MatchResponse{}, fmt.Errorf("%w: invalid match ID", ErrValidation)
	}

	match, err := s.store.GetMatchByID(ctx, mUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) || errors.Is(err, pgx.ErrNoRows) {
			return dto.MatchResponse{}, ErrNotFound
		}
		return dto.MatchResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapMatchResponse(match), nil
}

func (s *matchingService) UpdateMatchStatus(ctx context.Context, id string, req dto.UpdateMatchStatusRequest) (dto.MatchResponse, error) {
	mUUID, err := parseUUID(id)
	if err != nil {
		return dto.MatchResponse{}, fmt.Errorf("%w: invalid match ID", ErrValidation)
	}

	existing, err := s.store.GetMatchByID(ctx, mUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) || errors.Is(err, pgx.ErrNoRows) {
			return dto.MatchResponse{}, ErrNotFound
		}
		return dto.MatchResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	if existing.Status == sqlc.MatchStatusCOMPLETED || existing.Status == sqlc.MatchStatusEXPIRED {
		return dto.MatchResponse{}, fmt.Errorf("%w: cannot change status of completed/expired match", ErrInvalidState)
	}

	arg := sqlc.UpdateMatchStatusParams{
		ID:     mUUID,
		Status: sqlc.MatchStatus(req.Status),
	}

	match, err := s.store.UpdateMatchStatus(ctx, arg)
	if err != nil {
		return dto.MatchResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapMatchResponse(match), nil
}

func mapMatchResponse(match sqlc.Match) dto.MatchResponse {
	res := dto.MatchResponse{
		ID:                pgUUIDToStr(match.ID),
		ListingID:         pgUUIDToStr(match.ListingID),
		RequirementID:     pgUUIDToStr(match.RequirementID),
		MatchedQuantityKg: fromPgNumeric(match.MatchedQuantityKg),
		Status:            string(match.Status),
		CreatedAt:         match.CreatedAt.Time,
		UpdatedAt:         match.UpdatedAt.Time,
	}

	if match.BalerID.Valid {
		v := pgUUIDToStr(match.BalerID)
		res.BalerID = &v
	}
	if match.AgreedPricePerKg.Valid {
		v := fromPgNumeric(match.AgreedPricePerKg)
		res.AgreedPricePerKg = &v
	}
	if match.MatchScore.Valid {
		v := fromPgNumeric(match.MatchScore)
		res.MatchScore = &v
	}

	return res
}
