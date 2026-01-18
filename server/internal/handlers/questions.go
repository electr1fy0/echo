package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type APIHandler struct {
	DB *pgxpool.Pool
}

func (h *APIHandler) UpdateQuestionVote(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)

	defer cancel()
	quid := r.PathValue("uid")
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)
	fmt.Println(sub)
	if sub == "" {
		h.respondWithError(w, "no sub", nil, http.StatusUnauthorized)
		return
	}

	var vote Vote
	row := h.DB.QueryRow(ctx, "select username, question_uid from question_upvotes where username = $1 and question_uid = $2", sub, quid)
	if err := row.Scan(&vote.Username, &vote.ObjectUID); err == pgx.ErrNoRows {
		h.DB.Exec(ctx, "insert into question_upvotes (username, question_uid) values ($1, $2)", sub, quid)
	} else if err == nil {
		h.DB.QueryRow(ctx, "delete from question_upvotes where username = $1 and question_uid = $2", sub, quid)
	} else {
		h.respondWithError(w, "failed to update question_upvotes", err, http.StatusInternalServerError)
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
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)
	fmt.Println(sub)
	if sub == "" {
		h.respondWithError(w, "no sub", nil, http.StatusUnauthorized)
		return
	}
	_, err := h.DB.Exec(ctx, "delete from questions where uid =  $1 and author = $2", uid, sub)
	if err != nil {
		h.respondWithError(w, "failed to save reply to db", err, http.StatusInternalServerError)
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
		h.respondWithError(w, "invalid sub", nil, http.StatusUnauthorized)
		return
	}

	_, err := h.DB.Exec(ctx, "insert into questions (content, author) values ($1, $2)", question.Content, sub)
	if err != nil {
		h.respondWithError(w, "failed to insert data: "+err.Error(), err, http.StatusInternalServerError)
		return
	}
	w.Write([]byte("all good"))
}

func (h *APIHandler) ListQuestions(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer r.Body.Close()
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
		h.respondWithError(w, "invalid sub", nil, http.StatusUnauthorized)
		return
	}

	sort := q.Get("sort")
	orderBy := "q.time_created desc"
	if sort == "votes" {
		orderBy = "vote_count desc"
	}

	query := fmt.Sprintf(`
		select
q.uid,
q.content,
q.time_created,
q.author,
u.avatar,
count(v.question_uid) as vote_count,
exists (
select 1 from question_upvotes v2
where v2.question_uid = q.uid and v2.username = $1
) as is_upvoted
from questions q
left join question_upvotes v
			on q.uid = v.question_uid
left join users u
on u.username = q.author
group by q.uid, q.content, q.time_created, q.author, u.avatar
order by %s
limit $2 offset $3
`, orderBy)

	rows, err := h.DB.Query(ctx, query, sub, limit, offset)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Println("failed to query row", err)
		w.Write([]byte("failed to query rows" + err.Error()))
		return
	}
	defer rows.Close()
	questions := make([]QuestionItem, 0)
	for rows.Next() {
		var q QuestionItem
		err := rows.Scan(&q.Question.UID, &q.Question.Content, &q.Question.TimeCreated, &q.Question.AuthorUsername, &q.Author.Avatar, &q.Question.Upvotes, &q.Question.IsUpvoted)
		q.Author.Username = q.Question.AuthorUsername

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
		h.respondWithError(w, "invalid sub", nil, http.StatusUnauthorized)
		return
	}

	rows, err := h.DB.Query(ctx, `
		select
q.uid,
q.content,
q.time_created,
q.author,
u.avatar,
count(v.question_uid) as vote_count,
exists (
select 1 from question_upvotes v2
where v2.question_uid = q.uid and v2.username = $1
) as is_upvoted
from questions q
left join question_upvotes v
			on q.uid = v.question_uid
left join users u
on u.username = q.author
where q.author = $1
group by q.uid, q.content, q.time_created, q.author, u.avatar
limit $2 offset $3`, sub, limit, offset)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("failed to query rows" + err.Error()))
		return
	}
	defer rows.Close()
	questions := make([]QuestionItem, 0)
	for rows.Next() {
		var q QuestionItem
		err := rows.Scan(&q.Question.UID, &q.Question.Content, &q.Question.TimeCreated, &q.Question.AuthorUsername, &q.Author.Avatar, &q.Question.Upvotes, &q.Question.IsUpvoted)
		q.Author.Username = q.Question.AuthorUsername
		if err != nil {
			fmt.Println("failed to scan row", err)
			return
		}
		questions = append(questions, q)
	}
	if rows.Err() != nil {
		h.respondWithError(w, "db error: "+rows.Err().Error(), rows.Err(), http.StatusInternalServerError)
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

	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)

	if query == "" {
		json.NewEncoder(w).Encode([]QuestionItem{})
		return
	}

	rows, err := h.DB.Query(ctx, `
	select 
		q.uid, q.content, q.time_created, q.author,
		u.avatar,
		count(v.question_uid) as vote_count,
    	exists (select 1 from question_upvotes v2 where v2.question_uid = q.uid and v2.username = $1) as is_upvoted
	from questions q
	left join question_upvotes v on q.uid = v.question_uid
	left join users u on u.username = q.author
	where q.content ilike $2
	group by q.uid, q.content, q.time_created, q.author, u.avatar
	limit $3 offset $4;`,
		sub, "%"+query+"%", limit, offset)

	if err != nil {
		h.respondWithError(w, "failed to query rows", err, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	questions := make([]QuestionItem, 0)
	for rows.Next() {
		var q QuestionItem
		err := rows.Scan(&q.Question.UID, &q.Question.Content, &q.Question.TimeCreated, &q.Question.AuthorUsername, &q.Author.Avatar, &q.Question.Upvotes, &q.Question.IsUpvoted)
		q.Author.Username = q.Question.AuthorUsername
		if err != nil {
			fmt.Println("failed to scan row", err)
			return
		}
		questions = append(questions, q)
	}
	if rows.Err() != nil {
		h.respondWithError(w, "db error: "+rows.Err().Error(), rows.Err(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(questions)
}
