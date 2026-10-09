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

type BalerService interface {
	CreateProfile(ctx context.Context, userID string, req dto.CreateBalerProfileRequest) (dto.BalerProfileResponse, error)
	GetProfile(ctx context.Context, id string) (dto.BalerProfileResponse, error)
	GetProfileByUserID(ctx context.Context, userID string) (dto.BalerProfileResponse, error)
	UpdateProfile(ctx context.Context, userID string, req dto.UpdateBalerProfileRequest) (dto.BalerProfileResponse, error)
}

type balerService struct {
	balerRepo  repository.BalerRepository
	userRepo   repository.UserRepository
	authorizer *authz.Authorizer
}

func NewBalerService(balerRepo repository.BalerRepository, userRepo repository.UserRepository, authorizer *authz.Authorizer) BalerService {
	return &balerService{
		balerRepo:  balerRepo,
		userRepo:   userRepo,
		authorizer: authorizer,
	}
}

func (s *balerService) CreateProfile(ctx context.Context, userID string, req dto.CreateBalerProfileRequest) (dto.BalerProfileResponse, error) {
	user, err := s.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BalerProfileResponse{}, fmt.Errorf("%w: user not found", ErrNotFound)
		}
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	if user.Role != sqlc.UserRoleBALER {
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: user is not a baler", ErrForbidden)
	}

	profile, err := s.balerRepo.CreateProfile(ctx, userID, req.OrganizationName, req.Phone, req.VehicleDetails, req.ServiceArea, req.District, req.State)
	if err != nil {
		if errors.Is(err, repository.ErrDuplicateProfile) {
			return dto.BalerProfileResponse{}, fmt.Errorf("%w: baler profile already exists", ErrConflict)
		}
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapBalerResponse(profile), nil
}

func (s *balerService) GetProfile(ctx context.Context, id string) (dto.BalerProfileResponse, error) {
	principalID, ok := middleware.GetUserFromContext(ctx)
	if !ok {
		return dto.BalerProfileResponse{}, ErrUnauthorized
	}

	principalUser, err := s.userRepo.GetUserByID(ctx, principalID)
	if err != nil {
		return dto.BalerProfileResponse{}, ErrUnauthorized
	}

	profile, err := s.balerRepo.GetProfileByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BalerProfileResponse{}, ErrNotFound
		}
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	pUID, pEnt := authz.BuildUserEntity(principalID, string(principalUser.Role))
	rUID, rEnt := authz.BuildProfileEntity(id, pgUUIDToStr(profile.UserID.Bytes))
	entities := authz.MergeEntities(pEnt, rEnt)

	allowed, err := s.authorizer.IsAuthorized(pUID, authz.ActionReadProfile(), rUID, entities)
	if err != nil {
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}
	if !allowed {
		return dto.BalerProfileResponse{}, ErrForbidden
	}

	return mapBalerResponse(profile), nil
}

func (s *balerService) GetProfileByUserID(ctx context.Context, userID string) (dto.BalerProfileResponse, error) {
	profile, err := s.balerRepo.GetProfileByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BalerProfileResponse{}, ErrNotFound
		}
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapBalerResponse(profile), nil
}

func (s *balerService) UpdateProfile(ctx context.Context, userID string, req dto.UpdateBalerProfileRequest) (dto.BalerProfileResponse, error) {
	principalID, ok := middleware.GetUserFromContext(ctx)
	if !ok {
		return dto.BalerProfileResponse{}, ErrUnauthorized
	}

	principalUser, err := s.userRepo.GetUserByID(ctx, principalID)
	if err != nil {
		return dto.BalerProfileResponse{}, ErrUnauthorized
	}

	existing, err := s.balerRepo.GetProfileByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BalerProfileResponse{}, ErrNotFound
		}
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	pUID, pEnt := authz.BuildUserEntity(principalID, string(principalUser.Role))
	rUID, rEnt := authz.BuildProfileEntity(pgUUIDToStr(existing.ID.Bytes), pgUUIDToStr(existing.UserID.Bytes))
	entities := authz.MergeEntities(pEnt, rEnt)

	allowed, err := s.authorizer.IsAuthorized(pUID, authz.ActionUpdateProfile(), rUID, entities)
	if err != nil {
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}
	if !allowed {
		return dto.BalerProfileResponse{}, ErrForbidden
	}

	area := existing.ServiceArea
	district := existing.District
	state := existing.State

	if req.ServiceArea != nil {
		area = *req.ServiceArea
	}
	if req.District != nil {
		district = *req.District
	}
	if req.State != nil {
		state = *req.State
	}

	profile, err := s.balerRepo.UpdateProfile(ctx, pgUUIDToStr(existing.ID.Bytes), req.OrganizationName, req.Phone, req.VehicleDetails, area, district, state)
	if err != nil {
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapBalerResponse(profile), nil
}

func mapBalerResponse(profile sqlc.BalerProfile) dto.BalerProfileResponse {
	return dto.BalerProfileResponse{
		ID:               pgUUIDToStr(profile.ID.Bytes),
		UserID:           pgUUIDToStr(profile.UserID.Bytes),
		OrganizationName: profile.OrganizationName.String,
		Phone:            profile.Phone.String,
		VehicleDetails:   profile.VehicleDetails.String,
		ServiceArea:      profile.ServiceArea,
		District:         profile.District,
		State:            profile.State,
		CreatedAt:        profile.CreatedAt.Time,
		UpdatedAt:        profile.UpdatedAt.Time,
	}
}
