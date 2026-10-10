package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/DAbharat/Straw2Cash/internal/authz"
	"github.com/DAbharat/Straw2Cash/internal/db"
	"github.com/DAbharat/Straw2Cash/internal/db/sqlc"
	"github.com/DAbharat/Straw2Cash/internal/handler"
	"github.com/DAbharat/Straw2Cash/internal/middleware"
	"github.com/DAbharat/Straw2Cash/internal/repository"
	"github.com/DAbharat/Straw2Cash/internal/router"
	"github.com/DAbharat/Straw2Cash/internal/service"
	"github.com/joho/godotenv"
)

func main() {
	// Initialize context that listens for interrupt signals
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or failed to load, relying on environment variables")
	}

	cfg, err := db.Load()
	if err != nil {
		log.Fatalf("Failed to load database config: %v", err)
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET must be set")
	}

	pool, err := db.New(cfg)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()

	queries := sqlc.New(pool)
	store := repository.NewStore(pool)

	// Repositories
	userRepo := repository.NewUserRepository(queries)
	farmerRepo := repository.NewFarmerRepository(queries)
	buyerRepo := repository.NewBuyerRepository(queries)
	balerRepo := repository.NewBalerRepository(queries)
	listingRepo := repository.NewListingRepository(queries)
	reqRepo := repository.NewRequirementRepository(queries)
	matchRepo := repository.NewMatchRepository(queries)

	// Authorizer
	authorizer, err := authz.NewAuthorizer()
	if err != nil {
		log.Fatalf("Failed to initialize authorizer: %v", err)
	}

	// Services
	userService := service.NewUserService(userRepo)
	farmerService := service.NewFarmerService(farmerRepo, userRepo, authorizer)
	buyerService := service.NewBuyerService(buyerRepo, userRepo, authorizer)
	balerService := service.NewBalerService(balerRepo, userRepo, authorizer)
	listingService := service.NewListingService(listingRepo, farmerRepo, userRepo, authorizer)
	reqService := service.NewRequirementService(reqRepo, buyerRepo, userRepo, authorizer)
	matchingService := service.NewMatchingService(store, matchRepo, listingRepo, reqRepo, farmerRepo, buyerRepo, userRepo, authorizer)

	// Handlers
	authHandler := handler.NewAuthHandler(userService, jwtSecret)
	userHandler := handler.NewUserHandler(userService)
	farmerHandler := handler.NewFarmerHandler(farmerService)
	buyerHandler := handler.NewBuyerHandler(buyerService)
	balerHandler := handler.NewBalerHandler(balerService)
	listingHandler := handler.NewListingHandler(listingService)
	reqHandler := handler.NewRequirementHandler(reqService)
	matchHandler := handler.NewMatchingHandler(matchingService)

	// Middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtSecret)

	// Router
	r := router.New(router.Config{
		AuthHandler:        authHandler,
		UserHandler:        userHandler,
		FarmerHandler:      farmerHandler,
		BuyerHandler:       buyerHandler,
		BalerHandler:       balerHandler,
		ListingHandler:     listingHandler,
		MatchingHandler:    matchHandler,
		RequirementHandler: reqHandler,
		AuthMiddleware:     authMiddleware,
	})

	srv := &http.Server{
		Addr:         ":8080",
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	srvErr := make(chan error, 1)
	go func() {
		log.Println("Starting server on :8080")
		srvErr <- srv.ListenAndServe()
	}()

	select {
	case err := <-srvErr:
		if err != nil && err != http.ErrServerClosed {
			log.Printf("Server error: %v", err)
		}
	case <-ctx.Done():
		log.Println("Shutting down gracefully...")

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Printf("Server forced to shutdown: %v", err)
		}
	}
	log.Println("Server exited properly")
}
