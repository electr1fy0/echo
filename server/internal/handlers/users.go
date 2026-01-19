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
	query := `
		SELECT 
			u.username, u.email, COALESCE(u.bio, ''), COALESCE(u.avatar, ''), COALESCE(u.links, ''),
			(SELECT COUNT(*) FROM questions q WHERE q.author = u.username) as posted,
			(SELECT COUNT(*) FROM answers a WHERE a.author = u.username) as answered
		FROM users u
		WHERE u.username = $1`

	row := h.DB.QueryRow(ctx, query, sub)
	if err := row.Scan(&profile.Username, &profile.Email, &profile.Bio, &profile.Avatar, &profile.Link, &profile.Posted, &profile.Answered); err != nil {
		h.respondWithError(w, "failed to get profile", err, http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(profile)
}

func (h *APIHandler) GetPublicProfile(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	username := r.PathValue("username")
	if username == "" {
		h.respondWithError(w, "username required", nil, http.StatusBadRequest)
		return
	}

	var profile Profile
	query := `
		SELECT 
			u.username, u.email, COALESCE(u.bio, ''), COALESCE(u.avatar, ''), COALESCE(u.links, ''),
			(SELECT COUNT(*) FROM questions q WHERE q.author = u.username) as posted,
			(SELECT COUNT(*) FROM answers a WHERE a.author = u.username) as answered
		FROM users u
		WHERE u.username = $1`

	row := h.DB.QueryRow(ctx, query, username)
	if err := row.Scan(&profile.Username, &profile.Email, &profile.Bio, &profile.Avatar, &profile.Link, &profile.Posted, &profile.Answered); err != nil {
		h.respondWithError(w, "profile not found", err, http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(profile)
}
