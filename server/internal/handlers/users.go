package handlers

import (
	"echo/internal/middleware"
	"echo/internal/service"
	"echo/internal/types"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	var profile types.Profile
	if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
		respondWithError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}

	newToken, err := h.Service.UpdateUser(r.Context(), sub, profile)
	if err != nil {
		if errors.Is(err, service.ErrUserExists) {
			respondWithError(w, err.Error(), nil, http.StatusConflict)
		} else {
			respondWithError(w, "failed to update profile", err, http.StatusInternalServerError)
		}
		return
	}

	if newToken != "" {
		respondWithJSON(w, http.StatusOK, map[string]string{"token": newToken})
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "profile updated"})
}

func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	if err := h.Service.DeleteUser(r.Context(), sub); err != nil {
		respondWithError(w, "failed to delete user", err, http.StatusInternalServerError)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Account deleted successfully"})
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	profile, err := h.Service.GetProfile(r.Context(), sub)
	if err != nil {
		respondWithError(w, "failed to get profile", err, http.StatusInternalServerError)
		return
	}
	respondWithJSON(w, http.StatusOK, profile)
}

func (h *UserHandler) GetPublicProfile(w http.ResponseWriter, r *http.Request) {
	username := chi.URLParam(r, "username")
	if username == "" {
		respondWithError(w, "username required", nil, http.StatusBadRequest)
		return
	}

	profile, err := h.Service.GetPublicProfile(r.Context(), username)
	if err != nil {
		respondWithError(w, "profile not found", err, http.StatusNotFound)
		return
	}
	respondWithJSON(w, http.StatusOK, profile)
}

func (h *UserHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	_, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	query := r.URL.Query().Get("q")
	if query == "" {
		respondWithJSON(w, http.StatusOK, []types.Profile{})
		return
	}
	users, err := h.Service.SearchUsers(r.Context(), query)
	if err != nil {
		respondWithError(w, "failed to search users", err, http.StatusInternalServerError)
		return
	}
	respondWithJSON(w, http.StatusOK, users)
}

func (h *UserHandler) ResolveUsers(w http.ResponseWriter, r *http.Request) {
	_, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	defer r.Body.Close()

	var body struct {
		Usernames []string `json:"usernames"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondWithError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	if len(body.Usernames) == 0 {
		respondWithJSON(w, http.StatusOK, map[string][]string{"existing": {}})
		return
	}
	existing, err := h.Service.ResolveUsers(r.Context(), body.Usernames)
	if err != nil {
		respondWithError(w, "failed to resolve users", err, http.StatusInternalServerError)
		return
	}
	respondWithJSON(w, http.StatusOK, map[string][]string{"existing": existing})
}
