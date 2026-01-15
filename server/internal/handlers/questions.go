package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

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
	UID         uuid.UUID   `json:"uid"`
	Content     string      `json:"content"`
	TimeCreated time.Ticker `json:"timeCreated"`
	QuestionUID uuid.UUID   `json:"questionUid"`
}

func (h *APIHandler) createHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	defer r.Body.Close()
	var question Question
	json.NewDecoder(r.Body).Decode(&question)

	_, err := h.DB.Exec(ctx, "insert into questions (content) values ($1)", question.Content)
	if err != nil {
		http.Error(w, "failed to insert data: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write([]byte("all good"))
}

func (h *APIHandler) replyHandler(w http.ResponseWriter, r *http.Request) {
	var ans Answer
	if err := json.NewDecoder(r.Body).Decode(&ans); err != nil {
		http.Error(w, "failed to decode reply", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	_, err := h.DB.Exec(ctx, "insert into answers (content, question_uid) values ($1, $2)", ans.Content, ans.QuestionUID)
	if err != nil {
		http.Error(w, "failed to save reply to db", http.StatusInternalServerError)
		return
	}
}

func (h *APIHandler) listHandler(w http.ResponseWriter, r *http.Request) {
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
