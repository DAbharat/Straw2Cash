package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/DAbharat/Straw2Cash/internal/authz"
	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/middleware"
	"github.com/DAbharat/Straw2Cash/internal/repository"
)

type MatchingService interface {
	CreateMatch(ctx context.Context, req dto.CreateMatchRequest) (dto.MatchResponse, error)
	GetMatch(ctx context.Context, id string) (dto.MatchResponse, error)
	UpdateMatchStatus(ctx context.Context, id string, req dto.UpdateMatchStatusRequest) (dto.MatchResponse, error)
}

type matchingService struct {
	store       repository.Store
	matchRepo   repository.MatchRepository
	listingRepo repository.ListingRepository
	reqRepo     repository.RequirementRepository
	farmerRepo  repository.FarmerRepository
	buyerRepo   repository.BuyerRepository
	userRepo    repository.UserRepository
	authorizer  *authz.Authorizer
}

func NewMatchingService(store repository.Store, matchRepo repository.MatchRepository, listingRepo repository.ListingRepository, reqRepo repository.RequirementRepository, farmerRepo repository.FarmerRepository, buyerRepo repository.BuyerRepository, userRepo repository.UserRepository, authorizer *authz.Authorizer) MatchingService {
	return &matchingService{
		store:       store,
		matchRepo:   matchRepo,
		listingRepo: listingRepo,
		reqRepo:     reqRepo,
		farmerRepo:  farmerRepo,
		buyerRepo:   buyerRepo,
		userRepo:    userRepo,
		authorizer:  authorizer,
	}
}

func (s *matchingService) CreateMatch(ctx context.Context, req dto.CreateMatchRequest) (dto.MatchResponse, error) {
	principalID, ok := middleware.GetUserFromContext(ctx)
	if !ok {
		return dto.MatchResponse{}, ErrUnauthorized
	}

	principalUser, err := s.userRepo.GetUserByID(ctx, principalID)
	if err != nil {
		return dto.MatchResponse{}, ErrUnauthorized
	}

	pUID, pEnt := authz.BuildUserEntity(principalID, string(principalUser.Role))
	rUID, rEnt := authz.BuildMatchEntity("dummy", "dummyListingUser", "dummyReqUser") // Dummy for creation
	entities := authz.MergeEntities(pEnt, rEnt)

	allowed, err := s.authorizer.IsAuthorized(pUID, authz.ActionCreateMatch(), rUID, entities)
	if err != nil || !allowed {
		return dto.MatchResponse{}, ErrForbidden
	}

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
	principalID, ok := middleware.GetUserFromContext(ctx)
	if !ok {
		return dto.MatchResponse{}, ErrUnauthorized
	}

	principalUser, err := s.userRepo.GetUserByID(ctx, principalID)
	if err != nil {
		return dto.MatchResponse{}, ErrUnauthorized
	}

	existing, err := s.matchRepo.GetMatchByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.MatchResponse{}, ErrNotFound
		}
		return dto.MatchResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	// Fetch listing and farmer profile to get listing owner user id
	listing, err := s.listingRepo.GetListingByID(ctx, pgUUIDToStr(existing.ListingID.Bytes))
	if err != nil {
		return dto.MatchResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}
	farmerProf, err := s.farmerRepo.GetProfileByID(ctx, pgUUIDToStr(listing.FarmerID.Bytes))
	if err != nil {
		return dto.MatchResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	// Fetch requirement and buyer profile to get requirement owner user id
	reqmnt, err := s.reqRepo.GetRequirementByID(ctx, pgUUIDToStr(existing.RequirementID.Bytes))
	if err != nil {
		return dto.MatchResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}
	buyerProf, err := s.buyerRepo.GetProfileByID(ctx, pgUUIDToStr(reqmnt.BuyerID.Bytes))
	if err != nil {
		return dto.MatchResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	pUID, pEnt := authz.BuildUserEntity(principalID, string(principalUser.Role))
	rUID, rEnt := authz.BuildMatchEntity(id, pgUUIDToStr(farmerProf.UserID.Bytes), pgUUIDToStr(buyerProf.UserID.Bytes))
	entities := authz.MergeEntities(pEnt, rEnt)

	allowed, err := s.authorizer.IsAuthorized(pUID, authz.ActionManageMatch(), rUID, entities)
	if err != nil || !allowed {
		return dto.MatchResponse{}, ErrForbidden
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
