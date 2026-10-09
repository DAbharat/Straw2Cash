package router_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/handler"
	"github.com/DAbharat/Straw2Cash/internal/middleware"
	"github.com/DAbharat/Straw2Cash/internal/router"
	"github.com/DAbharat/Straw2Cash/internal/service"
)

// Minimal mock for UserService
type MockUserService struct{}

func (m *MockUserService) CreateUser(ctx context.Context, req dto.RegisterRequest) (dto.UserResponse, error) {
	return dto.UserResponse{}, nil
}
func (m *MockUserService) GetUser(ctx context.Context, id string) (dto.UserResponse, error) {
	return dto.UserResponse{}, nil
}
func (m *MockUserService) GetUserByPhone(ctx context.Context, phone string) (dto.UserResponse, error) {
	return dto.UserResponse{}, nil
}
func (m *MockUserService) Login(ctx context.Context, phone, password string) (dto.UserResponse, error) {
	return dto.UserResponse{}, nil
}

// Dummy mocks for others just to prevent panics during handler method binding
type MockFarmerService struct{ service.FarmerService }
type MockBuyerService struct{ service.BuyerService }
type MockBalerService struct{ service.BalerService }
type MockListingService struct{ service.ListingService }
type MockMatchingService struct{ service.MatchingService }
type MockReqService struct{ service.RequirementService }

func setupRouter() *router.Config {
	userService := &MockUserService{}
	farmerService := &MockFarmerService{}
	buyerService := &MockBuyerService{}
	balerService := &MockBalerService{}
	listingService := &MockListingService{}
	matchingService := &MockMatchingService{}
	reqService := &MockReqService{}

	return &router.Config{
		AuthHandler:        handler.NewAuthHandler(userService, "test-secret"),
		UserHandler:        handler.NewUserHandler(userService),
		FarmerHandler:      handler.NewFarmerHandler(farmerService),
		BuyerHandler:       handler.NewBuyerHandler(buyerService),
		BalerHandler:       handler.NewBalerHandler(balerService),
		ListingHandler:     handler.NewListingHandler(listingService),
		MatchingHandler:    handler.NewMatchingHandler(matchingService),
		RequirementHandler: handler.NewRequirementHandler(reqService),
		AuthMiddleware:     middleware.NewAuthMiddleware("test-secret"),
	}
}

func TestRouter_PublicRoutes(t *testing.T) {
	cfg := setupRouter()
	r := router.New(*cfg)

	tests := []struct {
		name           string
		method         string
		path           string
		expectedStatus int
	}{
		{"Health Check GET", "GET", "/health", http.StatusOK},
		{"Health Check POST Disallowed", "POST", "/health", http.StatusMethodNotAllowed},
		{"Not Found Route", "GET", "/invalid-route-that-does-not-exist", http.StatusNotFound},
		{"Auth Register POST", "POST", "/api/v1/auth/register", http.StatusCreated}, // Will return 201 because mock service returns nil error
		{"Auth Login POST", "POST", "/api/v1/auth/login", http.StatusOK},            // 200 because mock service returns nil error
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req, _ := http.NewRequest(tc.method, tc.path, strings.NewReader("{}"))
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != tc.expectedStatus {
				t.Errorf("expected status %d, got %d", tc.expectedStatus, w.Code)
			}
		})
	}
}

func TestRouter_ProtectedRoutes(t *testing.T) {
	cfg := setupRouter()
	r := router.New(*cfg)

	// Since we don't provide a Bearer token, these should all return 401 Unauthorized
	tests := []struct {
		name   string
		method string
		path   string
	}{
		{"Get Me", "GET", "/api/v1/users/me"},
		{"Get User", "GET", "/api/v1/users/123"},
		{"Create Farmer", "POST", "/api/v1/farmers/profile"},
		{"Get Listing", "GET", "/api/v1/listings/abc"},
		{"Create Match", "POST", "/api/v1/matches"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req, _ := http.NewRequest(tc.method, tc.path, strings.NewReader("{}"))
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != http.StatusUnauthorized {
				t.Errorf("expected status %d, got %d", http.StatusUnauthorized, w.Code)
			}
		})
	}
}
