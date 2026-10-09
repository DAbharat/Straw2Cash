package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"
)

type contextKey string

const userIDKey contextKey = "userID"

type AuthMiddleware struct {
	jwtSecret string
}

func NewAuthMiddleware(secret string) *AuthMiddleware {
	return &AuthMiddleware{
		jwtSecret: secret,
	}
}

func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
			return
		}

		parts := strings.Fields(authHeader)
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, `{"error":"invalid authorization header"}`, http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		claims, err := ParseToken(tokenString, m.jwtSecret)
		if err != nil {
			switch {
			case errors.Is(err, ErrExpiredToken):
				http.Error(w, `{"error":"token expired"}`, http.StatusUnauthorized)
			default:
				http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
			}
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetUserFromContext(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(userIDKey).(string)
	if !ok {
		return "", false
	}
	return userID, true
}

func SetUserToContext(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}
