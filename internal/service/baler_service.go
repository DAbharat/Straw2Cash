package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/repository"
)

type BalerService interface {
	CreateProfile(ctx context.Context, userID string, req dto.CreateBalerProfileRequest) (dto.BalerProfileResponse, error)
	GetProfile(ctx context.Context, id string) (dto.BalerProfileResponse, error)
	GetProfileByUserID(ctx context.Context, userID string) (dto.BalerProfileResponse, error)
	UpdateProfile(ctx context.Context, userID string, req dto.UpdateBalerProfileRequest) (dto.BalerProfileResponse, error)
}

type balerService struct {
	balerRepo repository.BalerRepository
	userRepo  repository.UserRepository
}

func NewBalerService(balerRepo repository.BalerRepository, userRepo repository.UserRepository) BalerService {
	return &balerService{
		balerRepo: balerRepo,
		userRepo:  userRepo,
	}
}

func (s *balerService) CreateProfile(ctx context.Context, userID string, req dto.CreateBalerProfileRequest) (dto.BalerProfileResponse, error) {
	uUUID, err := parseUUID(userID)
	if err != nil {
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: invalid user ID", ErrValidation)
	}

	user, err := s.userRepo.GetByID(ctx, uUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BalerProfileResponse{}, fmt.Errorf("%w: user not found", ErrNotFound)
		}
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	if user.Role != sqlc.UserRoleBALER {
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: user is not a baler", ErrForbidden)
	}

	arg := sqlc.CreateBalerProfileParams{
		UserID:           uUUID,
		OrganizationName: toPgText(req.OrganizationName),
		Phone:            toPgText(req.Phone),
		VehicleDetails:   toPgText(req.VehicleDetails),
		ServiceArea:      req.ServiceArea,
		District:         req.District,
		State:            req.State,
	}

	profile, err := s.balerRepo.Create(ctx, arg)
	if err != nil {
		if errors.Is(err, repository.ErrDuplicateProfile) {
			return dto.BalerProfileResponse{}, fmt.Errorf("%w: baler profile already exists", ErrConflict)
		}
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapBalerResponse(profile), nil
}

func (s *balerService) GetProfile(ctx context.Context, id string) (dto.BalerProfileResponse, error) {
	pUUID, err := parseUUID(id)
	if err != nil {
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: invalid profile ID", ErrValidation)
	}

	profile, err := s.balerRepo.GetByID(ctx, pUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BalerProfileResponse{}, ErrNotFound
		}
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapBalerResponse(profile), nil
}

func (s *balerService) GetProfileByUserID(ctx context.Context, userID string) (dto.BalerProfileResponse, error) {
	uUUID, err := parseUUID(userID)
	if err != nil {
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: invalid user ID", ErrValidation)
	}

	profile, err := s.balerRepo.GetByUserID(ctx, uUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BalerProfileResponse{}, ErrNotFound
		}
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapBalerResponse(profile), nil
}

func (s *balerService) UpdateProfile(ctx context.Context, userID string, req dto.UpdateBalerProfileRequest) (dto.BalerProfileResponse, error) {
	uUUID, err := parseUUID(userID)
	if err != nil {
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: invalid user ID", ErrValidation)
	}

	existing, err := s.balerRepo.GetByUserID(ctx, uUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BalerProfileResponse{}, ErrNotFound
		}
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	arg := sqlc.UpdateBalerProfileParams{
		ID: existing.ID,
	}

	if req.OrganizationName != nil {
		arg.OrganizationName = toPgText(*req.OrganizationName)
	}
	if req.Phone != nil {
		arg.Phone = toPgText(*req.Phone)
	}
	if req.VehicleDetails != nil {
		arg.VehicleDetails = toPgText(*req.VehicleDetails)
	}
	if req.ServiceArea != nil {
		arg.ServiceArea = *req.ServiceArea
	} else {
		arg.ServiceArea = existing.ServiceArea
	}
	if req.District != nil {
		arg.District = *req.District
	} else {
		arg.District = existing.District
	}
	if req.State != nil {
		arg.State = *req.State
	} else {
		arg.State = existing.State
	}

	profile, err := s.balerRepo.Update(ctx, arg)
	if err != nil {
		return dto.BalerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapBalerResponse(profile), nil
}

func mapBalerResponse(profile sqlc.BalerProfile) dto.BalerProfileResponse {
	return dto.BalerProfileResponse{
		ID:               pgUUIDToStr(profile.ID),
		UserID:           pgUUIDToStr(profile.UserID),
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
