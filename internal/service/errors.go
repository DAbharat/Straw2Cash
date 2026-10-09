package service

import "errors"

var (
	ErrValidation   = errors.New("validation error")
	ErrNotFound     = errors.New("resource not found")
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
	ErrConflict     = errors.New("resource conflict")
	ErrInvalidState = errors.New("invalid resource state")
	ErrInternal     = errors.New("internal application error")
)
