package repository

import (
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

var (
	ErrNotFound            = errors.New("record not found")
	ErrDuplicateEmail      = errors.New("email already exists")
	ErrDuplicatePhone      = errors.New("phone number already exists")
	ErrDuplicateProfile    = errors.New("user already has this profile type")
	ErrForeignKeyViolation = errors.New("foreign key violation (referenced record does not exist)")
	ErrCheckViolation      = errors.New("database check constraint failed")
	ErrUniqueViolation     = errors.New("unique constraint violation")
)

// handleError inspects a database error and translates it into a domain-specific error
func handleError(err error) error {
	if err == nil {
		return nil
	}

	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505": // unique_violation
			switch pgErr.ConstraintName {
			case "users_email_key":
				return ErrDuplicateEmail
			case "users_phone_key":
				return ErrDuplicatePhone
			case "farmer_profiles_user_id_key", "buyer_profiles_user_id_key", "baler_profiles_user_id_key":
				return ErrDuplicateProfile
			default:
				return ErrUniqueViolation
			}
		case "23503": // foreign_key_violation
			return ErrForeignKeyViolation
		case "23514": // check_violation
			return ErrCheckViolation
		}
	}

	return err
}
