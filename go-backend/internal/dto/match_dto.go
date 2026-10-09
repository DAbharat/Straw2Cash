package dto

import "time"

type CreateMatchRequest struct {
	ListingID         string   `json:"listing_id" validate:"required,uuid"`
	RequirementID     string   `json:"requirement_id" validate:"required,uuid"`
	BalerID           *string  `json:"baler_id,omitempty" validate:"omitempty,uuid"`
	MatchedQuantityKg float64  `json:"matched_quantity_kg" validate:"required,gt=0"`
	AgreedPricePerKg  *float64 `json:"agreed_price_per_kg,omitempty" validate:"omitempty,gte=0"`
}

type UpdateMatchRequest struct {
	BalerID           *string  `json:"baler_id,omitempty" validate:"omitempty,uuid"`
	MatchedQuantityKg *float64 `json:"matched_quantity_kg,omitempty" validate:"omitempty,gt=0"`
	AgreedPricePerKg  *float64 `json:"agreed_price_per_kg,omitempty" validate:"omitempty,gte=0"`
	MatchScore        *float64 `json:"match_score,omitempty" validate:"omitempty,gte=0,lte=100"`
	Status            *string  `json:"status,omitempty" validate:"omitempty,oneof=PROPOSED ACCEPTED REJECTED EXPIRED COMPLETED"`
}

type UpdateMatchStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=PROPOSED ACCEPTED REJECTED EXPIRED COMPLETED"`
}

type MatchResponse struct {
	ID                string    `json:"id"`
	ListingID         string    `json:"listing_id"`
	RequirementID     string    `json:"requirement_id"`
	BalerID           *string   `json:"baler_id,omitempty"`
	MatchedQuantityKg float64   `json:"matched_quantity_kg"`
	AgreedPricePerKg  *float64  `json:"agreed_price_per_kg,omitempty"`
	MatchScore        *float64  `json:"match_score,omitempty"`
	Status            string    `json:"status"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
