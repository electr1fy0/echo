package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func (h *APIHandler) GetUser(w http.ResponseWriter, r *http.Request) {

}

func (h *APIHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)

	var profile Profile
	json.NewDecoder(r.Body).Decode(&profile)

	_, err := h.DB.Exec(ctx, "update users set email = $1, bio = $2, avatar = $3 where username = $4", profile.Email, profile.Bio, profile.Avatar, sub)
	if err != nil {
		h.respondWithError(w, "failed to update profile"+err.Error(), err, http.StatusInternalServerError)
		return
	}
}

func (h *APIHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)

	defer cancel()
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)
	fmt.Println(sub)
	if sub == "" {
		h.respondWithError(w, "no sub", nil, http.StatusUnauthorized)
		return
	}
	var profile Profile

	row := h.DB.QueryRow(ctx, "select username, email, bio, posted, answered from users WHERE username = $1", sub)
	row.Scan(&profile.Username, &profile.Email, &profile.Bio, &profile.Posted, &profile.Answered)

	json.NewEncoder(w).Encode(profile)
}
