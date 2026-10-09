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
	"github.com/DAbharat/Straw2Cash/internal/repository"
	"github.com/DAbharat/Straw2Cash/internal/service"
)

type MatchingHandler struct {
	matchingService service.MatchingService
}

func NewMatchingHandler(matchingService service.MatchingService) *MatchingHandler {
	return &MatchingHandler{
		matchingService: matchingService,
	}
}

func (h *MatchingHandler) CreateMatch(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	var req dto.CreateMatchRequest

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

	match, err := h.matchingService.CreateMatch(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrValidation):
			httpx.RespondWithError(w, http.StatusBadRequest, err.Error())
		default:
			log.Printf("create match fail: %v", err)
			httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.RespondWithJSON(w, http.StatusCreated, match)
}

func (h *MatchingHandler) GetMatch(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if id == "" {
		httpx.RespondWithError(w, http.StatusBadRequest, "missing match id")
		return
	}

	match, err := h.matchingService.GetMatch(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound), errors.Is(err, service.ErrNotFound):
			httpx.RespondWithError(w, http.StatusNotFound, "match not found")
		case errors.Is(err, service.ErrForbidden):
			httpx.RespondWithError(w, http.StatusForbidden, "forbidden")
		default:
			log.Printf("get match fail: %v", err)
			httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.RespondWithJSON(w, http.StatusOK, match)
}

func (h *MatchingHandler) UpdateMatchStatus(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if id == "" {
		httpx.RespondWithError(w, http.StatusBadRequest, "missing match id")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	var req dto.UpdateMatchStatusRequest

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

	match, err := h.matchingService.UpdateMatchStatus(r.Context(), id, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrValidation):
			httpx.RespondWithError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, repository.ErrNotFound), errors.Is(err, service.ErrNotFound):
			httpx.RespondWithError(w, http.StatusNotFound, "match not found")
		case errors.Is(err, service.ErrForbidden):
			httpx.RespondWithError(w, http.StatusForbidden, "forbidden")
		default:
			log.Printf("update match status fail: %v", err)
			httpx.RespondWithError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.RespondWithJSON(w, http.StatusOK, match)
}
