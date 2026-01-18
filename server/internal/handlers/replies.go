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
)

func (h *APIHandler) respondWithError(w http.ResponseWriter, msg string, err error, code int) {
	if err != nil {
		fmt.Println(err)
	}
	http.Error(w, msg, code)
}

type Answer struct {
	UID         uuid.UUID `json:"uid"`
	Content     string    `json:"content"`
	TimeCreated time.Time `json:"timeCreated"`
	QuestionUID uuid.UUID `json:"questionUid"`
	Upvotes     int       `json:"upvotes"`
	IsUpvoted   bool      `json:"isUpvoted"`
}

func (h *APIHandler) ListReplies(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	defer r.Body.Close()
	var answer []Answer
	uid := r.PathValue("uid")

	rows, err := h.DB.Query(ctx, `
	select a.uid, a.content, a.time_created, a.question_uid, count(v.answer_uid) as vote_count
	from answers a left join answer_upvotes v
	on a.uid = v.answer_uid
	where a.question_uid = $1
	group by a.uid, a.content, a.time_created, a.question_uid;
	`, uid)
	if err != nil {
		h.respondWithError(w, "failed to query replies: "+err.Error(), err, http.StatusBadRequest)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var ans Answer
		if err := rows.Scan(&ans.UID, &ans.Content, &ans.TimeCreated, &ans.QuestionUID, &ans.Upvotes); err != nil {
			h.respondWithError(w, "failed to read rows of replies: "+err.Error(), err, http.StatusBadRequest)
			return
		}
		answer = append(answer, ans)
	}

	json.NewEncoder(w).Encode(answer)
}

func (h *APIHandler) CreateReply(w http.ResponseWriter, r *http.Request) {
	var ans Answer
	if err := json.NewDecoder(r.Body).Decode(&ans); err != nil {
		h.respondWithError(w, "failed to decode reply", err, http.StatusBadRequest)
		return
	}
	fmt.Println(ans)
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
	uid := r.PathValue("uid")
	var err error
	ans.QuestionUID, err = uuid.Parse(uid)

	if err != nil {
		h.respondWithError(w, "invalid uid", err, http.StatusBadRequest)
		return
	}

	ans.UID = uuid.New()
	ans.TimeCreated = time.Now()

	fmt.Println(ans)

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	_, err = h.DB.Exec(ctx, "insert into answers (uid, content, question_uid, author, time_created) values ($1, $2, $3, $4, $5)",
		ans.UID, ans.Content, ans.QuestionUID, sub, ans.TimeCreated)

	if err != nil {
		h.respondWithError(w, "failed to save reply to db", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ans)
}

func (h *APIHandler) UpdateReply(w http.ResponseWriter, r *http.Request) {

}

func (h *APIHandler) UpdateReplyVote(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	ruid := r.PathValue("ruid")
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
	row := h.DB.QueryRow(ctx, "select answer_uid, username from answer_upvotes where username = $1 and answer_uid = $2", sub, ruid)
	var vote Vote

	if err := row.Scan(&vote.ObjectUID, &vote.Username); err == pgx.ErrNoRows {
		_, err := h.DB.Exec(ctx, "insert into answer_upvotes (answer_uid, username) values ($1, $2)", ruid, sub)
		if err != nil {
			h.respondWithError(w, "failed to add vote", err, http.StatusInternalServerError)
			return
		}
	} else if err == nil {
		_, err := h.DB.Exec(ctx, "delete from answer_upvotes where username = $1 and answer_uid = $2", sub, ruid)
		if err != nil {
			h.respondWithError(w, "failed to delete upvote", err, http.StatusInternalServerError)
			return
		}
	} else {
		h.respondWithError(w, "failed to update answer_upvotes", err, http.StatusInternalServerError)
		return
	}

}
func (h *APIHandler) DeleteReply(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	quid := r.PathValue("quid")
	ruid := r.PathValue("ruid")
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
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	_, err := h.DB.Exec(ctx, "delete from answers where uid = $1 and question_uid = $2 and author = $3", ruid, quid, sub)
	if err != nil {
		h.respondWithError(w, "failed to delete reply", err, http.StatusInternalServerError)
		return
	}

}
