package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/service"
)

type mockUserService struct {
	loginFunc func(ctx context.Context, phone, password string) (dto.UserResponse, error)
}

func (m *mockUserService) CreateUser(ctx context.Context, req dto.RegisterRequest) (dto.UserResponse, error) {
	return dto.UserResponse{}, nil
}

func (m *mockUserService) GetUser(ctx context.Context, id string) (dto.UserResponse, error) {
	return dto.UserResponse{}, nil
}

func (m *mockUserService) GetUserByPhone(ctx context.Context, phone string) (dto.UserResponse, error) {
	return dto.UserResponse{}, nil
}

func (m *mockUserService) Login(ctx context.Context, phone, password string) (dto.UserResponse, error) {
	if m.loginFunc != nil {
		return m.loginFunc(ctx, phone, password)
	}
	return dto.UserResponse{ID: "mock-id"}, nil
}

func (m *mockUserService) UpdateUser(ctx context.Context, id string, req dto.UpdateUserRequest) (dto.UserResponse, error) {
	return dto.UserResponse{ID: id}, nil
}


func TestAuthHandler_Login_Success(t *testing.T) {
	mockSvc := &mockUserService{
		loginFunc: func(ctx context.Context, phone, password string) (dto.UserResponse, error) {
			return dto.UserResponse{ID: "mock-id", Phone: phone}, nil
		},
	}
	h := NewAuthHandler(mockSvc, "secret")

	reqBody, _ := json.Marshal(dto.LoginRequest{Phone: "1234567890", Password: "password"})
	req := httptest.NewRequest(http.MethodPost, "/api/login", bytes.NewBuffer(reqBody))
	rr := httptest.NewRecorder()

	h.Login(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var res dto.AuthResponse
	if err := json.NewDecoder(rr.Body).Decode(&res); err != nil {
		t.Fatal(err)
	}
	if res.Token == "" {
		t.Error("expected non-empty token")
	}
}

func TestAuthHandler_Login_MalformedJSON(t *testing.T) {
	mockSvc := &mockUserService{}
	h := NewAuthHandler(mockSvc, "secret")

	req := httptest.NewRequest(http.MethodPost, "/api/login", bytes.NewBufferString("{invalid json"))
	rr := httptest.NewRecorder()

	h.Login(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

func TestAuthHandler_Login_Unauthorized(t *testing.T) {
	mockSvc := &mockUserService{
		loginFunc: func(ctx context.Context, phone, password string) (dto.UserResponse, error) {
			return dto.UserResponse{}, service.ErrUnauthorized
		},
	}
	h := NewAuthHandler(mockSvc, "secret")

	reqBody, _ := json.Marshal(dto.LoginRequest{Phone: "1234567890", Password: "wrong"})
	req := httptest.NewRequest(http.MethodPost, "/api/login", bytes.NewBuffer(reqBody))
	rr := httptest.NewRecorder()

	h.Login(rr, req)

	if status := rr.Code; status != http.StatusUnauthorized {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusUnauthorized)
	}
}
