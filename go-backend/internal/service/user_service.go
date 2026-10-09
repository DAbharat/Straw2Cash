package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	CreateUser(ctx context.Context, req dto.RegisterRequest) (dto.UserResponse, error)
	GetUser(ctx context.Context, id string) (dto.UserResponse, error)
	GetUserByPhone(ctx context.Context, phone string) (dto.UserResponse, error)
	Login(ctx context.Context, phone, password string) (dto.UserResponse, error)
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

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return dto.UserResponse{}, fmt.Errorf("%w: failed to hash password: %v", ErrInternal, err)
	}

	user, err := s.userRepo.CreateUser(ctx, req.Name, req.Email, req.Phone, string(hashedPassword), req.Role)
	if err != nil {
		if errorsIsDuplicate(err) {
			return dto.UserResponse{}, fmt.Errorf("%w: %v", ErrConflict, err)
		}
		return dto.UserResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapUserResponse(user), nil
}

func (s *userService) GetUser(ctx context.Context, id string) (dto.UserResponse, error) {
	user, err := s.userRepo.GetUserByID(ctx, id)
	if err != nil {
		if errorsIsNotFound(err) {
			return dto.UserResponse{}, ErrNotFound
		}
		return dto.UserResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapUserResponse(user), nil
}

func (s *userService) GetUserByPhone(ctx context.Context, phone string) (dto.UserResponse, error) {
	user, err := s.userRepo.GetUserByPhone(ctx, phone)
	if err != nil {
		if errorsIsNotFound(err) {
			return dto.UserResponse{}, ErrNotFound
		}
		return dto.UserResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	return mapUserResponse(user), nil
}

func (s *userService) Login(ctx context.Context, phone, password string) (dto.UserResponse, error) {
	user, err := s.userRepo.GetUserByPhone(ctx, phone)
	if err != nil {
		if errorsIsNotFound(err) {
			return dto.UserResponse{}, ErrUnauthorized
		}
		return dto.UserResponse{}, fmt.Errorf("%w: %v", ErrInternal, err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return dto.UserResponse{}, ErrUnauthorized
	}

	return mapUserResponse(user), nil
}

func mapUserResponse(user sqlc.User) dto.UserResponse {
	return dto.UserResponse{
		ID:        pgUUIDToStr(user.ID.Bytes),
		Name:      user.Name,
		Email:     user.Email.String,
		Phone:     user.Phone,
		Role:      string(user.Role),
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt.Time,
	}
}

// Helpers

func pgUUIDToStr(b [16]byte) string {
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
