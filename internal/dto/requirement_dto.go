package dto

import "time"

type CreateRequirementRequest struct {
	CropType             string   `json:"crop_type" validate:"required"`
	QuantityRequiredKg   float64  `json:"quantity_required_kg" validate:"required,gt=0"`
	MaxPricePerKg        *float64 `json:"max_price_per_kg,omitempty" validate:"omitempty,gte=0"`
	PreferredRadiusKm    *float64 `json:"preferred_radius_km,omitempty" validate:"omitempty,gt=0"`
	RequiredFrom         string   `json:"required_from" validate:"required"`
	RequiredUntil        string   `json:"required_until" validate:"required"`
}

type UpdateRequirementRequest struct {
	CropType             *string  `json:"crop_type,omitempty"`
	QuantityRequiredKg   *float64 `json:"quantity_required_kg,omitempty" validate:"omitempty,gt=0"`
	RemainingQuantityKg  *float64 `json:"remaining_quantity_kg,omitempty" validate:"omitempty,gte=0"`
	MaxPricePerKg        *float64 `json:"max_price_per_kg,omitempty" validate:"omitempty,gte=0"`
	PreferredRadiusKm    *float64 `json:"preferred_radius_km,omitempty" validate:"omitempty,gt=0"`
	RequiredFrom         *string  `json:"required_from,omitempty"`
	RequiredUntil        *string  `json:"required_until,omitempty"`
	Status               *string  `json:"status,omitempty" validate:"omitempty,oneof=OPEN PARTIALLY_FULFILLED FULFILLED CANCELLED"`
}

type UpdateRequirementStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=OPEN PARTIALLY_FULFILLED FULFILLED CANCELLED"`
}

type RequirementResponse struct {
	ID                  string    `json:"id"`
	BuyerID             string    `json:"buyer_id"`
	CropType            string    `json:"crop_type"`
	QuantityRequiredKg  float64   `json:"quantity_required_kg"`
	RemainingQuantityKg float64   `json:"remaining_quantity_kg"`
	MaxPricePerKg       *float64  `json:"max_price_per_kg,omitempty"`
	PreferredRadiusKm   *float64  `json:"preferred_radius_km,omitempty"`
	RequiredFrom        string    `json:"required_from"`
	RequiredUntil       string    `json:"required_until"`
	Status              string    `json:"status"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}
