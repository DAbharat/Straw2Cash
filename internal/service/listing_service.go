package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/DAbharat/Straw2Cash/internal/authz"
	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/middleware"
	"github.com/DAbharat/Straw2Cash/internal/repository"
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
	userRepo    repository.UserRepository
	authorizer  *authz.Authorizer
}

func NewListingService(listingRepo repository.ListingRepository, farmerRepo repository.FarmerRepository, userRepo repository.UserRepository, authorizer *authz.Authorizer) ListingService {
	return &listingService{
		listingRepo: listingRepo,
		farmerRepo:  farmerRepo,
		userRepo:    userRepo,
		authorizer:  authorizer,
	}
}

func (s *listingService) CreateListing(ctx context.Context, farmerID string, req dto.CreateListingRequest) (dto.ListingResponse, error) {
	principalID, ok := middleware.GetUserFromContext(ctx)
	if !ok {
		return dto.ListingResponse{}, ErrUnauthorized
	}



	principalUser, err := s.userRepo.GetUserByID(ctx, principalID)
	if err != nil {
		return dto.ListingResponse{}, ErrUnauthorized
	}

	pUID, pEnt := authz.BuildUserEntity(principalID, string(principalUser.Role))
	rUID, rEnt := authz.BuildListingEntity("dummy", principalID) // Dummy ID for creation
	entities := authz.MergeEntities(pEnt, rEnt)

	allowed, err := s.authorizer.IsAuthorized(pUID, authz.ActionCreateListing(), rUID, entities)
	if err != nil {
		return dto.ListingResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}
	if !allowed {
		return dto.ListingResponse{}, ErrForbidden
	}

	_, err = s.farmerRepo.GetProfileByID(ctx, farmerID)
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

	listing, err := s.listingRepo.CreateListing(ctx, farmerID, req.CropType, req.QuantityKg, hDate, aFrom, aUntil, req.PickupLatitude, req.PickupLongitude, req.PricePerKg, req.MoisturePercentage)
	if err != nil {
		if errors.Is(err, repository.ErrCheckViolation) {
			return dto.ListingResponse{}, fmt.Errorf("%w: invalid constraint", ErrValidation)
		}
		return dto.ListingResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapListingResponse(listing), nil
}

func (s *listingService) GetListing(ctx context.Context, id string) (dto.ListingResponse, error) {
	listing, err := s.listingRepo.GetListingByID(ctx, id)
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
		listings, err = s.listingRepo.ListListingsByStatus(ctx, status, limit, offset)
	} else {
		listings, err = s.listingRepo.ListListings(ctx, limit, offset)
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
	principalID, ok := middleware.GetUserFromContext(ctx)
	if !ok {
		return dto.ListingResponse{}, ErrUnauthorized
	}



	principalUser, err := s.userRepo.GetUserByID(ctx, principalID)
	if err != nil {
		return dto.ListingResponse{}, ErrUnauthorized
	}

	existing, err := s.listingRepo.GetListingByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.ListingResponse{}, ErrNotFound
		}
		return dto.ListingResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	farmerProfile, err := s.farmerRepo.GetProfileByID(ctx, pgUUIDToStr(existing.FarmerID.Bytes))
	if err != nil {
		return dto.ListingResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	pUID, pEnt := authz.BuildUserEntity(principalID, string(principalUser.Role))
	rUID, rEnt := authz.BuildListingEntity(id, pgUUIDToStr(farmerProfile.UserID.Bytes))
	entities := authz.MergeEntities(pEnt, rEnt)

	allowed, err := s.authorizer.IsAuthorized(pUID, authz.ActionManageListing(), rUID, entities)
	if err != nil {
		return dto.ListingResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}
	if !allowed {
		return dto.ListingResponse{}, ErrForbidden
	}

	if existing.Status == sqlc.ListingStatusCANCELLED || existing.Status == sqlc.ListingStatusCOLLECTED {
		return dto.ListingResponse{}, fmt.Errorf("%w: cannot change status of completed/cancelled listing", ErrInvalidState)
	}

	listing, err := s.listingRepo.UpdateListingStatus(ctx, id, req.Status)
	if err != nil {
		return dto.ListingResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapListingResponse(listing), nil
}

func mapListingResponse(listing sqlc.StrawListing) dto.ListingResponse {
	res := dto.ListingResponse{
		ID:              pgUUIDToStr(listing.ID.Bytes),
		FarmerID:        pgUUIDToStr(listing.FarmerID.Bytes),
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
