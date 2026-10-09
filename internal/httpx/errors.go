package httpx

import (
	"errors"
	"net/http"

	"github.com/DAbharat/Straw2Cash/internal/service"
)

// ErrorResponse represents a structured error response
type ErrorResponse struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// RespondWithDomainError maps service domain errors to HTTP status codes
func RespondWithDomainError(w http.ResponseWriter, err error) {
	var statusCode int
	var code string
	var message = err.Error()

	switch {
	case errors.Is(err, service.ErrValidation):
		statusCode = http.StatusBadRequest
		code = "VALIDATION_ERROR"
	case errors.Is(err, service.ErrUnauthorized):
		statusCode = http.StatusUnauthorized
		code = "UNAUTHORIZED"
	case errors.Is(err, service.ErrForbidden):
		statusCode = http.StatusForbidden
		code = "FORBIDDEN"
	case errors.Is(err, service.ErrNotFound):
		statusCode = http.StatusNotFound
		code = "RESOURCE_NOT_FOUND"
	case errors.Is(err, service.ErrConflict):
		statusCode = http.StatusConflict
		code = "CONFLICT"
	case errors.Is(err, service.ErrInvalidState):
		statusCode = http.StatusBadRequest
		code = "INVALID_STATE"
	default:
		statusCode = http.StatusInternalServerError
		code = "INTERNAL_SERVER_ERROR"
		message = "An unexpected error occurred"
	}

	response := ErrorResponse{}
	response.Error.Code = code
	response.Error.Message = message

	RespondWithJSON(w, statusCode, response)
}
