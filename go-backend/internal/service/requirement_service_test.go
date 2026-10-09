package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/DAbharat/Straw2Cash/internal/authz"
	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/middleware"
	"github.com/DAbharat/Straw2Cash/internal/repository"
	"github.com/DAbharat/Straw2Cash/internal/service"
	"github.com/jackc/pgx/v5/pgtype"
)

type MockRequirementRepository struct {
	CreateRequirementFunc        func(ctx context.Context, buyerID, cropType string, qty float64, reqFrom, reqUntil time.Time, maxPrice, radius *float64) (sqlc.BuyerRequirement, error)
	GetRequirementByIDFunc       func(ctx context.Context, id string) (sqlc.BuyerRequirement, error)
	ListRequirementsFunc         func(ctx context.Context, limit, offset int32) ([]sqlc.BuyerRequirement, error)
	ListRequirementsByStatusFunc func(ctx context.Context, status string, limit, offset int32) ([]sqlc.BuyerRequirement, error)
	UpdateRequirementStatusFunc  func(ctx context.Context, id string, status string) (sqlc.BuyerRequirement, error)
	DeleteRequirementFunc        func(ctx context.Context, id string) error
	ListRequirementsByBuyerIDFunc func(ctx context.Context, buyerID string, limit, offset int32) ([]sqlc.BuyerRequirement, error)
	UpdateRequirementFunc        func(ctx context.Context, id string, cropType *string, qty *float64, remQty *float64, reqFrom *time.Time, reqUntil *time.Time, maxPrice *float64, radius *float64) (sqlc.BuyerRequirement, error)
}

func (m *MockRequirementRepository) CreateRequirement(ctx context.Context, buyerID, cropType string, qty float64, reqFrom, reqUntil time.Time, maxPrice, radius *float64) (sqlc.BuyerRequirement, error) {
	if m.CreateRequirementFunc != nil {
		return m.CreateRequirementFunc(ctx, buyerID, cropType, qty, reqFrom, reqUntil, maxPrice, radius)
	}
	return sqlc.BuyerRequirement{}, nil
}

func (m *MockRequirementRepository) GetRequirementByID(ctx context.Context, id string) (sqlc.BuyerRequirement, error) {
	if m.GetRequirementByIDFunc != nil {
		return m.GetRequirementByIDFunc(ctx, id)
	}
	return sqlc.BuyerRequirement{}, nil
}

func (m *MockRequirementRepository) ListRequirements(ctx context.Context, limit, offset int32) ([]sqlc.BuyerRequirement, error) {
	if m.ListRequirementsFunc != nil {
		return m.ListRequirementsFunc(ctx, limit, offset)
	}
	return nil, nil
}

func (m *MockRequirementRepository) ListRequirementsByStatus(ctx context.Context, status string, limit, offset int32) ([]sqlc.BuyerRequirement, error) {
	if m.ListRequirementsByStatusFunc != nil {
		return m.ListRequirementsByStatusFunc(ctx, status, limit, offset)
	}
	return nil, nil
}

func (m *MockRequirementRepository) ListRequirementsByBuyerID(ctx context.Context, buyerID string, limit, offset int32) ([]sqlc.BuyerRequirement, error) {
	if m.ListRequirementsByBuyerIDFunc != nil {
		return m.ListRequirementsByBuyerIDFunc(ctx, buyerID, limit, offset)
	}
	return nil, nil
}

func (m *MockRequirementRepository) UpdateRequirement(ctx context.Context, id string, cropType *string, qty *float64, remQty *float64, reqFrom *time.Time, reqUntil *time.Time, maxPrice *float64, radius *float64) (sqlc.BuyerRequirement, error) {
	if m.UpdateRequirementFunc != nil {
		return m.UpdateRequirementFunc(ctx, id, cropType, qty, remQty, reqFrom, reqUntil, maxPrice, radius)
	}
	return sqlc.BuyerRequirement{}, nil
}

func (m *MockRequirementRepository) UpdateRequirementStatus(ctx context.Context, id string, status string) (sqlc.BuyerRequirement, error) {
	if m.UpdateRequirementStatusFunc != nil {
		return m.UpdateRequirementStatusFunc(ctx, id, status)
	}
	return sqlc.BuyerRequirement{}, nil
}

func (m *MockRequirementRepository) DeleteRequirement(ctx context.Context, id string) error {
	if m.DeleteRequirementFunc != nil {
		return m.DeleteRequirementFunc(ctx, id)
	}
	return nil
}

type MockBuyerRepository struct {
	CreateProfileFunc      func(ctx context.Context, userID, orgName, buyerType, address, district, state string, lat, lon float64) (sqlc.BuyerProfile, error)
	GetProfileByIDFunc     func(ctx context.Context, id string) (sqlc.BuyerProfile, error)
	GetProfileByUserIDFunc func(ctx context.Context, userID string) (sqlc.BuyerProfile, error)
	UpdateProfileFunc      func(ctx context.Context, id, orgName, buyerType, address, district, state string, lat, lon float64) (sqlc.BuyerProfile, error)
	DeleteProfileFunc      func(ctx context.Context, id string) error
	ListProfilesFunc       func(ctx context.Context, limit, offset int32) ([]sqlc.BuyerProfile, error)
}

func (m *MockBuyerRepository) CreateProfile(ctx context.Context, userID, orgName, buyerType, address, district, state string, lat, lon float64) (sqlc.BuyerProfile, error) {
	return sqlc.BuyerProfile{}, nil
}
func (m *MockBuyerRepository) GetProfileByID(ctx context.Context, id string) (sqlc.BuyerProfile, error) {
	if m.GetProfileByIDFunc != nil {
		return m.GetProfileByIDFunc(ctx, id)
	}
	return sqlc.BuyerProfile{}, nil
}
func (m *MockBuyerRepository) GetProfileByUserID(ctx context.Context, userID string) (sqlc.BuyerProfile, error) {
	if m.GetProfileByUserIDFunc != nil {
		return m.GetProfileByUserIDFunc(ctx, userID)
	}
	return sqlc.BuyerProfile{}, nil
}
func (m *MockBuyerRepository) UpdateProfile(ctx context.Context, id, orgName, buyerType, address, district, state string, lat, lon float64) (sqlc.BuyerProfile, error) {
	return sqlc.BuyerProfile{}, nil
}
func (m *MockBuyerRepository) DeleteProfile(ctx context.Context, id string) error {
	return nil
}
func (m *MockBuyerRepository) ListProfiles(ctx context.Context, limit, offset int32) ([]sqlc.BuyerProfile, error) {
	if m.ListProfilesFunc != nil {
		return m.ListProfilesFunc(ctx, limit, offset)
	}
	return nil, nil
}

func TestCreateRequirement(t *testing.T) {
	authorizer, _ := authz.NewAuthorizer()

	validUserUUID := "11111111-1111-1111-1111-111111111111"

	tests := []struct {
		name          string
		userRole      string
		mockProfile   bool
		expectedError error
	}{
		{
			name:          "Successful creation",
			userRole:      "BUYER",
			mockProfile:   true,
			expectedError: nil,
		},
		{
			name:          "Missing buyer profile",
			userRole:      "BUYER",
			mockProfile:   false,
			expectedError: service.ErrForbidden,
		},
		{
			name:          "Wrong role",
			userRole:      "FARMER",
			mockProfile:   true,
			expectedError: service.ErrForbidden,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			mockReqRepo := &MockRequirementRepository{
				CreateRequirementFunc: func(ctx context.Context, buyerID, cropType string, qty float64, reqFrom, reqUntil time.Time, maxPrice, radius *float64) (sqlc.BuyerRequirement, error) {
					return sqlc.BuyerRequirement{
						ID: pgtype.UUID{Valid: true},
					}, nil
				},
			}

			mockBuyerRepo := &MockBuyerRepository{
				GetProfileByUserIDFunc: func(ctx context.Context, userID string) (sqlc.BuyerProfile, error) {
					if !tc.mockProfile {
						return sqlc.BuyerProfile{}, repository.ErrNotFound
					}
					return sqlc.BuyerProfile{ID: pgtype.UUID{Valid: true}}, nil
				},
			}

			mockUserRepo := &MockUserRepository{
				GetUserByIDFunc: func(ctx context.Context, id string) (sqlc.User, error) {
					return sqlc.User{Role: sqlc.UserRole(tc.userRole)}, nil
				},
			}

			reqService := service.NewRequirementService(mockReqRepo, mockBuyerRepo, mockUserRepo, authorizer)

			ctx := middleware.SetUserToContext(context.Background(), validUserUUID)

			req := dto.CreateRequirementRequest{
				CropType:           "PADDY",
				QuantityRequiredKg: 5000,
				RequiredFrom:       "2023-11-01",
				RequiredUntil:      "2023-11-30",
			}

			_, err := reqService.CreateRequirement(ctx, validUserUUID, req)
			if tc.expectedError != nil {
				if !errors.Is(err, tc.expectedError) {
					t.Errorf("expected error %v, got %v", tc.expectedError, err)
				}
			} else {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
			}
		})
	}
}
