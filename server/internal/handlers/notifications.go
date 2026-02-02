package handlers

import (
	"context"
	"echo/internal/middleware"
	"net/http"
	"time"
)

func (h *NotificationHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	limit, offset := parsePagination(r)

	notifications, err := h.Service.ListNotifications(ctx, sub, limit, offset)
	if err != nil {
		respondWithError(w, "failed to fetch notifications", err, http.StatusInternalServerError)
		return
	}

	respondWithJSON(w, http.StatusOK, notifications)
}
