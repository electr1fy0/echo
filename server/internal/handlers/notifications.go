package handlers

import (
	"context"
	"echo/internal/middleware"
	"encoding/json"
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

	page := r.URL.Query().Get("page")
	if page == "" {
		page = "0"
	}

	limit := 50
	offset := 0

	notifications, err := h.Service.ListNotifications(ctx, sub, int32(limit), int32(offset))
	if err != nil {
		respondWithError(w, "failed to fetch notifications", err, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(notifications)
}
