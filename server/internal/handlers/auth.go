package handlers

import (
	"context"
	"echo/internal/email"
	"echo/internal/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type VerifyEmailRequest struct {
	Token string `json:"token"`
}

func (h *APIHandler) Signup(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	defer r.Body.Close()
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		h.respondWithError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), 10)
	if err != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}

	token, err := utils.GenerateRandomToken(32)
	if err != nil {
		http.Error(w, "failed to generate token", http.StatusInternalServerError)
		return
	}

	go func() {
		if err := email.SendVerificationEmail(user.Email, user.Username, token); err != nil {
			fmt.Printf("Failed to send verification email: %v\n", err)
		}
	}()

	_, err = h.DB.Exec(ctx, "insert into users (username, email, password, verification_token, is_verified) values ($1, $2, $3, $4, $5)", user.Username, user.Email, hash, token, false)
	if err != nil {
		h.respondWithError(w, "failed to create user", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Please check your email to verify your account"})
}

func (h *APIHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var req VerifyEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, "invalid request", err, http.StatusBadRequest)
		return
	}
	var username string
	err := h.DB.QueryRow(context.Background(), "UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = $1 RETURNING username", req.Token).Scan(&username)
	if err != nil {
		h.respondWithError(w, "invalid or expired token", err, http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Email verified successfully"})
}

func (h *APIHandler) Signin(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	defer r.Body.Close()
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		h.respondWithError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}

	var dbUser struct {
		Username   string
		Email      string
		Password   string
		IsVerified bool
	}

	row := h.DB.QueryRow(ctx, "select username, email, password, is_verified from users where username = $1", user.Username)
	err = row.Scan(&dbUser.Username, &dbUser.Email, &dbUser.Password, &dbUser.IsVerified)
	if err != nil {
		h.respondWithError(w, "incorrect username or password", nil, http.StatusUnauthorized)
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(user.Password)) != nil {
		h.respondWithError(w, "incorrect username or password", nil, http.StatusUnauthorized)
		return
	}

	if !dbUser.IsVerified {
		h.respondWithError(w, "please verify your email before signing in", nil, http.StatusForbidden)
		return
	}

	claims := &jwt.MapClaims{
		"iat":    time.Now().Unix(),
		"exp":    time.Now().Add(48 * time.Hour).Unix(),
		"sub":    user.Username,
		"access": []string{"view", "create"},
		"role":   "user",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	key := os.Getenv("SECRET_KEY")

	tokenStr, err := token.SignedString(key)
	if err != nil {
		h.respondWithError(w, "failed to sign token", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": tokenStr})
}

func (h *APIHandler) Signout(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) Verify(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "invalid claims", nil, http.StatusUnauthorized)
		return
	}

	username, ok := claims["sub"].(string)
	if !ok {
		h.respondWithError(w, "invalid token sub", nil, http.StatusUnauthorized)
		return
	}

	var user User
	err := h.DB.QueryRow(context.Background(), "select username, email from users where username = $1", username).Scan(&user.Username, &user.Email)
	if err != nil {
		h.respondWithError(w, "user not found", err, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
