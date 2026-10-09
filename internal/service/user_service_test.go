package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/repository"
	"github.com/DAbharat/Straw2Cash/internal/service"
	"github.com/jackc/pgx/v5/pgtype"
)

// MockUserRepository implements repository.UserRepository for testing
type MockUserRepository struct {
	CreateUserFunc     func(ctx context.Context, name, email, phone, passwordHash, role string) (sqlc.User, error)
	GetUserByIDFunc    func(ctx context.Context, id string) (sqlc.User, error)
	GetUserByEmailFunc func(ctx context.Context, email string) (sqlc.User, error)
	GetUserByPhoneFunc func(ctx context.Context, phone string) (sqlc.User, error)
	ListUsersFunc      func(ctx context.Context, limit, offset int32) ([]sqlc.User, error)
	UpdateUserFunc     func(ctx context.Context, id, name, email, phone, passwordHash, role string) (sqlc.User, error)
	DeleteUserFunc     func(ctx context.Context, id string) error
}

func (m *MockUserRepository) CreateUser(ctx context.Context, name, email, phone, passwordHash, role string) (sqlc.User, error) {
	if m.CreateUserFunc != nil {
		return m.CreateUserFunc(ctx, name, email, phone, passwordHash, role)
	}
	return sqlc.User{}, nil
}

func (m *MockUserRepository) GetUserByID(ctx context.Context, id string) (sqlc.User, error) {
	if m.GetUserByIDFunc != nil {
		return m.GetUserByIDFunc(ctx, id)
	}
	return sqlc.User{}, nil
}

func (m *MockUserRepository) GetUserByEmail(ctx context.Context, email string) (sqlc.User, error) {
	if m.GetUserByEmailFunc != nil {
		return m.GetUserByEmailFunc(ctx, email)
	}
	return sqlc.User{}, nil
}

func (m *MockUserRepository) GetUserByPhone(ctx context.Context, phone string) (sqlc.User, error) {
	if m.GetUserByPhoneFunc != nil {
		return m.GetUserByPhoneFunc(ctx, phone)
	}
	return sqlc.User{}, nil
}

func (m *MockUserRepository) ListUsers(ctx context.Context, limit, offset int32) ([]sqlc.User, error) {
	if m.ListUsersFunc != nil {
		return m.ListUsersFunc(ctx, limit, offset)
	}
	return nil, nil
}

func (m *MockUserRepository) UpdateUser(ctx context.Context, id, name, email, phone, passwordHash, role string) (sqlc.User, error) {
	if m.UpdateUserFunc != nil {
		return m.UpdateUserFunc(ctx, id, name, email, phone, passwordHash, role)
	}
	return sqlc.User{}, nil
}

func (m *MockUserRepository) DeleteUser(ctx context.Context, id string) error {
	if m.DeleteUserFunc != nil {
		return m.DeleteUserFunc(ctx, id)
	}
	return nil
}

func TestCreateUser_Success(t *testing.T) {
	mockRepo := &MockUserRepository{
		CreateUserFunc: func(ctx context.Context, name, email, phone, passwordHash, role string) (sqlc.User, error) {
			return sqlc.User{
				Name:      name,
				Email:     pgtype.Text{String: email, Valid: email != ""},
				Phone:     phone,
				Role:      sqlc.UserRole(role),
				IsActive:  true,
				CreatedAt: pgtype.Timestamptz{Time: time.Now(), Valid: true},
			}, nil
		},
	}

	userService := service.NewUserService(mockRepo)

	req := dto.RegisterRequest{
		Name:     "Test User",
		Phone:    "1234567890",
		Password: "password123",
		Role:     "FARMER",
	}

	res, err := userService.CreateUser(context.Background(), req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if res.Name != "Test User" {
		t.Errorf("expected name 'Test User', got '%s'", res.Name)
	}
}

func TestCreateUser_ValidationFailure(t *testing.T) {
	userService := service.NewUserService(&MockUserRepository{})

	req := dto.RegisterRequest{
		Name: "", // Missing required field
	}

	_, err := userService.CreateUser(context.Background(), req)
	if err == nil {
		t.Fatal("expected validation error, got none")
	}

	if !errors.Is(err, service.ErrValidation) {
		t.Errorf("expected ErrValidation, got %v", err)
	}
}

func TestCreateUser_Conflict(t *testing.T) {
	mockRepo := &MockUserRepository{
		CreateUserFunc: func(ctx context.Context, name, email, phone, passwordHash, role string) (sqlc.User, error) {
			return sqlc.User{}, repository.ErrDuplicatePhone
		},
	}

	userService := service.NewUserService(mockRepo)

	req := dto.RegisterRequest{
		Name:     "Test User",
		Phone:    "1234567890",
		Password: "password123",
		Role:     "FARMER",
	}

	_, err := userService.CreateUser(context.Background(), req)
	if err == nil {
		t.Fatal("expected conflict error, got none")
	}

	if !errors.Is(err, service.ErrConflict) {
		t.Errorf("expected ErrConflict, got %v", err)
	}
}
