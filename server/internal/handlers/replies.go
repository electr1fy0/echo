package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func (h *APIHandler) ListReplies(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	defer r.Body.Close()
	var answer []Answer
	uid := r.PathValue("uid")

	rows, err := h.DB.Query(ctx, "select uid, content, time_created from answers where question_uid = $1", uid)
	if err != nil {
		http.Error(w, "failed to query replies: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var ans Answer
		if err := rows.Scan(&ans.UID, &ans.Content, &ans.TimeCreated); err != nil {
			http.Error(w, "failed to read rows of replies: "+err.Error(), http.StatusBadRequest)
			return
		}
		answer = append(answer, ans)
	}

	json.NewEncoder(w).Encode(answer)
}

func (h *APIHandler) CreateReply(w http.ResponseWriter, r *http.Request) {
	var ans Answer
	if err := json.NewDecoder(r.Body).Decode(&ans); err != nil {
		http.Error(w, "failed to decode reply", http.StatusBadRequest)
		return
	}
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		http.Error(w, "no claims", http.StatusUnauthorized)
		return
	}

	sub := claims["sub"].(string)
	fmt.Println(sub)
	if sub == "" {
		http.Error(w, "no sub", http.StatusUnauthorized)
		return
	}
	uid := r.PathValue("uid")
	var err error
	ans.QuestionUID, err = uuid.Parse(uid)
	if err != nil {
		http.Error(w, "invalid uid", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	_, err = h.DB.Exec(ctx, "insert into answers (content, question_uid, author) values ($1, $2, $3)", ans.Content, ans.QuestionUID, sub)
	if err != nil {
		http.Error(w, "failed to save reply to db", http.StatusInternalServerError)
		return
	}
}

func (h *APIHandler) UpdateReply(w http.ResponseWriter, r *http.Request) {

}
func (h *APIHandler) DeleteReply(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	quid := r.PathValue("quid")
	ruid := r.PathValue("ruid")
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		http.Error(w, "no claims", http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)
	fmt.Println(sub)
	if sub == "" {
		http.Error(w, "no sub", http.StatusUnauthorized)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	_, err := h.DB.Exec(ctx, "delete from answers where uid = $1 and question_uid = $2 and author = $3", ruid, quid, sub)
	if err != nil {
		http.Error(w, "failed to delete reply", http.StatusInternalServerError)
		return
	}

}
