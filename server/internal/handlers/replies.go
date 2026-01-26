package handlers

import (
	"context"
	"echo/internal/middleware"
	"echo/internal/types"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func (h *ReplyHandler) ListReplies(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer cancel()
	defer r.Body.Close()

	uidStr := r.PathValue("uid")
	var uid pgtype.UUID
	if err := uid.Scan(uidStr); err != nil {
		respondWithError(w, "invalid uid", err, http.StatusBadRequest)
		return
	}

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	rows, err := h.Service.ListReplies(ctx, uid, sub)
	if err != nil {
		respondWithError(w, "failed to query replies: "+err.Error(), err, http.StatusBadRequest)
		return
	}

	answer := []types.AnswerItem{}
	for _, row := range rows {
		ans := types.AnswerItem{
			Answer: types.Answer{
				UID:            types.UUID(row.Uid.Bytes),
				Content:        row.Content,
				TimeCreated:    row.TimeCreated.Time,
				QuestionUID:    types.UUID(row.QuestionUid.Bytes),
				AuthorUsername: row.Author,
				Upvotes:        int(row.Upvotes.Int32),
				IsUpvoted:      row.IsUpvoted,
			},
			Author: types.Profile{
				Username: row.Author,
				Avatar:   row.Avatar.String,
			},
		}
		answer = append(answer, ans)
	}
	json.NewEncoder(w).Encode(answer)
}
func (h *ReplyHandler) CreateReply(w http.ResponseWriter, r *http.Request) {
	var ans types.Answer
	if err := json.NewDecoder(r.Body).Decode(&ans); err != nil {
		respondWithError(w, "failed to decode reply", err, http.StatusBadRequest)
		return
	}
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	uid := r.PathValue("uid")
	pUID, err := uuid.Parse(uid)
	if err != nil {
		respondWithError(w, "invalid uid", err, http.StatusBadRequest)
		return
	}
	ans.QuestionUID = types.UUID(pUID)
	ans.UID = types.UUID(uuid.New())
	ans.TimeCreated = time.Now()

	var uidPg pgtype.UUID
	uidPg.Scan(uuid.UUID(ans.UID).String())
	var qidPg pgtype.UUID
	qidPg.Scan(uuid.UUID(ans.QuestionUID).String())

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	err = h.Service.CreateReply(ctx, uidPg, qidPg, sub, ans.Content)
	if err != nil {
		respondWithError(w, "failed to save reply to db", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ans)
}
func (h *ReplyHandler) UpdateReply(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	defer r.Body.Close()

	ruidStr := r.PathValue("ruid")
	var ruid pgtype.UUID
	if err := ruid.Scan(ruidStr); err != nil {
		respondWithError(w, "invalid uid", err, http.StatusBadRequest)
		return
	}

	var body struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondWithError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	err = h.Service.UpdateReply(ctx, ruid, sub, body.Content)
	if err == pgx.ErrNoRows {
		respondWithError(w, "reply not found or unauthorized", nil, http.StatusNotFound)
		return
	} else if err != nil {
		respondWithError(w, "failed to update reply", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
func (h *ReplyHandler) UpdateReplyVote(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer cancel()
	ruidStr := r.PathValue("ruid")
	var ruid pgtype.UUID
	if err := ruid.Scan(ruidStr); err != nil {
		respondWithError(w, "invalid uid", err, http.StatusBadRequest)
		return
	}

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	if err := h.Service.UpdateReplyVote(ctx, sub, ruid); err != nil {
		respondWithError(w, "failed to update vote", err, http.StatusInternalServerError)
		return
	}
}
func (h *ReplyHandler) DeleteReply(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	quidStr := r.PathValue("quid")
	ruidStr := r.PathValue("ruid")
	var quid, ruid pgtype.UUID
	quid.Scan(quidStr)
	ruid.Scan(ruidStr)

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer cancel()

	if err := h.Service.DeleteReply(ctx, ruid, quid, sub); err != nil {
		respondWithError(w, "failed to delete reply", err, http.StatusInternalServerError)
		return
	}
}
