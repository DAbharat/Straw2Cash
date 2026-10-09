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

type BuyerService interface {
	CreateProfile(ctx context.Context, userID string, req dto.CreateBuyerProfileRequest) (dto.BuyerProfileResponse, error)
	GetProfile(ctx context.Context, id string) (dto.BuyerProfileResponse, error)
	GetProfileByUserID(ctx context.Context, userID string) (dto.BuyerProfileResponse, error)
	UpdateProfile(ctx context.Context, userID string, req dto.UpdateBuyerProfileRequest) (dto.BuyerProfileResponse, error)
}

type buyerService struct {
	buyerRepo  repository.BuyerRepository
	userRepo   repository.UserRepository
	authorizer *authz.Authorizer
}

func NewBuyerService(buyerRepo repository.BuyerRepository, userRepo repository.UserRepository, authorizer *authz.Authorizer) BuyerService {
	return &buyerService{
		buyerRepo:  buyerRepo,
		userRepo:   userRepo,
		authorizer: authorizer,
	}
}

func (s *buyerService) CreateProfile(ctx context.Context, userID string, req dto.CreateBuyerProfileRequest) (dto.BuyerProfileResponse, error) {
	user, err := s.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BuyerProfileResponse{}, fmt.Errorf("%w: user not found", ErrNotFound)
		}
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	if user.Role != sqlc.UserRoleBUYER {
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: user is not a buyer", ErrForbidden)
	}

	profile, err := s.buyerRepo.CreateProfile(ctx, userID, req.OrganizationName, req.BuyerType, req.Address, req.District, req.State, req.Latitude, req.Longitude)
	if err != nil {
		if errors.Is(err, repository.ErrDuplicateProfile) {
			return dto.BuyerProfileResponse{}, fmt.Errorf("%w: buyer profile already exists", ErrConflict)
		}
		if errors.Is(err, repository.ErrCheckViolation) {
			return dto.BuyerProfileResponse{}, fmt.Errorf("%w: invalid values (constraints failed)", ErrValidation)
		}
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapBuyerResponse(profile), nil
}

func (s *buyerService) GetProfile(ctx context.Context, id string) (dto.BuyerProfileResponse, error) {
	principalID, ok := middleware.GetUserFromContext(ctx)
	if !ok {
		return dto.BuyerProfileResponse{}, ErrUnauthorized
	}

	principalUser, err := s.userRepo.GetUserByID(ctx, principalID)
	if err != nil {
		return dto.BuyerProfileResponse{}, ErrUnauthorized
	}

	profile, err := s.buyerRepo.GetProfileByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BuyerProfileResponse{}, ErrNotFound
		}
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	pUID, pEnt := authz.BuildUserEntity(principalID, string(principalUser.Role))
	rUID, rEnt := authz.BuildProfileEntity(id, pgUUIDToStr(profile.UserID.Bytes))
	entities := authz.MergeEntities(pEnt, rEnt)

	allowed, err := s.authorizer.IsAuthorized(pUID, authz.ActionReadProfile(), rUID, entities)
	if err != nil {
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}
	if !allowed {
		return dto.BuyerProfileResponse{}, ErrForbidden
	}

	return mapBuyerResponse(profile), nil
}

func (s *buyerService) GetProfileByUserID(ctx context.Context, userID string) (dto.BuyerProfileResponse, error) {
	profile, err := s.buyerRepo.GetProfileByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BuyerProfileResponse{}, ErrNotFound
		}
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapBuyerResponse(profile), nil
}

func (s *buyerService) UpdateProfile(ctx context.Context, userID string, req dto.UpdateBuyerProfileRequest) (dto.BuyerProfileResponse, error) {
	principalID, ok := middleware.GetUserFromContext(ctx)
	if !ok {
		return dto.BuyerProfileResponse{}, ErrUnauthorized
	}

	principalUser, err := s.userRepo.GetUserByID(ctx, principalID)
	if err != nil {
		return dto.BuyerProfileResponse{}, ErrUnauthorized
	}

	existing, err := s.buyerRepo.GetProfileByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BuyerProfileResponse{}, ErrNotFound
		}
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	pUID, pEnt := authz.BuildUserEntity(principalID, string(principalUser.Role))
	rUID, rEnt := authz.BuildProfileEntity(pgUUIDToStr(existing.ID.Bytes), pgUUIDToStr(existing.UserID.Bytes))
	entities := authz.MergeEntities(pEnt, rEnt)

	allowed, err := s.authorizer.IsAuthorized(pUID, authz.ActionUpdateProfile(), rUID, entities)
	if err != nil {
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}
	if !allowed {
		return dto.BuyerProfileResponse{}, ErrForbidden
	}

	orgName := existing.OrganizationName
	buyerType := string(existing.BuyerType)
	address := existing.Address
	district := existing.District
	state := existing.State
	lat := fromPgNumeric(existing.Latitude)
	lon := fromPgNumeric(existing.Longitude)

	if req.OrganizationName != nil {
		orgName = *req.OrganizationName
	}
	if req.BuyerType != nil {
		buyerType = *req.BuyerType
	}
	if req.Address != nil {
		address = *req.Address
	}
	if req.District != nil {
		district = *req.District
	}
	if req.State != nil {
		state = *req.State
	}
	if req.Latitude != nil {
		lat = *req.Latitude
	}
	if req.Longitude != nil {
		lon = *req.Longitude
	}

	profile, err := s.buyerRepo.UpdateProfile(ctx, pgUUIDToStr(existing.ID.Bytes), orgName, buyerType, address, district, state, lat, lon)
	if err != nil {
		if errors.Is(err, repository.ErrCheckViolation) {
			return dto.BuyerProfileResponse{}, fmt.Errorf("%w: invalid values", ErrValidation)
		}
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapBuyerResponse(profile), nil
}

func mapBuyerResponse(profile sqlc.BuyerProfile) dto.BuyerProfileResponse {
	return dto.BuyerProfileResponse{
		ID:               pgUUIDToStr(profile.ID.Bytes),
		UserID:           pgUUIDToStr(profile.UserID.Bytes),
		OrganizationName: profile.OrganizationName,
		BuyerType:        string(profile.BuyerType),
		Address:          profile.Address,
		District:         profile.District,
		State:            profile.State,
		Latitude:         fromPgNumeric(profile.Latitude),
		Longitude:        fromPgNumeric(profile.Longitude),
		CreatedAt:        profile.CreatedAt.Time,
		UpdatedAt:        profile.UpdatedAt.Time,
	}
}
