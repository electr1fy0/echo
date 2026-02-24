package handlers

import (
	"crypto/rand"
	"echo/internal/middleware"
	"echo/internal/service"
	"echo/internal/types"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type VerifyEmailRequest struct {
	Token string `json:"token"`
}
type GoogleOnboardingRequest struct {
	Token    string `json:"token"`
	Username string `json:"username"`
}

var oauthConfig = &oauth2.Config{
	ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
	ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
	Endpoint:     google.Endpoint,
	RedirectURL:  envOrDefault("GOOGLE_REDIRECT_URL", "http://localhost:8080/auth/callback"),
	Scopes: []string{
		"https://www.googleapis.com/auth/userinfo.email",
		"https://www.googleapis.com/auth/userinfo.profile"},
}

func envOrDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func (h *AuthHandler) SigninWithGoogle(w http.ResponseWriter, r *http.Request) {
	buf := make([]byte, 32)
	rand.Read(buf)

	state := base64.RawURLEncoding.EncodeToString(buf)

	url := oauthConfig.AuthCodeURL(state)

	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *AuthHandler) CallbackHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "missing code", http.StatusBadRequest)
		return
	}

	token, err := oauthConfig.Exchange(ctx, code)
	if err != nil {
		http.Error(w, "oauth exchange failed", http.StatusBadGateway)
		return
	}

	client := oauthConfig.Client(ctx, token)

	resp, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		http.Error(w, "failed to fetch profile", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		http.Error(w, "google userinfo failed: "+string(body), http.StatusBadGateway)
		return
	}

	var user map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		http.Error(w, "invalid google profile response", http.StatusBadGateway)
		return
	}

	email, _ := user["email"].(string)
	if email == "" {
		http.Error(w, "email not provided by google", http.StatusBadRequest)
		return
	}

	appToken, isNewUser, err := h.Service.SigninOrSignupWithGoogle(ctx, email)
	if err != nil {
		http.Error(w, "google signin failed", http.StatusInternalServerError)
		return
	}

	frontendURL := os.Getenv("CLIENT_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	redirectURL := frontendURL + "/auth"
	if isNewUser {
		onboardingToken, tokenErr := createGoogleOnboardingToken(email)
		if tokenErr != nil {
			http.Error(w, "failed to prepare onboarding", http.StatusInternalServerError)
			return
		}
		redirectURL += "?onboarding=1&onboardingToken=" + url.QueryEscape(onboardingToken)
	} else {
		redirectURL += "?token=" + url.QueryEscape(appToken)
	}
	http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)

}

func (h *AuthHandler) CompleteGoogleOnboarding(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	var req GoogleOnboardingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}

	email, err := parseGoogleOnboardingToken(req.Token)
	if err != nil {
		respondWithError(w, "invalid onboarding token", err, http.StatusUnauthorized)
		return
	}

	token, err := h.Service.CompleteGoogleOnboarding(r.Context(), email, strings.TrimSpace(req.Username))
	if err != nil {
		if errors.Is(err, service.ErrUserExists) {
			respondWithError(w, err.Error(), nil, http.StatusConflict)
			return
		}
		respondWithError(w, "failed to complete onboarding", err, http.StatusInternalServerError)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"token": token})
}

func createGoogleOnboardingToken(email string) (string, error) {
	claims := jwt.MapClaims{
		"email": email,
		"iat":   time.Now().Unix(),
		"exp":   time.Now().Add(30 * time.Minute).Unix(),
		"typ":   "google_onboarding",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("SECRET_KEY")))
}

func parseGoogleOnboardingToken(rawToken string) (string, error) {
	token, err := jwt.Parse(rawToken, func(t *jwt.Token) (any, error) {
		return []byte(os.Getenv("SECRET_KEY")), nil
	})
	if err != nil || !token.Valid {
		return "", errors.New("invalid token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid claims")
	}
	if claims["typ"] != "google_onboarding" {
		return "", errors.New("invalid token type")
	}
	email, _ := claims["email"].(string)
	if email == "" {
		return "", errors.New("missing email")
	}
	return email, nil
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
		if errors.Is(err, service.ErrUserExists) {
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
		if errors.Is(err, service.ErrInvalidCredentials) {
			respondWithError(w, err.Error(), nil, http.StatusUnauthorized)
		} else if errors.Is(err, service.ErrNotVerified) {
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
