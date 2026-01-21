package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"
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

	newUsername := sub
	if profile.Username != "" && profile.Username != sub {
		profile.Username = strings.TrimSpace(profile.Username)
		if strings.Contains(profile.Username, " ") {
			h.respondWithError(w, "username cannot contain spaces", nil, http.StatusBadRequest)
			return
		}

		var count int
		err := h.DB.QueryRow(ctx, "SELECT count(*) FROM users WHERE username = $1", profile.Username).Scan(&count)
		if err != nil {
			h.respondWithError(w, "database error", err, http.StatusInternalServerError)
			return
		}
		if count > 0 {
			h.respondWithError(w, "username already taken", nil, http.StatusConflict)
			return
		}
		newUsername = profile.Username
	}

	_, err := h.DB.Exec(ctx, "update users set bio = $1, avatar = $2, links = $3, username = $4 where username = $5", profile.Bio, profile.Avatar, profile.Link, newUsername, sub)
	if err != nil {
		h.respondWithError(w, "failed to update profile", err, http.StatusInternalServerError)
		return
	}

	if newUsername != sub {
		newClaims := &jwt.MapClaims{
			"iat":    time.Now().Unix(),
			"exp":    time.Now().Add(48 * time.Hour).Unix(),
			"sub":    newUsername,
			"access": []string{"view", "create"},
			"role":   "user",
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)
		key := []byte(os.Getenv("SECRET_KEY"))
		tokenStr, err := token.SignedString(key)
		if err != nil {
			h.respondWithError(w, "failed to sign token", err, http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"token": tokenStr})
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)

	_, err := h.DB.Exec(ctx, "DELETE FROM users WHERE username = $1", sub)
	if err != nil {
		h.respondWithError(w, "failed to delete user", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Account deleted successfully"})
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
			u.username, COALESCE(u.bio, ''), COALESCE(u.avatar, ''), COALESCE(u.links, ''),
			(SELECT COUNT(*) FROM questions q WHERE q.author = u.username) as posted,
			(SELECT COUNT(*) FROM answers a WHERE a.author = u.username) as answered
		FROM users u
		WHERE u.username = $1`

	row := h.DB.QueryRow(ctx, query, username)
	if err := row.Scan(&profile.Username, &profile.Bio, &profile.Avatar, &profile.Link, &profile.Posted, &profile.Answered); err != nil {
		h.respondWithError(w, "profile not found", err, http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(profile)
}
