package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/repository"
)

type MatchingService interface {
	CreateMatch(ctx context.Context, req dto.CreateMatchRequest) (dto.MatchResponse, error)
	GetMatch(ctx context.Context, id string) (dto.MatchResponse, error)
	UpdateMatchStatus(ctx context.Context, id string, req dto.UpdateMatchStatusRequest) (dto.MatchResponse, error)
}

type matchingService struct {
	store     repository.Store
	matchRepo repository.MatchRepository
}

func NewMatchingService(store repository.Store, matchRepo repository.MatchRepository) MatchingService {
	return &matchingService{
		store:     store,
		matchRepo: matchRepo,
	}
}

func (s *matchingService) CreateMatch(ctx context.Context, req dto.CreateMatchRequest) (dto.MatchResponse, error) {
	createdMatch, err := s.matchRepo.CreateMatchTx(ctx, s.store, req.ListingID, req.RequirementID, req.BalerID, req.MatchedQuantityKg, req.AgreedPricePerKg)
	if err != nil {
		return dto.MatchResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapMatchResponse(createdMatch), nil
}

func (s *matchingService) GetMatch(ctx context.Context, id string) (dto.MatchResponse, error) {
	match, err := s.matchRepo.GetMatchByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.MatchResponse{}, ErrNotFound
		}
		return dto.MatchResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapMatchResponse(match), nil
}

func (s *matchingService) UpdateMatchStatus(ctx context.Context, id string, req dto.UpdateMatchStatusRequest) (dto.MatchResponse, error) {
	existing, err := s.matchRepo.GetMatchByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.MatchResponse{}, ErrNotFound
		}
		return dto.MatchResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	if existing.Status == sqlc.MatchStatusCOMPLETED || existing.Status == sqlc.MatchStatusEXPIRED {
		return dto.MatchResponse{}, fmt.Errorf("%w: cannot change status of completed/expired match", ErrInvalidState)
	}

	match, err := s.matchRepo.UpdateMatchStatus(ctx, id, req.Status)
	if err != nil {
		return dto.MatchResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapMatchResponse(match), nil
}

func mapMatchResponse(match sqlc.Match) dto.MatchResponse {
	res := dto.MatchResponse{
		ID:                pgUUIDToStr(match.ID.Bytes),
		ListingID:         pgUUIDToStr(match.ListingID.Bytes),
		RequirementID:     pgUUIDToStr(match.RequirementID.Bytes),
		MatchedQuantityKg: fromPgNumeric(match.MatchedQuantityKg),
		Status:            string(match.Status),
		CreatedAt:         match.CreatedAt.Time,
		UpdatedAt:         match.UpdatedAt.Time,
	}

	if match.BalerID.Valid {
		v := pgUUIDToStr(match.BalerID.Bytes)
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
