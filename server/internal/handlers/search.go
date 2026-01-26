package handlers

import (
	"context"
	"echo/internal/middleware"
	"echo/internal/types"
	"encoding/json"
	"net/http"
	"time"
)

func (h *SearchHandler) GlobalSearch(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	q := r.URL.Query()
	query := q.Get("q")
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	if query == "" {
		json.NewEncoder(w).Encode(types.SearchResponse{
			Chambers:  []types.Chamber{},
			Questions: []types.QuestionItem{},
			Replies:   []types.AnswerItem{},
			Users:     []types.Profile{},
		})
		return
	}

	resp, err := h.Service.GlobalSearch(ctx, query, sub)
	if err != nil {
		respondWithError(w, "search failed", err, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(resp)
}
