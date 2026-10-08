package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/repository"
)

type BuyerService interface {
	CreateProfile(ctx context.Context, userID string, req dto.CreateBuyerProfileRequest) (dto.BuyerProfileResponse, error)
	GetProfile(ctx context.Context, id string) (dto.BuyerProfileResponse, error)
	GetProfileByUserID(ctx context.Context, userID string) (dto.BuyerProfileResponse, error)
	UpdateProfile(ctx context.Context, userID string, req dto.UpdateBuyerProfileRequest) (dto.BuyerProfileResponse, error)
}

type buyerService struct {
	buyerRepo repository.BuyerRepository
	userRepo  repository.UserRepository
}

func NewBuyerService(buyerRepo repository.BuyerRepository, userRepo repository.UserRepository) BuyerService {
	return &buyerService{
		buyerRepo: buyerRepo,
		userRepo:  userRepo,
	}
}

func (s *buyerService) CreateProfile(ctx context.Context, userID string, req dto.CreateBuyerProfileRequest) (dto.BuyerProfileResponse, error) {
	uUUID, err := parseUUID(userID)
	if err != nil {
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: invalid user ID", ErrValidation)
	}

	user, err := s.userRepo.GetByID(ctx, uUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BuyerProfileResponse{}, fmt.Errorf("%w: user not found", ErrNotFound)
		}
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	if user.Role != sqlc.UserRoleBUYER {
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: user is not a buyer", ErrForbidden)
	}

	arg := sqlc.CreateBuyerProfileParams{
		UserID:           uUUID,
		OrganizationName: req.OrganizationName,
		BuyerType:        sqlc.BuyerType(req.BuyerType),
		Address:          req.Address,
		District:         req.District,
		State:            req.State,
		Latitude:         toPgNumeric(req.Latitude),
		Longitude:        toPgNumeric(req.Longitude),
	}

	profile, err := s.buyerRepo.Create(ctx, arg)
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
	pUUID, err := parseUUID(id)
	if err != nil {
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: invalid profile ID", ErrValidation)
	}

	profile, err := s.buyerRepo.GetByID(ctx, pUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BuyerProfileResponse{}, ErrNotFound
		}
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapBuyerResponse(profile), nil
}

func (s *buyerService) GetProfileByUserID(ctx context.Context, userID string) (dto.BuyerProfileResponse, error) {
	uUUID, err := parseUUID(userID)
	if err != nil {
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: invalid user ID", ErrValidation)
	}

	profile, err := s.buyerRepo.GetByUserID(ctx, uUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BuyerProfileResponse{}, ErrNotFound
		}
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapBuyerResponse(profile), nil
}

func (s *buyerService) UpdateProfile(ctx context.Context, userID string, req dto.UpdateBuyerProfileRequest) (dto.BuyerProfileResponse, error) {
	uUUID, err := parseUUID(userID)
	if err != nil {
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: invalid user ID", ErrValidation)
	}

	existing, err := s.buyerRepo.GetByUserID(ctx, uUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.BuyerProfileResponse{}, ErrNotFound
		}
		return dto.BuyerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	arg := sqlc.UpdateBuyerProfileParams{
		ID: existing.ID,
	}

	if req.OrganizationName != nil {
		arg.OrganizationName = *req.OrganizationName
	} else {
		arg.OrganizationName = existing.OrganizationName
	}
	if req.BuyerType != nil {
		arg.BuyerType = sqlc.BuyerType(*req.BuyerType)
	} else {
		arg.BuyerType = existing.BuyerType
	}
	if req.Address != nil {
		arg.Address = *req.Address
	} else {
		arg.Address = existing.Address
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
	if req.Latitude != nil {
		arg.Latitude = toPgNumeric(*req.Latitude)
	} else {
		arg.Latitude = existing.Latitude
	}
	if req.Longitude != nil {
		arg.Longitude = toPgNumeric(*req.Longitude)
	} else {
		arg.Longitude = existing.Longitude
	}

	profile, err := s.buyerRepo.Update(ctx, arg)
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
		ID:               pgUUIDToStr(profile.ID),
		UserID:           pgUUIDToStr(profile.UserID),
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
