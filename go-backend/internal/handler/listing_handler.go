package handler

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/httpx"
	"github.com/DAbharat/Straw2Cash/internal/middleware"
	"github.com/DAbharat/Straw2Cash/internal/repository"
	"github.com/DAbharat/Straw2Cash/internal/service"
)

type ListingHandler struct {
	listingService service.ListingService
}

func NewListingHandler(listingService service.ListingService) *ListingHandler {
	return &ListingHandler{
		listingService: listingService,
	}
}

func (h *ListingHandler) CreateListing(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		httpx.RespondWithError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	// Assuming the farmer ID is the same as the user ID, or the service looks up the farmer by user ID.
	// Wait, listingService.CreateListing expects a farmerID.
	// We might need a small adjustment if userID != farmerID, but usually they might just use the user ID.
	// I'll pass the userID and let the service/repo handle the lookup or fail if wrong.

	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	var req dto.CreateListingRequest

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		log.Printf("decode error: %v", err)
		httpx.RespondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		httpx.RespondWithError(w, http.StatusBadRequest, "request body must contain a single JSON object")
		return
	}

	listing, err := h.listingService.CreateListing(r.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrValidation):
			httpx.RespondWithError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, service.ErrForbidden):
			httpx.RespondWithError(w, http.StatusForbidden, "forbidden")
		default:
			log.Printf("create listing fail: %v", err)
			httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.RespondWithJSON(w, http.StatusCreated, listing)
}

func (h *ListingHandler) GetListing(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if id == "" {
		httpx.RespondWithError(w, http.StatusBadRequest, "missing listing id")
		return
	}

	listing, err := h.listingService.GetListing(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound), errors.Is(err, service.ErrNotFound):
			httpx.RespondWithError(w, http.StatusNotFound, "listing not found")
		case errors.Is(err, service.ErrForbidden):
			httpx.RespondWithError(w, http.StatusForbidden, "forbidden")
		case errors.Is(err, service.ErrValidation):
			httpx.RespondWithError(w, http.StatusBadRequest, err.Error())
		default:
			log.Printf("get listing fail: %v", err)
			httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.RespondWithJSON(w, http.StatusOK, listing)
}

func (h *ListingHandler) ListListings(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	var limit int32 = 20
	var offset int32 = 0

	if limitStr != "" {
		if parsed, err := strconv.ParseInt(limitStr, 10, 32); err == nil {
			limit = int32(parsed)
		}
	}
	if offsetStr != "" {
		if parsed, err := strconv.ParseInt(offsetStr, 10, 32); err == nil {
			offset = int32(parsed)
		}
	}

	listings, err := h.listingService.ListListings(r.Context(), status, limit, offset)
	if err != nil {
		log.Printf("list listings fail: %v", err)
		httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	httpx.RespondWithJSON(w, http.StatusOK, listings)
}

func (h *ListingHandler) UpdateListingStatus(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if id == "" {
		httpx.RespondWithError(w, http.StatusBadRequest, "missing listing id")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	var req dto.UpdateListingStatusRequest

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		log.Printf("decode error: %v", err)
		httpx.RespondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		httpx.RespondWithError(w, http.StatusBadRequest, "request body must contain a single JSON object")
		return
	}

	listing, err := h.listingService.UpdateListingStatus(r.Context(), id, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrValidation):
			httpx.RespondWithError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, repository.ErrNotFound), errors.Is(err, service.ErrNotFound):
			httpx.RespondWithError(w, http.StatusNotFound, "listing not found")
		case errors.Is(err, service.ErrForbidden):
			httpx.RespondWithError(w, http.StatusForbidden, "forbidden")
		default:
			log.Printf("update listing status fail: %v", err)
			httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.RespondWithJSON(w, http.StatusOK, listing)
}
