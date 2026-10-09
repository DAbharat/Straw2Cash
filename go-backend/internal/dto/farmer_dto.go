package dto

import "time"

type CreateFarmerProfileRequest struct {
	Village       string  `json:"village" validate:"required"`
	District      string  `json:"district" validate:"required"`
	State         string  `json:"state" validate:"required"`
	Latitude      float64 `json:"latitude" validate:"required,gte=-90,lte=90"`
	Longitude     float64 `json:"longitude" validate:"required,gte=-180,lte=180"`
	LandAreaAcres float64 `json:"land_area_acres" validate:"required,gt=0"`
}

type UpdateFarmerProfileRequest struct {
	Village       *string  `json:"village,omitempty"`
	District      *string  `json:"district,omitempty"`
	State         *string  `json:"state,omitempty"`
	Latitude      *float64 `json:"latitude,omitempty" validate:"omitempty,gte=-90,lte=90"`
	Longitude     *float64 `json:"longitude,omitempty" validate:"omitempty,gte=-180,lte=180"`
	LandAreaAcres *float64 `json:"land_area_acres,omitempty" validate:"omitempty,gt=0"`
}

type FarmerProfileResponse struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	Village       string    `json:"village"`
	District      string    `json:"district"`
	State         string    `json:"state"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	LandAreaAcres float64   `json:"land_area_acres"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
