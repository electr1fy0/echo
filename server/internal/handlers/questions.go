package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type APIHandler struct {
	DB *pgxpool.Pool
}
type Question struct {
	UID         uuid.UUID `json:"uid"`
	Content     string    `json:"content"`
	TimeCreated time.Time `json:"timeCreated"`
}

type Answer struct {
	UID         uuid.UUID `json:"uid"`
	Content     string    `json:"content"`
	TimeCreated time.Time `json:"timeCreated"`
	QuestionUID uuid.UUID `json:"questionUid"`
}

func (h *APIHandler) UpdateVote(w http.ResponseWriter, r *http.Request) {

}

func (h *APIHandler) GetQuestion(w http.ResponseWriter, r *http.Request) {

}

func (h *APIHandler) DeleteQuestion(w http.ResponseWriter, r *http.Request) {
	uid := r.PathValue("uid")

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)

	defer cancel()
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
	_, err := h.DB.Exec(ctx, "delete from questions where uid =  $1 and author = $2", uid, sub)
	if err != nil {
		http.Error(w, "failed to save reply to db", http.StatusInternalServerError)
		return
	}

}
func (h *APIHandler) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	defer r.Body.Close()
	var question Question
	json.NewDecoder(r.Body).Decode(&question)

	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		fmt.Println("wrong assertion")
		return
	}
	sub := claims["sub"].(string)
	if sub == "" {
		http.Error(w, "invalid sub", http.StatusUnauthorized)
		return
	}

	_, err := h.DB.Exec(ctx, "insert into questions (content, author) values ($1, $2)", question.Content, sub)
	if err != nil {
		http.Error(w, "failed to insert data: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write([]byte("all good"))
}

func (h *APIHandler) ListQuestions(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	q := r.URL.Query()
	limit := q.Get("limit")
	offset := q.Get("offset")

	rows, err := h.DB.Query(ctx, "select uid, content, time_created from questions limit $1 offset $2", limit, offset)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("failed to query rows" + err.Error()))
		return
	}
	defer rows.Close()
	questions := make([]Question, 0)
	for rows.Next() {
		var q Question
		err := rows.Scan(&q.UID, &q.Content, &q.TimeCreated)
		if err != nil {
			fmt.Println("failed to scan row", err)
			return
		}
		questions = append(questions, q)
	}
	if rows.Err() != nil {
		http.Error(w, "db error: "+rows.Err().Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(questions)
}

func (h *APIHandler) ListUserQuestions(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	q := r.URL.Query()
	limit := q.Get("limit")
	offset := q.Get("offset")
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		fmt.Println("wrong assertion")
		return
	}
	sub := claims["sub"].(string)
	if sub == "" {
		http.Error(w, "invalid sub", http.StatusUnauthorized)
		return
	}

	rows, err := h.DB.Query(ctx, "select uid, content, time_created from questions where author = $1 limit $2 offset $3", sub, limit, offset)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("failed to query rows" + err.Error()))
		return
	}
	defer rows.Close()
	questions := make([]Question, 0)
	for rows.Next() {
		var q Question
		err := rows.Scan(&q.UID, &q.Content, &q.TimeCreated)
		if err != nil {
			fmt.Println("failed to scan row", err)
			return
		}
		questions = append(questions, q)
	}
	if rows.Err() != nil {
		http.Error(w, "db error: "+rows.Err().Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(questions)
}
