package middleware

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const ClaimsContextKey contextKey = "claims"

type statusRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (r *statusRecorder) WriteHeader(statusCode int) {
	r.statusCode = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		recorder := &statusRecorder{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}
		next.ServeHTTP(recorder, r)
		duration := time.Since(start)
		slog.Info("request completed",
			"method", r.Method,
			"path", r.URL.Path,
			"status", recorder.statusCode,
			"duration", duration,
		)
	})
}

func CORS(next http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := os.Getenv("CORS_ORIGIN")
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE, PATCH")
		w.Header().Set("Access-Control-Max-Age", "86400")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	}
}

func Auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"missing token"}`, http.StatusUnauthorized)
			return
		}
		const bearerPrefix = "Bearer "
		if len(authHeader) < len(bearerPrefix) || authHeader[:len(bearerPrefix)] != bearerPrefix {
			http.Error(w, `{"error":"invalid authorization header"}`, http.StatusUnauthorized)
			return
		}
		jwtStr := authHeader[len(bearerPrefix):]
		key := []byte(os.Getenv("SECRET_KEY"))
		token, err := jwt.Parse(jwtStr, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return key, nil
		})
		if err != nil || !token.Valid {
			http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, `{"error":"invalid claims"}`, http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), ClaimsContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func GetClaims(ctx context.Context) (jwt.MapClaims, error) {
	claims, ok := ctx.Value(ClaimsContextKey).(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("no claims in context")
	}
	return claims, nil
}

func GetUserID(ctx context.Context) (string, error) {
	claims, err := GetClaims(ctx)
	if err != nil {
		return "", err
	}
	sub, ok := claims["sub"].(string)
	if !ok || sub == "" {
		return "", fmt.Errorf("invalid sub claim")
	}
	return sub, nil
}
