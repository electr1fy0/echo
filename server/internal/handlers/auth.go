package handlers

import (
	"echo/internal/middleware"
	"echo/internal/service"
	"echo/internal/types"
	"encoding/json"
	"net/http"
)

type VerifyEmailRequest struct {
	Token string `json:"token"`
}

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	var user types.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		respondWithError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}

	if err := h.Service.Signup(r.Context(), user); err != nil {
		if err.Error() == "username already taken" {
			respondWithError(w, "username already taken", nil, http.StatusConflict)
		} else {
			respondWithError(w, "signup failed", err, http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Please check your email to verify your account"})
}

func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var req VerifyEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, "invalid request", err, http.StatusBadRequest)
		return
	}

	_, err := h.Service.VerifyEmail(r.Context(), req.Token)
	if err != nil {
		respondWithError(w, "invalid or expired token", err, http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Email verified successfully"})
}

func (h *AuthHandler) Signin(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	var user types.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		respondWithError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}

	token, err := h.Service.Signin(r.Context(), user)
	if err != nil {
		if err == service.ErrInvalidCredentials {
			respondWithError(w, err.Error(), nil, http.StatusUnauthorized)
		} else if err == service.ErrNotVerified {
			respondWithError(w, err.Error(), nil, http.StatusForbidden)
		} else {
			respondWithError(w, "internal error", err, http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": token})
}

func (h *AuthHandler) Signout(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func (h *AuthHandler) Verify(w http.ResponseWriter, r *http.Request) {
	username, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	profile, err := h.Service.GetProfile(r.Context(), username)
	if err != nil {
		respondWithError(w, "user not found", err, http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

func (h *AuthHandler) RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, "invalid request", err, http.StatusBadRequest)
		return
	}

	if err := h.Service.RequestPasswordReset(r.Context(), req.Email); err != nil {
		respondWithError(w, "failed to process request", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "If an account exists, a reset email has been sent"})
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, "invalid request", err, http.StatusBadRequest)
		return
	}

	if err := h.Service.ResetPassword(r.Context(), req.Token, req.NewPassword); err != nil {
		respondWithError(w, err.Error(), err, http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Password updated successfully"})
}

func (h *AuthHandler) ResendVerification(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, "invalid request", err, http.StatusBadRequest)
		return
	}

	if err := h.Service.ResendVerification(r.Context(), req.Email); err != nil {
		respondWithError(w, err.Error(), err, http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "If an account exists and is not verified, a verification email has been sent"})
}
