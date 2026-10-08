package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
)

type UserService interface {
	CreateUser(ctx context.Context, req dto.RegisterRequest) (dto.UserResponse, error)
	GetUser(ctx context.Context, id string) (dto.UserResponse, error)
	GetUserByPhone(ctx context.Context, phone string) (dto.UserResponse, error)
}

type userService struct {
	userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{
		userRepo: userRepo,
	}
}

func (s *userService) CreateUser(ctx context.Context, req dto.RegisterRequest) (dto.UserResponse, error) {
	// Business validation
	if req.Phone == "" || req.Password == "" || req.Name == "" || req.Role == "" {
		return dto.UserResponse{}, fmt.Errorf("%w: missing required fields", ErrValidation)
	}

	arg := sqlc.CreateUserParams{
		Name:         req.Name,
		Email:        toPgText(req.Email),
		Phone:        req.Phone,
		PasswordHash: req.Password, // In a real app, hash this using bcrypt
		Role:         sqlc.UserRole(req.Role),
	}

	user, err := s.userRepo.Create(ctx, arg)
	if err != nil {
		if errorsIsDuplicate(err) {
			return dto.UserResponse{}, fmt.Errorf("%w: %v", ErrConflict, err)
		}
		return dto.UserResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapUserResponse(user), nil
}

func (s *userService) GetUser(ctx context.Context, id string) (dto.UserResponse, error) {
	uuid, err := parseUUID(id)
	if err != nil {
		return dto.UserResponse{}, fmt.Errorf("%w: invalid user ID", ErrValidation)
	}

	user, err := s.userRepo.GetByID(ctx, uuid)
	if err != nil {
		if errorsIsNotFound(err) {
			return dto.UserResponse{}, ErrNotFound
		}
		return dto.UserResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapUserResponse(user), nil
}

func (s *userService) GetUserByPhone(ctx context.Context, phone string) (dto.UserResponse, error) {
	user, err := s.userRepo.GetByPhone(ctx, phone)
	if err != nil {
		if errorsIsNotFound(err) {
			return dto.UserResponse{}, ErrNotFound
		}
		return dto.UserResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapUserResponse(user), nil
}

func mapUserResponse(user sqlc.User) dto.UserResponse {
	return dto.UserResponse{
		ID:        pgUUIDToStr(user.ID),
		Name:      user.Name,
		Email:     user.Email.String,
		Phone:     user.Phone,
		Role:      string(user.Role),
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt.Time,
	}
}

// Helpers

func toPgText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: s, Valid: true}
}

func parseUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	err := u.Scan(s)
	return u, err
}

func pgUUIDToStr(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	// Extract bytes and format as UUID
	b := u.Bytes
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

func errorsIsNotFound(err error) bool {
	return errors.Is(err, repository.ErrNotFound)
}

func errorsIsDuplicate(err error) bool {
	return errors.Is(err, repository.ErrDuplicateEmail) ||
		errors.Is(err, repository.ErrDuplicatePhone) ||
		errors.Is(err, repository.ErrUniqueViolation)
}
