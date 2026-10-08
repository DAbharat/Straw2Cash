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

type ListingService interface {
	CreateListing(ctx context.Context, farmerID string, req dto.CreateListingRequest) (dto.ListingResponse, error)
	GetListing(ctx context.Context, id string) (dto.ListingResponse, error)
	ListListings(ctx context.Context, status string, limit, offset int32) ([]dto.ListingResponse, error)
	UpdateListingStatus(ctx context.Context, id string, req dto.UpdateListingStatusRequest) (dto.ListingResponse, error)
}

type listingService struct {
	listingRepo repository.ListingRepository
	farmerRepo  repository.FarmerRepository
}

func NewListingService(listingRepo repository.ListingRepository, farmerRepo repository.FarmerRepository) ListingService {
	return &listingService{
		listingRepo: listingRepo,
		farmerRepo:  farmerRepo,
	}
}

func (s *listingService) CreateListing(ctx context.Context, farmerID string, req dto.CreateListingRequest) (dto.ListingResponse, error) {
	fUUID, err := parseUUID(farmerID)
	if err != nil {
		return dto.ListingResponse{}, fmt.Errorf("%w: invalid farmer ID", ErrValidation)
	}

	// Verify farmer exists
	_, err = s.farmerRepo.GetByID(ctx, fUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.ListingResponse{}, fmt.Errorf("%w: farmer profile not found", ErrForbidden)
		}
		return dto.ListingResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	hDate, err := time.Parse("2006-01-02", req.HarvestDate)
	if err != nil {
		return dto.ListingResponse{}, fmt.Errorf("%w: invalid harvest_date", ErrValidation)
	}
	aFrom, err := time.Parse("2006-01-02", req.AvailableFrom)
	if err != nil {
		return dto.ListingResponse{}, fmt.Errorf("%w: invalid available_from", ErrValidation)
	}
	aUntil, err := time.Parse("2006-01-02", req.AvailableUntil)
	if err != nil {
		return dto.ListingResponse{}, fmt.Errorf("%w: invalid available_until", ErrValidation)
	}

	if aUntil.Before(aFrom) {
		return dto.ListingResponse{}, fmt.Errorf("%w: available_until must be after available_from", ErrValidation)
	}

	arg := sqlc.CreateStrawListingParams{
		FarmerID:        fUUID,
		CropType:        req.CropType,
		QuantityKg:      toPgNumeric(req.QuantityKg),
		HarvestDate:     pgtype.Date{Time: hDate, Valid: true},
		AvailableFrom:   pgtype.Date{Time: aFrom, Valid: true},
		AvailableUntil:  pgtype.Date{Time: aUntil, Valid: true},
		PickupLatitude:  toPgNumeric(req.PickupLatitude),
		PickupLongitude: toPgNumeric(req.PickupLongitude),
		Status:          sqlc.ListingStatusAVAILABLE,
	}

	if req.PricePerKg != nil {
		arg.PricePerKg = toPgNumeric(*req.PricePerKg)
	}
	if req.MoisturePercentage != nil {
		arg.MoisturePercentage = toPgNumeric(*req.MoisturePercentage)
	}

	listing, err := s.listingRepo.Create(ctx, arg)
	if err != nil {
		if errors.Is(err, repository.ErrCheckViolation) {
			return dto.ListingResponse{}, fmt.Errorf("%w: invalid constraint", ErrValidation)
		}
		return dto.ListingResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapListingResponse(listing), nil
}

func (s *listingService) GetListing(ctx context.Context, id string) (dto.ListingResponse, error) {
	lUUID, err := parseUUID(id)
	if err != nil {
		return dto.ListingResponse{}, fmt.Errorf("%w: invalid listing ID", ErrValidation)
	}

	listing, err := s.listingRepo.GetByID(ctx, lUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.ListingResponse{}, ErrNotFound
		}
		return dto.ListingResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapListingResponse(listing), nil
}

func (s *listingService) ListListings(ctx context.Context, status string, limit, offset int32) ([]dto.ListingResponse, error) {
	var listings []sqlc.StrawListing
	var err error

	if status != "" {
		arg := sqlc.ListStrawListingsByStatusParams{
			Status: sqlc.ListingStatus(status),
			Limit:  limit,
			Offset: offset,
		}
		listings, err = s.listingRepo.ListByStatus(ctx, arg)
	} else {
		arg := sqlc.ListStrawListingsParams{
			Limit:  limit,
			Offset: offset,
		}
		listings, err = s.listingRepo.List(ctx, arg)
	}

	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	var res []dto.ListingResponse
	for _, l := range listings {
		res = append(res, mapListingResponse(l))
	}

	return res, nil
}

func (s *listingService) UpdateListingStatus(ctx context.Context, id string, req dto.UpdateListingStatusRequest) (dto.ListingResponse, error) {
	lUUID, err := parseUUID(id)
	if err != nil {
		return dto.ListingResponse{}, fmt.Errorf("%w: invalid listing ID", ErrValidation)
	}

	// This is a simple status update, in reality state transitions should be checked
	// E.g., CANCELLED -> AVAILABLE might not be allowed.
	existing, err := s.listingRepo.GetByID(ctx, lUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.ListingResponse{}, ErrNotFound
		}
		return dto.ListingResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	if existing.Status == sqlc.ListingStatusCANCELLED || existing.Status == sqlc.ListingStatusCOLLECTED {
		return dto.ListingResponse{}, fmt.Errorf("%w: cannot change status of completed/cancelled listing", ErrInvalidState)
	}

	arg := sqlc.UpdateStrawListingStatusParams{
		ID:     lUUID,
		Status: sqlc.ListingStatus(req.Status),
	}

	listing, err := s.listingRepo.UpdateStatus(ctx, arg)
	if err != nil {
		return dto.ListingResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapListingResponse(listing), nil
}

func mapListingResponse(listing sqlc.StrawListing) dto.ListingResponse {
	res := dto.ListingResponse{
		ID:              pgUUIDToStr(listing.ID),
		FarmerID:        pgUUIDToStr(listing.FarmerID),
		CropType:        listing.CropType,
		QuantityKg:      fromPgNumeric(listing.QuantityKg),
		HarvestDate:     listing.HarvestDate.Time.Format("2006-01-02"),
		AvailableFrom:   listing.AvailableFrom.Time.Format("2006-01-02"),
		AvailableUntil:  listing.AvailableUntil.Time.Format("2006-01-02"),
		PickupLatitude:  fromPgNumeric(listing.PickupLatitude),
		PickupLongitude: fromPgNumeric(listing.PickupLongitude),
		Status:          string(listing.Status),
		CreatedAt:       listing.CreatedAt.Time,
		UpdatedAt:       listing.UpdatedAt.Time,
	}

	if listing.PricePerKg.Valid {
		v := fromPgNumeric(listing.PricePerKg)
		res.PricePerKg = &v
	}
	if listing.MoisturePercentage.Valid {
		v := fromPgNumeric(listing.MoisturePercentage)
		res.MoisturePercentage = &v
	}

	return res
}
