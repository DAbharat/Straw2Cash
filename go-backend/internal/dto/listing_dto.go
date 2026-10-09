package dto

import "time"

type CreateListingRequest struct {
	CropType           string   `json:"crop_type" validate:"required"`
	QuantityKg         float64  `json:"quantity_kg" validate:"required,gt=0"`
	PricePerKg         *float64 `json:"price_per_kg,omitempty" validate:"omitempty,gte=0"`
	MoisturePercentage *float64 `json:"moisture_percentage,omitempty" validate:"omitempty,gte=0,lte=100"`
	HarvestDate        string   `json:"harvest_date" validate:"required"`
	AvailableFrom      string   `json:"available_from" validate:"required"`
	AvailableUntil     string   `json:"available_until" validate:"required"`
	PickupLatitude     float64  `json:"pickup_latitude" validate:"required,gte=-90,lte=90"`
	PickupLongitude    float64  `json:"pickup_longitude" validate:"required,gte=-180,lte=180"`
}

type UpdateListingRequest struct {
	CropType           *string  `json:"crop_type,omitempty"`
	QuantityKg         *float64 `json:"quantity_kg,omitempty" validate:"omitempty,gt=0"`
	PricePerKg         *float64 `json:"price_per_kg,omitempty" validate:"omitempty,gte=0"`
	MoisturePercentage *float64 `json:"moisture_percentage,omitempty" validate:"omitempty,gte=0,lte=100"`
	HarvestDate        *string  `json:"harvest_date,omitempty"`
	AvailableFrom      *string  `json:"available_from,omitempty"`
	AvailableUntil     *string  `json:"available_until,omitempty"`
	PickupLatitude     *float64 `json:"pickup_latitude,omitempty" validate:"omitempty,gte=-90,lte=90"`
	PickupLongitude    *float64 `json:"pickup_longitude,omitempty" validate:"omitempty,gte=-180,lte=180"`
	Status             *string  `json:"status,omitempty" validate:"omitempty,oneof=AVAILABLE MATCHED BOOKED COLLECTED CANCELLED"`
}

type UpdateListingStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=AVAILABLE MATCHED BOOKED COLLECTED CANCELLED"`
}

type ListingResponse struct {
	ID                 string    `json:"id"`
	FarmerID           string    `json:"farmer_id"`
	CropType           string    `json:"crop_type"`
	QuantityKg         float64   `json:"quantity_kg"`
	PricePerKg         *float64  `json:"price_per_kg,omitempty"`
	MoisturePercentage *float64  `json:"moisture_percentage,omitempty"`
	HarvestDate        string    `json:"harvest_date"`
	AvailableFrom      string    `json:"available_from"`
	AvailableUntil     string    `json:"available_until"`
	PickupLatitude     float64   `json:"pickup_latitude"`
	PickupLongitude    float64   `json:"pickup_longitude"`
	Status             string    `json:"status"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}
