package handlers

import (
	"context"
	"echo/internal/middleware"
	"echo/internal/repository"
	"echo/internal/types"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func (h *QuestionHandler) UpdateQuestionVote(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	quidStr := r.PathValue("uid")
	var quid pgtype.UUID
	if err := quid.Scan(quidStr); err != nil {
		respondWithError(w, "invalid uid", err, http.StatusBadRequest)
		return
	}

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	if err := h.Service.UpdateQuestionVote(ctx, sub, quid); err != nil {
		respondWithError(w, "failed to update vote", err, http.StatusInternalServerError)
		return
	}
}
func (h *QuestionHandler) GetQuestion(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	quidStr := r.PathValue("uid")
	var quid pgtype.UUID
	if err := quid.Scan(quidStr); err != nil {
		respondWithError(w, "invalid uid", err, http.StatusBadRequest)
		return
	}
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	q, err := h.Service.GetQuestion(ctx, quid, sub)
	if err == pgx.ErrNoRows {
		respondWithError(w, "question not found", err, http.StatusNotFound)
		return
	} else if err != nil {
		respondWithError(w, "failed to query question", err, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(q)
}
func (h *QuestionHandler) DeleteQuestion(w http.ResponseWriter, r *http.Request) {
	uidStr := r.PathValue("uid")
	var uid pgtype.UUID
	if err := uid.Scan(uidStr); err != nil {
		respondWithError(w, "invalid uid", err, http.StatusBadRequest)
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
		if err.Error() == "unauthorized" {
			respondWithError(w, "unauthorized", nil, http.StatusForbidden)
		} else if err.Error() == "question not found" {
			respondWithError(w, "question not found", nil, http.StatusNotFound)
		} else {
			respondWithError(w, "failed to delete question", err, http.StatusInternalServerError)
		}
		return
	}
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

	if uuid.UUID(question.ChamberUID) == uuid.Nil {
		respondWithError(w, "chamber uid is required", nil, http.StatusBadRequest)
		return
	}

	err = h.Service.CreateQuestion(ctx, question, sub)
	if err != nil {
		respondWithError(w, "failed to create question", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "question created"})
}

func (h *QuestionHandler) UpdateQuestion(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	defer r.Body.Close()

	uidStr := r.PathValue("uid")
	var uid pgtype.UUID
	if err := uid.Scan(uidStr); err != nil {
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

	err = h.Service.UpdateQuestion(ctx, uid, sub, body.Content)
	if err == pgx.ErrNoRows {
		respondWithError(w, "question not found or unauthorized", nil, http.StatusNotFound)
		return
	} else if err != nil {
		respondWithError(w, "failed to update question", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
func (h *QuestionHandler) ListQuestions(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer r.Body.Close()
	defer cancel()
	q := r.URL.Query()
	limit := q.Get("limit")
	offset := q.Get("offset")
	if limit == "" {
		limit = "500"
	}
	if offset == "" {
		offset = "0"
	}
	sort := q.Get("sort")
	filter := q.Get("filter")
	targetChamberUID := q.Get("chamber_uid")
	author := q.Get("author")
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	limitInt, _ := strconv.Atoi(limit)
	offsetInt, _ := strconv.Atoi(offset)
	if limitInt == 0 {
		limitInt = 500
	}

	questions, err := h.Service.ListQuestions(ctx, repository.ListQuestionsParams{

		Limit:            limitInt,
		Offset:           offsetInt,
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
	json.NewEncoder(w).Encode(questions)
}
func (h *QuestionHandler) ListUserQuestions(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer cancel()
	q := r.URL.Query()
	limitStr := q.Get("limit")
	offsetStr := q.Get("offset")
	limit := 500
	offset := 0
	var err error
	if limitStr != "" {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			limit = 500
		}
	}
	if offsetStr != "" {
		offset, err = strconv.Atoi(offsetStr)
		if err != nil {
			offset = 0
		}
	}
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	questions, err := h.Service.ListUserQuestions(ctx, int32(limit), int32(offset), sub, sub)
	if err != nil {
		respondWithError(w, "failed to query rows", err, http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(questions)
}
func (h *QuestionHandler) SearchQuestions(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*10)
	defer cancel()
	q := r.URL.Query()
	query := q.Get("q")
	limitStr := q.Get("limit")
	offsetStr := q.Get("offset")
	limit := 500
	offset := 0
	var err error
	if limitStr != "" {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			limit = 500
		}
	}
	if offsetStr != "" {
		offset, err = strconv.Atoi(offsetStr)
		if err != nil {
			offset = 0
		}
	}
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	if query == "" {
		json.NewEncoder(w).Encode([]types.QuestionItem{})
		return
	}

	questions, err := h.Service.SearchQuestions(ctx, query, int32(limit), int32(offset), sub)
	if err != nil {
		respondWithError(w, "failed to query rows", err, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(questions)
}
