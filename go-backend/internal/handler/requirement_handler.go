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

type RequirementHandler struct {
	requirementService service.RequirementService
}

func NewRequirementHandler(requirementService service.RequirementService) *RequirementHandler {
	return &RequirementHandler{
		requirementService: requirementService,
	}
}

func (h *RequirementHandler) CreateRequirement(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		httpx.RespondWithError(w, http.StatusUnauthorized, "missing user context")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	var req dto.CreateRequirementRequest

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

	reqResp, err := h.requirementService.CreateRequirement(r.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrValidation):
			httpx.RespondWithError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, service.ErrForbidden):
			httpx.RespondWithError(w, http.StatusForbidden, "forbidden")
		default:
			log.Printf("create requirement fail: %v", err)
			httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.RespondWithJSON(w, http.StatusCreated, reqResp)
}

func (h *RequirementHandler) GetRequirement(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if id == "" {
		httpx.RespondWithError(w, http.StatusBadRequest, "missing requirement id")
		return
	}

	reqResp, err := h.requirementService.GetRequirement(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound), errors.Is(err, service.ErrNotFound):
			httpx.RespondWithError(w, http.StatusNotFound, "requirement not found")
		case errors.Is(err, service.ErrForbidden):
			httpx.RespondWithError(w, http.StatusForbidden, "forbidden")
		case errors.Is(err, service.ErrValidation):
			httpx.RespondWithError(w, http.StatusBadRequest, err.Error())
		default:
			log.Printf("get requirement fail: %v", err)
			httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.RespondWithJSON(w, http.StatusOK, reqResp)
}

func (h *RequirementHandler) ListRequirements(w http.ResponseWriter, r *http.Request) {
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

	reqs, err := h.requirementService.ListRequirements(r.Context(), status, limit, offset)
	if err != nil {
		log.Printf("list requirements fail: %v", err)
		httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	httpx.RespondWithJSON(w, http.StatusOK, reqs)
}

func (h *RequirementHandler) UpdateRequirementStatus(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if id == "" {
		httpx.RespondWithError(w, http.StatusBadRequest, "missing requirement id")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	var req dto.UpdateRequirementStatusRequest

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

	reqResp, err := h.requirementService.UpdateRequirementStatus(r.Context(), id, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrValidation):
			httpx.RespondWithError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, repository.ErrNotFound), errors.Is(err, service.ErrNotFound):
			httpx.RespondWithError(w, http.StatusNotFound, "requirement not found")
		case errors.Is(err, service.ErrForbidden):
			httpx.RespondWithError(w, http.StatusForbidden, "forbidden")
		default:
			log.Printf("update requirement status fail: %v", err)
			httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.RespondWithJSON(w, http.StatusOK, reqResp)
}
