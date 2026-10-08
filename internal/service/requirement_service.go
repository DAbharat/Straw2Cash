package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
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
	bUUID, err := parseUUID(buyerID)
	if err != nil {
		return dto.RequirementResponse{}, fmt.Errorf("%w: invalid buyer ID", ErrValidation)
	}

	// Verify buyer exists
	_, err = s.buyerRepo.GetByID(ctx, bUUID)
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

	arg := sqlc.CreateBuyerRequirementParams{
		BuyerID:             bUUID,
		CropType:            req.CropType,
		QuantityRequiredKg:  toPgNumeric(req.QuantityRequiredKg),
		RemainingQuantityKg: toPgNumeric(req.QuantityRequiredKg), // Initially remaining == required
		RequiredFrom:        pgtype.Date{Time: rFrom, Valid: true},
		RequiredUntil:       pgtype.Date{Time: rUntil, Valid: true},
		Status:              sqlc.RequirementStatusOPEN,
	}

	if req.MaxPricePerKg != nil {
		arg.MaxPricePerKg = toPgNumeric(*req.MaxPricePerKg)
	}
	if req.PreferredRadiusKm != nil {
		arg.PreferredRadiusKm = toPgNumeric(*req.PreferredRadiusKm)
	}

	requirement, err := s.reqRepo.Create(ctx, arg)
	if err != nil {
		if errors.Is(err, repository.ErrCheckViolation) {
			return dto.RequirementResponse{}, fmt.Errorf("%w: invalid constraint", ErrValidation)
		}
		return dto.RequirementResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapRequirementResponse(requirement), nil
}

func (s *requirementService) GetRequirement(ctx context.Context, id string) (dto.RequirementResponse, error) {
	rUUID, err := parseUUID(id)
	if err != nil {
		return dto.RequirementResponse{}, fmt.Errorf("%w: invalid requirement ID", ErrValidation)
	}

	req, err := s.reqRepo.GetByID(ctx, rUUID)
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
		arg := sqlc.ListBuyerRequirementsByStatusParams{
			Status: sqlc.RequirementStatus(status),
			Limit:  limit,
			Offset: offset,
		}
		reqs, err = s.reqRepo.ListByStatus(ctx, arg)
	} else {
		arg := sqlc.ListBuyerRequirementsParams{
			Limit:  limit,
			Offset: offset,
		}
		reqs, err = s.reqRepo.List(ctx, arg)
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
	rUUID, err := parseUUID(id)
	if err != nil {
		return dto.RequirementResponse{}, fmt.Errorf("%w: invalid requirement ID", ErrValidation)
	}

	existing, err := s.reqRepo.GetByID(ctx, rUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.RequirementResponse{}, ErrNotFound
		}
		return dto.RequirementResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	if existing.Status == sqlc.RequirementStatusCANCELLED || existing.Status == sqlc.RequirementStatusFULFILLED {
		return dto.RequirementResponse{}, fmt.Errorf("%w: cannot change status of completed/cancelled requirement", ErrInvalidState)
	}

	arg := sqlc.UpdateBuyerRequirementStatusParams{
		ID:     rUUID,
		Status: sqlc.RequirementStatus(req.Status),
	}

	requirement, err := s.reqRepo.UpdateStatus(ctx, arg)
	if err != nil {
		return dto.RequirementResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapRequirementResponse(requirement), nil
}

func mapRequirementResponse(req sqlc.BuyerRequirement) dto.RequirementResponse {
	res := dto.RequirementResponse{
		ID:                  pgUUIDToStr(req.ID),
		BuyerID:             pgUUIDToStr(req.BuyerID),
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
