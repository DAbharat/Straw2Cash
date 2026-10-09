package handler

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/DAbharat/Straw2Cash/internal/dto"
	"github.com/DAbharat/Straw2Cash/internal/httpx"
	"github.com/DAbharat/Straw2Cash/internal/middleware"
	"github.com/DAbharat/Straw2Cash/internal/repository"
	"github.com/DAbharat/Straw2Cash/internal/service"
)

type BuyerHandler struct {
	buyerService service.BuyerService
}

func NewBuyerHandler(buyerService service.BuyerService) *BuyerHandler {
	return &BuyerHandler{
		buyerService: buyerService,
	}
}

func (h *BuyerHandler) CreateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		httpx.RespondWithError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	var req dto.CreateBuyerProfileRequest

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

	profile, err := h.buyerService.CreateProfile(r.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrValidation):
			httpx.RespondWithError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, repository.ErrDuplicateProfile), errors.Is(err, service.ErrConflict):
			httpx.RespondWithError(w, http.StatusConflict, err.Error())
		default:
			log.Printf("create buyer profile fail: %v", err)
			httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.RespondWithJSON(w, http.StatusCreated, profile)
}

func (h *BuyerHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if id == "" {
		httpx.RespondWithError(w, http.StatusBadRequest, "missing profile id")
		return
	}

	profile, err := h.buyerService.GetProfile(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound), errors.Is(err, service.ErrNotFound):
			httpx.RespondWithError(w, http.StatusNotFound, "profile not found")
		case errors.Is(err, service.ErrForbidden):
			httpx.RespondWithError(w, http.StatusForbidden, "forbidden")
		case errors.Is(err, service.ErrValidation):
			httpx.RespondWithError(w, http.StatusBadRequest, err.Error())
		default:
			log.Printf("get buyer profile fail: %v", err)
			httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.RespondWithJSON(w, http.StatusOK, profile)
}

func (h *BuyerHandler) GetMyProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		httpx.RespondWithError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	profile, err := h.buyerService.GetProfileByUserID(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound), errors.Is(err, service.ErrNotFound):
			httpx.RespondWithError(w, http.StatusNotFound, "profile not found")
		default:
			log.Printf("get my buyer profile fail: %v", err)
			httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.RespondWithJSON(w, http.StatusOK, profile)
}

func (h *BuyerHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		httpx.RespondWithError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	var req dto.UpdateBuyerProfileRequest

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

	profile, err := h.buyerService.UpdateProfile(r.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrValidation):
			httpx.RespondWithError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, repository.ErrNotFound), errors.Is(err, service.ErrNotFound):
			httpx.RespondWithError(w, http.StatusNotFound, "profile not found")
		case errors.Is(err, service.ErrForbidden):
			httpx.RespondWithError(w, http.StatusForbidden, "forbidden")
		default:
			log.Printf("update buyer profile fail: %v", err)
			httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.RespondWithJSON(w, http.StatusOK, profile)
}
