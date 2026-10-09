package router

import (
	"net/http"

	"github.com/DAbharat/Straw2Cash/internal/handler"
	"github.com/DAbharat/Straw2Cash/internal/middleware"
	"github.com/gorilla/mux"
)

type Config struct {
	AuthHandler        *handler.AuthHandler
	UserHandler        *handler.UserHandler
	FarmerHandler      *handler.FarmerHandler
	BuyerHandler       *handler.BuyerHandler
	BalerHandler       *handler.BalerHandler
	ListingHandler     *handler.ListingHandler
	MatchingHandler    *handler.MatchingHandler
	RequirementHandler *handler.RequirementHandler
	AuthMiddleware     *middleware.AuthMiddleware
}

func New(cfg Config) *mux.Router {
	r := mux.NewRouter()

	// Public routes
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}).Methods(http.MethodGet)

	api := r.PathPrefix("/api/v1").Subrouter()

	authGroup := api.PathPrefix("/auth").Subrouter()
	authGroup.HandleFunc("/register", cfg.AuthHandler.Register).Methods(http.MethodPost)
	authGroup.HandleFunc("/login", cfg.AuthHandler.Login).Methods(http.MethodPost)

	// Protected routes
	protected := api.PathPrefix("").Subrouter()
	protected.Use(cfg.AuthMiddleware.Authenticate)

	userGroup := protected.PathPrefix("/users").Subrouter()
	userGroup.HandleFunc("/me", cfg.UserHandler.GetMe).Methods(http.MethodGet)
	userGroup.HandleFunc("/{id:[a-zA-Z0-9-]+}", cfg.UserHandler.GetUser).Methods(http.MethodGet)

	farmerGroup := protected.PathPrefix("/farmers").Subrouter()
	farmerGroup.HandleFunc("/profile", cfg.FarmerHandler.CreateProfile).Methods(http.MethodPost)
	farmerGroup.HandleFunc("/profile/me", cfg.FarmerHandler.GetMyProfile).Methods(http.MethodGet)
	farmerGroup.HandleFunc("/profile", cfg.FarmerHandler.UpdateProfile).Methods(http.MethodPut)
	farmerGroup.HandleFunc("/profile/{id:[a-zA-Z0-9-]+}", cfg.FarmerHandler.GetProfile).Methods(http.MethodGet)

	buyerGroup := protected.PathPrefix("/buyers").Subrouter()
	buyerGroup.HandleFunc("/profile", cfg.BuyerHandler.CreateProfile).Methods(http.MethodPost)
	buyerGroup.HandleFunc("/profile/me", cfg.BuyerHandler.GetMyProfile).Methods(http.MethodGet)
	buyerGroup.HandleFunc("/profile", cfg.BuyerHandler.UpdateProfile).Methods(http.MethodPut)
	buyerGroup.HandleFunc("/profile/{id:[a-zA-Z0-9-]+}", cfg.BuyerHandler.GetProfile).Methods(http.MethodGet)

	balerGroup := protected.PathPrefix("/balers").Subrouter()
	balerGroup.HandleFunc("/profile", cfg.BalerHandler.CreateProfile).Methods(http.MethodPost)
	balerGroup.HandleFunc("/profile/me", cfg.BalerHandler.GetMyProfile).Methods(http.MethodGet)
	balerGroup.HandleFunc("/profile", cfg.BalerHandler.UpdateProfile).Methods(http.MethodPut)
	balerGroup.HandleFunc("/profile/{id:[a-zA-Z0-9-]+}", cfg.BalerHandler.GetProfile).Methods(http.MethodGet)

	listingGroup := protected.PathPrefix("/listings").Subrouter()
	listingGroup.HandleFunc("", cfg.ListingHandler.CreateListing).Methods(http.MethodPost)
	listingGroup.HandleFunc("", cfg.ListingHandler.ListListings).Methods(http.MethodGet)
	listingGroup.HandleFunc("/{id:[a-zA-Z0-9-]+}", cfg.ListingHandler.GetListing).Methods(http.MethodGet)
	listingGroup.HandleFunc("/{id:[a-zA-Z0-9-]+}/status", cfg.ListingHandler.UpdateListingStatus).Methods(http.MethodPut)

	reqGroup := protected.PathPrefix("/requirements").Subrouter()
	reqGroup.HandleFunc("", cfg.RequirementHandler.CreateRequirement).Methods(http.MethodPost)
	reqGroup.HandleFunc("", cfg.RequirementHandler.ListRequirements).Methods(http.MethodGet)
	reqGroup.HandleFunc("/{id:[a-zA-Z0-9-]+}", cfg.RequirementHandler.GetRequirement).Methods(http.MethodGet)
	reqGroup.HandleFunc("/{id:[a-zA-Z0-9-]+}/status", cfg.RequirementHandler.UpdateRequirementStatus).Methods(http.MethodPut)

	matchGroup := protected.PathPrefix("/matches").Subrouter()
	matchGroup.HandleFunc("", cfg.MatchingHandler.CreateMatch).Methods(http.MethodPost)
	matchGroup.HandleFunc("/{id:[a-zA-Z0-9-]+}", cfg.MatchingHandler.GetMatch).Methods(http.MethodGet)
	matchGroup.HandleFunc("/{id:[a-zA-Z0-9-]+}/status", cfg.MatchingHandler.UpdateMatchStatus).Methods(http.MethodPut)

	// Handle 404
	r.NotFoundHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{"error":"not found"}`))
	})

	// Handle 405
	r.MethodNotAllowedHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Write([]byte(`{"error":"method not allowed"}`))
	})

	return r
}
