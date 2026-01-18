package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (h *APIHandler) respondWithError(w http.ResponseWriter, msg string, err error, code int) {
	http.Error(w, msg, code)
}
func (h *APIHandler) ListReplies(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	defer r.Body.Close()
	var answer []AnswerItem
	uid := r.PathValue("uid")
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)
	if sub == "" {
		h.respondWithError(w, "no sub", nil, http.StatusUnauthorized)
		return
	}
	rows, err := h.DB.Query(ctx, `
	select a.uid,
	a.content,
	a.time_created,
	a.question_uid,
	a.author,
	u.avatar,
	a.upvotes_count + COALESCE(a.reddit_upvotes, 0) as upvotes,
	exists (
	select 1 from answer_upvotes v2
	where v2.answer_uid = a.uid  and v2.username = $1
	) as is_upvoted
	from answers a
	left join users u
	on u.username = a.author
	where a.question_uid = $2
	limit 200 offset 0;
	`, sub, uid)
	if err != nil {
		h.respondWithError(w, "failed to query replies: "+err.Error(), err, http.StatusBadRequest)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var ans AnswerItem
		var avatar *string
		if err := rows.Scan(&ans.Answer.UID, &ans.Answer.Content, &ans.Answer.TimeCreated, &ans.Answer.QuestionUID, &ans.Answer.AuthorUsername, &avatar, &ans.Answer.Upvotes, &ans.Answer.IsUpvoted); err != nil {
			h.respondWithError(w, "failed to read rows of replies: "+err.Error(), err, http.StatusBadRequest)
			return
		}
		if avatar != nil {
			ans.Author.Avatar = *avatar
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
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)
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
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	_, err = h.DB.Exec(ctx, "insert into answers (uid, content, question_uid, author, time_created) values ($1, $2, $3, $4, $5)",
		ans.UID, ans.Content, ans.QuestionUID, sub, ans.TimeCreated)
	if err != nil {
		h.respondWithError(w, "failed to save reply to db", err, http.StatusInternalServerError)
		return
	}
	var questionAuthor string
	err = h.DB.QueryRow(ctx, "select author from questions where uid = $1", ans.QuestionUID).Scan(&questionAuthor)
	if err == nil && questionAuthor != "" && questionAuthor != sub {
		_, err := h.DB.Exec(ctx, "insert into notifications (user_username, actor_username, type, reference_uid) values ($1, $2, 'reply_question', $3)", questionAuthor, sub, ans.UID)
		if err != nil {
			_ = err
		}
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
		_, _ = h.DB.Exec(ctx, "update answers set upvotes_count = upvotes_count + 1 where uid = $1", ruid)
		var author string
		h.DB.QueryRow(ctx, "select author from answers where uid = $1", ruid).Scan(&author)
		if author != "" && author != sub {
			var notifExists bool
			h.DB.QueryRow(ctx, "select exists(select 1 from notifications where type = 'upvote_reply' and actor_username = $1 and reference_uid = $2)", sub, ruid).Scan(&notifExists)
			if !notifExists {
				h.DB.Exec(ctx, "insert into notifications (user_username, actor_username, type, reference_uid) values ($1, $2, 'upvote_reply', $3)", author, sub, ruid)
			}
		}
	} else if err == nil {
		_, err := h.DB.Exec(ctx, "delete from answer_upvotes where username = $1 and answer_uid = $2", sub, ruid)
		if err != nil {
			h.respondWithError(w, "failed to delete upvote", err, http.StatusInternalServerError)
			return
		}
		_, _ = h.DB.Exec(ctx, "update answers set upvotes_count = upvotes_count - 1 where uid = $1", ruid)
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
