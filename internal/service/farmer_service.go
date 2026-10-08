package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/dto"
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
}

func NewFarmerService(farmerRepo repository.FarmerRepository, userRepo repository.UserRepository) FarmerService {
	return &farmerService{
		farmerRepo: farmerRepo,
		userRepo:   userRepo,
	}
}

func (s *farmerService) CreateProfile(ctx context.Context, userID string, req dto.CreateFarmerProfileRequest) (dto.FarmerProfileResponse, error) {
	uUUID, err := parseUUID(userID)
	if err != nil {
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: invalid user ID", ErrValidation)
	}

	// Verify user exists and is a farmer
	user, err := s.userRepo.GetByID(ctx, uUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.FarmerProfileResponse{}, fmt.Errorf("%w: user not found", ErrNotFound)
		}
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	if user.Role != sqlc.UserRoleFARMER {
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: user is not a farmer", ErrForbidden)
	}

	arg := sqlc.CreateFarmerProfileParams{
		UserID:        uUUID,
		Village:       req.Village,
		District:      req.District,
		State:         req.State,
		Latitude:      toPgNumeric(req.Latitude),
		Longitude:     toPgNumeric(req.Longitude),
		LandAreaAcres: toPgNumeric(req.LandAreaAcres),
	}

	profile, err := s.farmerRepo.Create(ctx, arg)
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
	pUUID, err := parseUUID(id)
	if err != nil {
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: invalid profile ID", ErrValidation)
	}

	profile, err := s.farmerRepo.GetByID(ctx, pUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.FarmerProfileResponse{}, ErrNotFound
		}
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapFarmerResponse(profile), nil
}

func (s *farmerService) GetProfileByUserID(ctx context.Context, userID string) (dto.FarmerProfileResponse, error) {
	uUUID, err := parseUUID(userID)
	if err != nil {
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: invalid user ID", ErrValidation)
	}

	profile, err := s.farmerRepo.GetByUserID(ctx, uUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.FarmerProfileResponse{}, ErrNotFound
		}
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapFarmerResponse(profile), nil
}

func (s *farmerService) UpdateProfile(ctx context.Context, userID string, req dto.UpdateFarmerProfileRequest) (dto.FarmerProfileResponse, error) {
	uUUID, err := parseUUID(userID)
	if err != nil {
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: invalid user ID", ErrValidation)
	}

	// Fetch existing to ensure they own it and exists
	existing, err := s.farmerRepo.GetByUserID(ctx, uUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.FarmerProfileResponse{}, ErrNotFound
		}
		return dto.FarmerProfileResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	arg := sqlc.UpdateFarmerProfileParams{
		ID: existing.ID,
	}

	if req.Village != nil {
		arg.Village = *req.Village
	} else {
		arg.Village = existing.Village
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
	if req.LandAreaAcres != nil {
		arg.LandAreaAcres = toPgNumeric(*req.LandAreaAcres)
	} else {
		arg.LandAreaAcres = existing.LandAreaAcres
	}

	profile, err := s.farmerRepo.Update(ctx, arg)
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
		ID:            pgUUIDToStr(profile.ID),
		UserID:        pgUUIDToStr(profile.UserID),
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

// Float Numeric Helpers

func toPgNumeric(f float64) pgtype.Numeric {
	var n pgtype.Numeric
	// Just use fmt parsing for simplicity
	err := n.Scan(fmt.Sprintf("%f", f))
	if err != nil {
		// fallback to 0 if invalid
		n.Valid = false
	}
	return n
}

func fromPgNumeric(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	f, _ := n.Float64Value()
	return f.Float64
}
