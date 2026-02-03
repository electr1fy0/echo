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

	"github.com/jackc/pgx/v5"
)

func (h *QuestionHandler) UpdateQuestionVote(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	quid := r.PathValue("uid")
	if quid == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	}

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	if err := h.Service.UpdateQuestionVote(ctx, sub, quid); err != nil {
		if errors.Is(err, service.ErrInvalidUID) {
			respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		} else {
			respondWithError(w, "failed to update vote", err, http.StatusInternalServerError)
		}
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "vote updated"})
}
func (h *QuestionHandler) GetQuestion(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	quid := r.PathValue("uid")
	if quid == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	}
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	q, err := h.Service.GetQuestion(ctx, quid, sub)
	if errors.Is(err, service.ErrInvalidUID) {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	} else if err == pgx.ErrNoRows {
		respondWithError(w, "question not found", err, http.StatusNotFound)
		return
	} else if err != nil {
		respondWithError(w, "failed to query question", err, http.StatusInternalServerError)
		return
	}

	respondWithJSON(w, http.StatusOK, q)
}
func (h *QuestionHandler) DeleteQuestion(w http.ResponseWriter, r *http.Request) {
	uid := r.PathValue("uid")
	if uid == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	err = h.Service.DeleteQuestion(ctx, uid, sub)
	if err != nil {
		if errors.Is(err, service.ErrUnauthorized) {
			respondWithError(w, "unauthorized", nil, http.StatusForbidden)
		} else if errors.Is(err, service.ErrQuestionNotFound) {
			respondWithError(w, "question not found", nil, http.StatusNotFound)
		} else if errors.Is(err, service.ErrInvalidUID) {
			respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		} else {
			respondWithError(w, "failed to delete question", err, http.StatusInternalServerError)
		}
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "question deleted"})
}
func (h *QuestionHandler) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer cancel()
	defer r.Body.Close()

	var question types.Question
	if err := json.NewDecoder(r.Body).Decode(&question); err != nil {
		respondWithError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	if question.ChamberUID == "" {
		respondWithError(w, "chamber uid is required", nil, http.StatusBadRequest)
		return
	}

	_, err = h.Service.CreateQuestion(ctx, question, sub)
	if err != nil {
		respondWithError(w, "failed to create question", err, http.StatusInternalServerError)
		return
	}
	respondWithJSON(w, http.StatusCreated, map[string]string{"message": "question created"})
}

func (h *QuestionHandler) UpdateQuestion(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	defer r.Body.Close()

	uid := r.PathValue("uid")
	if uid == "" {
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

	err = h.Service.UpdateQuestion(ctx, uid, sub, body.Content)
	if errors.Is(err, service.ErrInvalidUID) {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	} else if err == pgx.ErrNoRows {
		respondWithError(w, "question not found or unauthorized", nil, http.StatusNotFound)
		return
	} else if err != nil {
		respondWithError(w, "failed to update question", err, http.StatusInternalServerError)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "question updated"})
}
func (h *QuestionHandler) PinQuestion(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	uid := r.PathValue("uid")
	if uid == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	}
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	err = h.Service.PinQuestion(ctx, uid, sub)
	if err != nil {
		if errors.Is(err, service.ErrUnauthorized) {
			respondWithError(w, "unauthorized", nil, http.StatusForbidden)
		} else if errors.Is(err, service.ErrQuestionNotFound) {
			respondWithError(w, "question not found", nil, http.StatusNotFound)
		} else if errors.Is(err, service.ErrInvalidUID) {
			respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		} else {
			respondWithError(w, "failed to pin question", err, http.StatusInternalServerError)
		}
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "question pinned"})
}
func (h *QuestionHandler) UnpinQuestion(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	uid := r.PathValue("uid")
	if uid == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	}
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	err = h.Service.UnpinQuestion(ctx, uid, sub)
	if err != nil {
		if errors.Is(err, service.ErrUnauthorized) {
			respondWithError(w, "unauthorized", nil, http.StatusForbidden)
		} else if errors.Is(err, service.ErrQuestionNotFound) {
			respondWithError(w, "question not found", nil, http.StatusNotFound)
		} else if errors.Is(err, service.ErrInvalidUID) {
			respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		} else {
			respondWithError(w, "failed to unpin question", err, http.StatusInternalServerError)
		}
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "question unpinned"})
}
func (h *QuestionHandler) ListQuestions(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer r.Body.Close()
	defer cancel()

	limit, offset := parsePagination(r)

	q := r.URL.Query()
	sort := q.Get("sort")
	filter := q.Get("filter")
	targetChamberUID := q.Get("chamber_uid")
	author := q.Get("author")

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	questions, err := h.Service.ListQuestions(ctx, service.ListQuestionsParams{
		Limit:            int(limit),
		Offset:           int(offset),
		Sort:             sort,
		Filter:           filter,
		TargetChamberUID: targetChamberUID,
		Author:           author,
		CurrentUser:      sub,
	})
	if err != nil {
		respondWithError(w, "failed to query rows", err, http.StatusInternalServerError)
		return
	}
	respondWithJSON(w, http.StatusOK, questions)
}
func (h *QuestionHandler) ListUserQuestions(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer cancel()

	limit, offset := parsePagination(r)

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	questions, err := h.Service.ListUserQuestions(ctx, limit, offset, sub, sub)
	if err != nil {
		respondWithError(w, "failed to query rows", err, http.StatusInternalServerError)
		return
	}
	respondWithJSON(w, http.StatusOK, questions)
}
func (h *QuestionHandler) SearchQuestions(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer cancel()

	limit, offset := parsePagination(r)
	query := r.URL.Query().Get("q")

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	if query == "" {
		respondWithJSON(w, http.StatusOK, []types.QuestionItem{})
		return
	}

	questions, err := h.Service.SearchQuestions(ctx, query, limit, offset, sub)
	if err != nil {
		respondWithError(w, "failed to query rows", err, http.StatusInternalServerError)
		return
	}

	respondWithJSON(w, http.StatusOK, questions)
}
