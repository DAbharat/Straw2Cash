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
	"github.com/jackc/pgx/v5/pgtype"
)

type FarmerService interface {
	CreateProfile(ctx context.Context, userID string, req dto.CreateFarmerProfileRequest) (dto.FarmerProfileResponse, error)
	GetProfile(ctx context.Context, id string) (dto.FarmerProfileResponse, error)
	GetProfileByUserID(ctx context.Context, userID string) (dto.FarmerProfileResponse, error)
	UpdateProfile(ctx context.Context, userID string, req dto.UpdateFarmerProfileRequest) (dto.FarmerProfileResponse, error)
}

type farmerService struct {
	farmerRepo repository.FarmerRepository
	userRepo   repository.UserRepository
	authorizer *authz.Authorizer
}

func NewFarmerService(farmerRepo repository.FarmerRepository, userRepo repository.UserRepository, authorizer *authz.Authorizer) FarmerService {
	return &farmerService{
		farmerRepo: farmerRepo,
		userRepo:   userRepo,
		authorizer: authorizer,
	}
}

func (s *farmerService) CreateProfile(ctx context.Context, userID string, req dto.CreateFarmerProfileRequest) (dto.FarmerProfileResponse, error) {
	// Verify user exists and is a farmer
	user, err := s.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.FarmerProfileResponse{}, fmt.Errorf("%w: user not found", ErrNotFound)
		}
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	if user.Role != sqlc.UserRoleFARMER {
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: user is not a farmer", ErrForbidden)
	}

	profile, err := s.farmerRepo.CreateProfile(ctx, userID, req.Village, req.District, req.State, req.Latitude, req.Longitude, req.LandAreaAcres)
	if err != nil {
		if errors.Is(err, repository.ErrDuplicateProfile) {
			return dto.FarmerProfileResponse{}, fmt.Errorf("%w: farmer profile already exists", ErrConflict)
		}
		if errors.Is(err, repository.ErrCheckViolation) {
			return dto.FarmerProfileResponse{}, fmt.Errorf("%w: invalid values (constraints failed)", ErrValidation)
		}
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapFarmerResponse(profile), nil
}

func (s *farmerService) GetProfile(ctx context.Context, id string) (dto.FarmerProfileResponse, error) {
	principalID, ok := middleware.GetUserFromContext(ctx)
	if !ok {
		return dto.FarmerProfileResponse{}, ErrUnauthorized
	}

	principalUser, err := s.userRepo.GetUserByID(ctx, principalID)
	if err != nil {
		return dto.FarmerProfileResponse{}, ErrUnauthorized
	}

	profile, err := s.farmerRepo.GetProfileByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.FarmerProfileResponse{}, ErrNotFound
		}
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	pUID, pEnt := authz.BuildUserEntity(principalID, string(principalUser.Role))
	rUID, rEnt := authz.BuildProfileEntity(id, pgUUIDToStr(profile.UserID.Bytes))
	entities := authz.MergeEntities(pEnt, rEnt)

	allowed, err := s.authorizer.IsAuthorized(pUID, authz.ActionReadProfile(), rUID, entities)
	if err != nil {
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}
	if !allowed {
		return dto.FarmerProfileResponse{}, ErrForbidden
	}

	return mapFarmerResponse(profile), nil
}

func (s *farmerService) GetProfileByUserID(ctx context.Context, userID string) (dto.FarmerProfileResponse, error) {
	profile, err := s.farmerRepo.GetProfileByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.FarmerProfileResponse{}, ErrNotFound
		}
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapFarmerResponse(profile), nil
}

func (s *farmerService) UpdateProfile(ctx context.Context, userID string, req dto.UpdateFarmerProfileRequest) (dto.FarmerProfileResponse, error) {
	principalID, ok := middleware.GetUserFromContext(ctx)
	if !ok {
		return dto.FarmerProfileResponse{}, ErrUnauthorized
	}

	principalUser, err := s.userRepo.GetUserByID(ctx, principalID)
	if err != nil {
		return dto.FarmerProfileResponse{}, ErrUnauthorized
	}

	// Fetch existing to ensure they own it and exists
	existing, err := s.farmerRepo.GetProfileByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.FarmerProfileResponse{}, ErrNotFound
		}
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	pUID, pEnt := authz.BuildUserEntity(principalID, string(principalUser.Role))
	rUID, rEnt := authz.BuildProfileEntity(pgUUIDToStr(existing.ID.Bytes), pgUUIDToStr(existing.UserID.Bytes))
	entities := authz.MergeEntities(pEnt, rEnt)

	allowed, err := s.authorizer.IsAuthorized(pUID, authz.ActionUpdateProfile(), rUID, entities)
	if err != nil {
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}
	if !allowed {
		return dto.FarmerProfileResponse{}, ErrForbidden
	}

	village := existing.Village
	district := existing.District
	state := existing.State
	lat := fromPgNumeric(existing.Latitude)
	lon := fromPgNumeric(existing.Longitude)
	land := fromPgNumeric(existing.LandAreaAcres)

	if req.Village != nil {
		village = *req.Village
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
	if req.LandAreaAcres != nil {
		land = *req.LandAreaAcres
	}

	profile, err := s.farmerRepo.UpdateProfile(ctx, pgUUIDToStr(existing.ID.Bytes), village, district, state, lat, lon, land)
	if err != nil {
		if errors.Is(err, repository.ErrCheckViolation) {
			return dto.FarmerProfileResponse{}, fmt.Errorf("%w: invalid values (constraints failed)", ErrValidation)
		}
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapFarmerResponse(profile), nil
}

func mapFarmerResponse(profile sqlc.FarmerProfile) dto.FarmerProfileResponse {
	return dto.FarmerProfileResponse{
		ID:            pgUUIDToStr(profile.ID.Bytes),
		UserID:        pgUUIDToStr(profile.UserID.Bytes),
		Village:       profile.Village,
		District:      profile.District,
		State:         profile.State,
		Latitude:      fromPgNumeric(profile.Latitude),
		Longitude:     fromPgNumeric(profile.Longitude),
		LandAreaAcres: fromPgNumeric(profile.LandAreaAcres),
		CreatedAt:     profile.CreatedAt.Time,
		UpdatedAt:     profile.UpdatedAt.Time,
	}
}

func fromPgNumeric(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	f, _ := n.Float64Value()
	return f.Float64
}
