package handlers

import (
	"echo/internal/middleware"
	"echo/internal/service"
	"echo/internal/types"
	"encoding/json"
	"net/http"
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
		if err == service.ErrUserExists {
			respondWithError(w, err.Error(), nil, http.StatusConflict)
		} else {
			respondWithError(w, "failed to update profile", err, http.StatusInternalServerError)
		}
		return
	}

	if newToken != "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"token": newToken})
		return
	}
	w.WriteHeader(http.StatusOK)
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

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Account deleted successfully"})
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
	json.NewEncoder(w).Encode(profile)
}

func (h *UserHandler) GetPublicProfile(w http.ResponseWriter, r *http.Request) {
	username := r.PathValue("username")
	if username == "" {
		respondWithError(w, "username required", nil, http.StatusBadRequest)
		return
	}

	profile, err := h.Service.GetPublicProfile(r.Context(), username)
	if err != nil {
		respondWithError(w, "profile not found", err, http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(profile)
}
