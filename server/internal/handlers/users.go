package handlers
import (
	"context"
	"encoding/json"
	"net/http"
	"time"
	"github.com/golang-jwt/jwt/v5"
)
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
	if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
		h.respondWithError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	_, err := h.DB.Exec(ctx, "update users set bio = $1, avatar = $2, links = $3 where username = $4", profile.Bio, profile.Avatar, profile.Link, sub)
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
	if sub == "" {
		h.respondWithError(w, "no sub", nil, http.StatusUnauthorized)
		return
	}
	var profile Profile
	row := h.DB.QueryRow(ctx, "select username, email, COALESCE(bio, ''), COALESCE(avatar, ''), COALESCE(links, ''), posted, answered from users WHERE username = $1", sub)
	if err := row.Scan(&profile.Username, &profile.Email, &profile.Bio, &profile.Avatar, &profile.Link, &profile.Posted, &profile.Answered); err != nil {
		h.respondWithError(w, "failed to get profile", err, http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(profile)
}
