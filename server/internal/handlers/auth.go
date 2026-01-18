package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var key = []byte("supersecretkey")

func (h *APIHandler) Signup(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	defer r.Body.Close()
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		panic(err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), 10)

	h.DB.Exec(ctx, "insert into users (username, email, password) values ($1, $2, $3)", user.Username, user.Email, hash)

	claims := &jwt.MapClaims{
		"iat":    time.Now().Unix(),
		"exp":    time.Now().Add(48 * time.Hour).Unix(),
		"sub":    user.Username,
		"access": []string{"view", "create"},
		"role":   "user",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString(key)
	if err != nil {
		panic(err)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "jwt-auth",
		Value:    tokenStr,
		Expires:  time.Now().Add(48 * time.Hour),
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
		Path:     "/",
	})
}

func (h *APIHandler) Signin(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	defer r.Body.Close()
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		panic(err)
	}

	var dbUser User
	row := h.DB.QueryRow(ctx, "select username, email, password from users where username = $1", user.Username)
	row.Scan(&dbUser.Username, &dbUser.Email, &dbUser.Password)

	if bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(user.Password)) != nil {
		h.respondWithError(w, "incorrect credentials", nil, http.StatusUnauthorized)
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
	tokenStr, err := token.SignedString(key)
	if err != nil {
		panic(err)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "jwt-auth",
		Value:    tokenStr,
		Expires:  time.Now().Add(48 * time.Hour),
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
		Path:     "/",
	})
}

func (h *APIHandler) Signout(w http.ResponseWriter, r *http.Request) {

	cookie, err := r.Cookie("jwt-auth")
	if err != nil {
		h.respondWithError(w, "failed to log out"+err.Error(), err, http.StatusBadRequest)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "jwt-auth",
		Value:    cookie.Value,
		Expires:  time.Now(),
		MaxAge:   -1,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
		Path:     "/",
	})
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
