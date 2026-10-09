package dto

type PaginationResponse[T any] struct {
	Data       []T `json:"data"`
	Total      int `json:"total"`
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalPages int `json:"total_pages"`
}

type APIResponse[T any] struct {
	Message string `json:"message,omitempty"`
	Data    T      `json:"data,omitempty"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}
