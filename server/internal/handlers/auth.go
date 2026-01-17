package handlers

import (
	"encoding/json"
	"net/http"
)

type User struct {
	Username string
	Email    string
	Password string
}

func (h *APIHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var user User
	json.NewDecoder(r.Body).Decode(&user)

}

func (h *APIHandler) Login(w http.ResponseWriter, r *http.Request) {

}

func (h *APIHandler) Logout(w http.ResponseWriter, r *http.Request) {

}
