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
	CreateFunc     func(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error)
	GetByIDFunc    func(ctx context.Context, id pgtype.UUID) (sqlc.User, error)
	GetByEmailFunc func(ctx context.Context, email pgtype.Text) (sqlc.User, error)
	GetByPhoneFunc func(ctx context.Context, phone string) (sqlc.User, error)
	ListFunc       func(ctx context.Context, arg sqlc.ListUsersParams) ([]sqlc.User, error)
	UpdateFunc     func(ctx context.Context, arg sqlc.UpdateUserParams) (sqlc.User, error)
	DeleteFunc     func(ctx context.Context, id pgtype.UUID) error
}

func (m *MockUserRepository) Create(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error) {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, arg)
	}
	return sqlc.User{}, nil
}

func (m *MockUserRepository) GetByID(ctx context.Context, id pgtype.UUID) (sqlc.User, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(ctx, id)
	}
	return sqlc.User{}, nil
}

func (m *MockUserRepository) GetByEmail(ctx context.Context, email pgtype.Text) (sqlc.User, error) {
	if m.GetByEmailFunc != nil {
		return m.GetByEmailFunc(ctx, email)
	}
	return sqlc.User{}, nil
}

func (m *MockUserRepository) GetByPhone(ctx context.Context, phone string) (sqlc.User, error) {
	if m.GetByPhoneFunc != nil {
		return m.GetByPhoneFunc(ctx, phone)
	}
	return sqlc.User{}, nil
}

func (m *MockUserRepository) List(ctx context.Context, arg sqlc.ListUsersParams) ([]sqlc.User, error) {
	if m.ListFunc != nil {
		return m.ListFunc(ctx, arg)
	}
	return nil, nil
}

func (m *MockUserRepository) Update(ctx context.Context, arg sqlc.UpdateUserParams) (sqlc.User, error) {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, arg)
	}
	return sqlc.User{}, nil
}

func (m *MockUserRepository) Delete(ctx context.Context, id pgtype.UUID) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, id)
	}
	return nil
}

func TestCreateUser_Success(t *testing.T) {
	mockRepo := &MockUserRepository{
		CreateFunc: func(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error) {
			return sqlc.User{
				Name:      arg.Name,
				Email:     arg.Email,
				Phone:     arg.Phone,
				Role:      arg.Role,
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
		CreateFunc: func(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error) {
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
