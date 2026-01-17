package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type APIHandler struct {
	DB *pgxpool.Pool
}
type Question struct {
	UID         uuid.UUID `json:"uid"`
	Content     string    `json:"content"`
	TimeCreated time.Time `json:"timeCreated"`
	Upvotes     int       `json:"upvotes"`
	IsUpvoted   bool      `json:"isUpvoted"`
}

type Answer struct {
	UID         uuid.UUID `json:"uid"`
	Content     string    `json:"content"`
	TimeCreated time.Time `json:"timeCreated"`
	QuestionUID uuid.UUID `json:"questionUid"`
	Upvotes     int       `json:"upvotes"`
	IsUpvoted   bool      `json:"isUpvoted"`
}

type Vote struct {
	Username    string
	QuestionUID string
}

func (h *APIHandler) UpdateVote(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)

	defer cancel()
	quid := r.PathValue("uid")
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
	var vote Vote
	row := h.DB.QueryRow(ctx, "select username, question_uid from votes where username = $1 and question_uid = $2", sub, quid)
	if err := row.Scan(&vote.Username, &vote.QuestionUID); err == pgx.ErrNoRows {
		h.DB.Exec(ctx, "insert into votes (username, question_uid) values ($1, $2)", sub, quid)
	} else if err == nil {
		h.DB.QueryRow(ctx, "delete from votes where username = $1 and question_uid = $2", sub, quid)
	} else {
		http.Error(w, "failed to update votes", http.StatusInternalServerError)
		return
	}

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
	rows, err := h.DB.Query(ctx, `
	select q.uid, q.content, q.time_created, count(v.question_uid) as vote_count,
	exists (select 1 from votes v2 where v2.question_uid = q.uid and v2.username = $3) as is_upvoted
	 from questions q left join votes v on q.uid = v.question_uid
	group by q.uid, q.content, q.time_created
	limit $1 offset $2`, limit, offset, sub)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Println("failed to query row", err)
		w.Write([]byte("failed to query rows" + err.Error()))
		return
	}
	defer rows.Close()
	questions := make([]Question, 0)
	for rows.Next() {
		var q Question
		err := rows.Scan(&q.UID, &q.Content, &q.TimeCreated, &q.Upvotes, &q.IsUpvoted)
		if err != nil {
			fmt.Println("failed to scan row", err)
			return
		}
		questions = append(questions, q)
	}
	fmt.Println()

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

func (h *APIHandler) SearchQuestions(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	q := r.URL.Query()
	query := q.Get("q")
	limit := q.Get("limit")
	offset := q.Get("offset")

	if query == "" {
		json.NewEncoder(w).Encode([]Question{})
		return
	}

	rows, err := h.DB.Query(ctx,
		"select uid, content, time_created FROM questions WHERE content ILIKE $1 LIMIT $2 OFFSET $3",
		"%"+query+"%", limit, offset)

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
