package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/repository"
)

type RequirementService interface {
	CreateRequirement(ctx context.Context, buyerID string, req dto.CreateRequirementRequest) (dto.RequirementResponse, error)
	GetRequirement(ctx context.Context, id string) (dto.RequirementResponse, error)
	ListRequirements(ctx context.Context, status string, limit, offset int32) ([]dto.RequirementResponse, error)
	UpdateRequirementStatus(ctx context.Context, id string, req dto.UpdateRequirementStatusRequest) (dto.RequirementResponse, error)
}

type requirementService struct {
	reqRepo   repository.RequirementRepository
	buyerRepo repository.BuyerRepository
}

func NewRequirementService(reqRepo repository.RequirementRepository, buyerRepo repository.BuyerRepository) RequirementService {
	return &requirementService{
		reqRepo:   reqRepo,
		buyerRepo: buyerRepo,
	}
}

func (s *requirementService) CreateRequirement(ctx context.Context, buyerID string, req dto.CreateRequirementRequest) (dto.RequirementResponse, error) {


	// Verify buyer exists
	_, err := s.buyerRepo.GetProfileByID(ctx, buyerID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.RequirementResponse{}, fmt.Errorf("%w: buyer profile not found", ErrForbidden)
		}
		return dto.RequirementResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	rFrom, err := time.Parse("2006-01-02", req.RequiredFrom)
	if err != nil {
		return dto.RequirementResponse{}, fmt.Errorf("%w: invalid required_from", ErrValidation)
	}
	rUntil, err := time.Parse("2006-01-02", req.RequiredUntil)
	if err != nil {
		return dto.RequirementResponse{}, fmt.Errorf("%w: invalid required_until", ErrValidation)
	}

	if rUntil.Before(rFrom) {
		return dto.RequirementResponse{}, fmt.Errorf("%w: required_until must be after required_from", ErrValidation)
	}

	requirement, err := s.reqRepo.CreateRequirement(ctx, buyerID, req.CropType, req.QuantityRequiredKg, rFrom, rUntil, req.MaxPricePerKg, req.PreferredRadiusKm)
	if err != nil {
		if errors.Is(err, repository.ErrCheckViolation) {
			return dto.RequirementResponse{}, fmt.Errorf("%w: invalid constraint", ErrValidation)
		}
		return dto.RequirementResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapRequirementResponse(requirement), nil
}

func (s *requirementService) GetRequirement(ctx context.Context, id string) (dto.RequirementResponse, error) {
	req, err := s.reqRepo.GetRequirementByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.RequirementResponse{}, ErrNotFound
		}
		return dto.RequirementResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapRequirementResponse(req), nil
}

func (s *requirementService) ListRequirements(ctx context.Context, status string, limit, offset int32) ([]dto.RequirementResponse, error) {
	var reqs []sqlc.BuyerRequirement
	var err error

	if status != "" {
		reqs, err = s.reqRepo.ListRequirementsByStatus(ctx, status, limit, offset)
	} else {
		reqs, err = s.reqRepo.ListRequirements(ctx, limit, offset)
	}

	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	var res []dto.RequirementResponse
	for _, r := range reqs {
		res = append(res, mapRequirementResponse(r))
	}

	return res, nil
}

func (s *requirementService) UpdateRequirementStatus(ctx context.Context, id string, req dto.UpdateRequirementStatusRequest) (dto.RequirementResponse, error) {
	existing, err := s.reqRepo.GetRequirementByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.RequirementResponse{}, ErrNotFound
		}
		return dto.RequirementResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	if existing.Status == sqlc.RequirementStatusCANCELLED || existing.Status == sqlc.RequirementStatusFULFILLED {
		return dto.RequirementResponse{}, fmt.Errorf("%w: cannot change status of completed/cancelled requirement", ErrInvalidState)
	}

	requirement, err := s.reqRepo.UpdateRequirementStatus(ctx, id, req.Status)
	if err != nil {
		return dto.RequirementResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapRequirementResponse(requirement), nil
}

func mapRequirementResponse(req sqlc.BuyerRequirement) dto.RequirementResponse {
	res := dto.RequirementResponse{
		ID:                  pgUUIDToStr(req.ID.Bytes),
		BuyerID:             pgUUIDToStr(req.BuyerID.Bytes),
		CropType:            req.CropType,
		QuantityRequiredKg:  fromPgNumeric(req.QuantityRequiredKg),
		RemainingQuantityKg: fromPgNumeric(req.RemainingQuantityKg),
		RequiredFrom:        req.RequiredFrom.Time.Format("2006-01-02"),
		RequiredUntil:       req.RequiredUntil.Time.Format("2006-01-02"),
		Status:              string(req.Status),
		CreatedAt:           req.CreatedAt.Time,
		UpdatedAt:           req.UpdatedAt.Time,
	}

	if req.MaxPricePerKg.Valid {
		v := fromPgNumeric(req.MaxPricePerKg)
		res.MaxPricePerKg = &v
	}
	if req.PreferredRadiusKm.Valid {
		v := fromPgNumeric(req.PreferredRadiusKm)
		res.PreferredRadiusKm = &v
	}

	return res
}
