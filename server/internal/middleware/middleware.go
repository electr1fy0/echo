package middleware

import (
	"context"
	"fmt"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

var key = []byte("supersecretkey")

func CORS(next http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	}
}

func Auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("jwt-auth")
		if err != nil {
			fmt.Println("Auth Middleware: Missing Cookie", err)
			http.Error(w, "missing token", http.StatusUnauthorized)
			return
		}
		jwtStr := cookie.Value
		token, err := jwt.Parse(jwtStr, func(t *jwt.Token) (any, error) {
			return key, nil
		})

		if err != nil || !token.Valid {
			fmt.Println("Auth Middleware: Invalid Token", err)
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			fmt.Println("Auth Middleware: Invalid Claims")
			http.Error(w, "invalid claims", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "claims", claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
