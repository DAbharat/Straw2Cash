package dto

import "time"

type CreateBalerProfileRequest struct {
	OrganizationName string `json:"organization_name,omitempty"`
	Phone            string `json:"phone,omitempty"`
	VehicleDetails   string `json:"vehicle_details,omitempty"`
	ServiceArea      string `json:"service_area" validate:"required"`
	District         string `json:"district" validate:"required"`
	State            string `json:"state" validate:"required"`
}

type UpdateBalerProfileRequest struct {
	OrganizationName *string `json:"organization_name,omitempty"`
	Phone            *string `json:"phone,omitempty"`
	VehicleDetails   *string `json:"vehicle_details,omitempty"`
	ServiceArea      *string `json:"service_area,omitempty"`
	District         *string `json:"district,omitempty"`
	State            *string `json:"state,omitempty"`
}

type BalerProfileResponse struct {
	ID               string    `json:"id"`
	UserID           string    `json:"user_id"`
	OrganizationName string    `json:"organization_name,omitempty"`
	Phone            string    `json:"phone,omitempty"`
	VehicleDetails   string    `json:"vehicle_details,omitempty"`
	ServiceArea      string    `json:"service_area"`
	District         string    `json:"district"`
	State            string    `json:"state"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
