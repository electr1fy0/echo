package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

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
		http.Error(w, "incorrect credentials", http.StatusUnauthorized)
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

func (h *APIHandler) Logout(w http.ResponseWriter, r *http.Request) {

}

func (h *APIHandler) Verify(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("valid"))
}
