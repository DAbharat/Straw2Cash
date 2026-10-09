package dto

import "time"

type CreateBuyerProfileRequest struct {
	OrganizationName string  `json:"organization_name" validate:"required"`
	BuyerType        string  `json:"buyer_type" validate:"required,oneof=BIOMASS_PLANT BRICK_KILN PAPER_MILL CATTLE_FEED OTHER"`
	Address          string  `json:"address" validate:"required"`
	District         string  `json:"district" validate:"required"`
	State            string  `json:"state" validate:"required"`
	Latitude         float64 `json:"latitude" validate:"required,gte=-90,lte=90"`
	Longitude        float64 `json:"longitude" validate:"required,gte=-180,lte=180"`
}

type UpdateBuyerProfileRequest struct {
	OrganizationName *string  `json:"organization_name,omitempty"`
	BuyerType        *string  `json:"buyer_type,omitempty" validate:"omitempty,oneof=BIOMASS_PLANT BRICK_KILN PAPER_MILL CATTLE_FEED OTHER"`
	Address          *string  `json:"address,omitempty"`
	District         *string  `json:"district,omitempty"`
	State            *string  `json:"state,omitempty"`
	Latitude         *float64 `json:"latitude,omitempty" validate:"omitempty,gte=-90,lte=90"`
	Longitude        *float64 `json:"longitude,omitempty" validate:"omitempty,gte=-180,lte=180"`
}

type BuyerProfileResponse struct {
	ID               string    `json:"id"`
	UserID           string    `json:"user_id"`
	OrganizationName string    `json:"organization_name"`
	BuyerType        string    `json:"buyer_type"`
	Address          string    `json:"address"`
	District         string    `json:"district"`
	State            string    `json:"state"`
	Latitude         float64   `json:"latitude"`
	Longitude        float64   `json:"longitude"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
