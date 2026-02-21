package handlers

import (
	"context"
	"echo/internal/middleware"
	"echo/internal/service"
	"echo/internal/types"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

func (h *ReplyHandler) ListReplies(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer cancel()
	defer r.Body.Close()

	uid := chi.URLParam(r, "uid")
	if uid == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	}

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	answer, err := h.Service.ListReplies(ctx, uid, sub)
	if err != nil {
		if errors.Is(err, service.ErrInvalidQuestionUID) {
			respondWithError(w, "invalid question uid", nil, http.StatusBadRequest)
		} else {
			respondWithError(w, "failed to query replies", err, http.StatusInternalServerError)
		}
		return
	}

	respondWithJSON(w, http.StatusOK, answer)
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
	uid := chi.URLParam(r, "uid")
	if uid == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	newUID, err := h.Service.CreateReply(ctx, uid, sub, ans.Content)
	if err != nil {
		if errors.Is(err, service.ErrInvalidQuestionUID) {
			respondWithError(w, "invalid question uid", nil, http.StatusBadRequest)
		} else {
			respondWithError(w, "failed to save reply to db", err, http.StatusInternalServerError)
		}
		return
	}
	ans.UID = newUID
	ans.QuestionUID = uid
	ans.AuthorUsername = sub
	ans.TimeCreated = time.Now().UTC()
	ans.IsAccepted = false

	respondWithJSON(w, http.StatusCreated, ans)
}
func (h *ReplyHandler) UpdateReply(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	defer r.Body.Close()

	ruid := chi.URLParam(r, "ruid")
	if ruid == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
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
	if errors.Is(err, service.ErrInvalidReplyUID) {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	} else if err == pgx.ErrNoRows {
		respondWithError(w, "reply not found or unauthorized", nil, http.StatusNotFound)
		return
	} else if err != nil {
		respondWithError(w, "failed to update reply", err, http.StatusInternalServerError)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "reply updated"})
}
func (h *ReplyHandler) UpdateReplyVote(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer cancel()
	ruid := chi.URLParam(r, "ruid")
	if ruid == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	}

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	if err := h.Service.UpdateReplyVote(ctx, sub, ruid); err != nil {
		if errors.Is(err, service.ErrInvalidReplyUID) {
			respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		} else {
			respondWithError(w, "failed to update vote", err, http.StatusInternalServerError)
		}
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "vote updated"})
}
func (h *ReplyHandler) DeleteReply(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	quid := chi.URLParam(r, "uid")
	ruid := chi.URLParam(r, "ruid")

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer cancel()

	if err := h.Service.DeleteReply(ctx, ruid, quid, sub); err != nil {
		if errors.Is(err, service.ErrInvalidReplyUID) || errors.Is(err, service.ErrInvalidQuestionUID) {
			respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		} else {
			respondWithError(w, "failed to delete reply", err, http.StatusInternalServerError)
		}
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "reply deleted"})
}

func (h *ReplyHandler) AcceptReply(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	quid := chi.URLParam(r, "uid")
	ruid := chi.URLParam(r, "ruid")
	if quid == "" || ruid == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	}
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer cancel()

	err = h.Service.AcceptReply(ctx, quid, ruid, sub)
	if err != nil {
		if errors.Is(err, service.ErrUnauthorized) {
			respondWithError(w, "unauthorized", nil, http.StatusForbidden)
		} else if errors.Is(err, service.ErrQuestionNotFound) {
			respondWithError(w, "question not found", nil, http.StatusNotFound)
		} else if errors.Is(err, service.ErrReplyNotFound) {
			respondWithError(w, "reply not found", nil, http.StatusNotFound)
		} else if errors.Is(err, service.ErrInvalidQuestionUID) {
			respondWithError(w, "invalid question uid", nil, http.StatusBadRequest)
		} else if errors.Is(err, service.ErrInvalidReplyUID) {
			respondWithError(w, "invalid reply uid", nil, http.StatusBadRequest)
		} else {
			respondWithError(w, "failed to accept reply", err, http.StatusInternalServerError)
		}
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "reply accepted"})
}

func (h *ReplyHandler) UnacceptReply(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	quid := chi.URLParam(r, "uid")
	ruid := chi.URLParam(r, "ruid")
	if quid == "" || ruid == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	}
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer cancel()

	err = h.Service.UnacceptReply(ctx, quid, ruid, sub)
	if err != nil {
		if errors.Is(err, service.ErrUnauthorized) {
			respondWithError(w, "unauthorized", nil, http.StatusForbidden)
		} else if errors.Is(err, service.ErrQuestionNotFound) {
			respondWithError(w, "question not found", nil, http.StatusNotFound)
		} else if errors.Is(err, service.ErrReplyNotFound) {
			respondWithError(w, "reply not found", nil, http.StatusNotFound)
		} else if errors.Is(err, service.ErrInvalidQuestionUID) {
			respondWithError(w, "invalid question uid", nil, http.StatusBadRequest)
		} else if errors.Is(err, service.ErrInvalidReplyUID) {
			respondWithError(w, "invalid reply uid", nil, http.StatusBadRequest)
		} else {
			respondWithError(w, "failed to unaccept reply", err, http.StatusInternalServerError)
		}
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "reply unaccepted"})
}
