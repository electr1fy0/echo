package handlers
import (
	"context"
	"encoding/json"
	"net/http"
	"time"
	"github.com/golang-jwt/jwt/v5"
)
type Notification struct {
	UID           string    `json:"uid"`
	UserUsername  string    `json:"user_username"`
	ActorUsername string    `json:"actor_username"`
	ActorAvatar   string    `json:"actor_avatar"`
	Type          string    `json:"type"`
	ReferenceUID  string    `json:"reference_uid"`
	Content       string    `json:"content"`
	IsRead        bool      `json:"is_read"`
	CreatedAt     time.Time `json:"created_at"`
}
func (h *APIHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "0"
	}
	limit := 50
	offset := 0
	query := `
		SELECT
			n.uid,
			n.user_username,
			n.actor_username,
			n.type,
			n.reference_uid,
			n.is_read,
			n.created_at,
			u.avatar,
			COALESCE(q.content, a.content, '') as content
		FROM notifications n
		LEFT JOIN users u ON n.actor_username = u.username
		LEFT JOIN questions q ON n.type = 'upvote_question' AND n.reference_uid = q.uid
		LEFT JOIN answers a ON n.reference_uid = a.uid AND (n.type = 'reply_question' OR n.type = 'upvote_reply')
		WHERE n.user_username = $1
		ORDER BY n.created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := h.DB.Query(ctx, query, sub, limit, offset)
	if err != nil {
		h.respondWithError(w, "failed to fetch notifications", err, http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	notifications := []Notification{}
	for rows.Next() {
		var n Notification
		var avatar *string
		err := rows.Scan(
			&n.UID,
			&n.UserUsername,
			&n.ActorUsername,
			&n.Type,
			&n.ReferenceUID,
			&n.IsRead,
			&n.CreatedAt,
			&avatar,
			&n.Content,
		)
		if err != nil {
			continue
		}
		if avatar != nil {
			n.ActorAvatar = *avatar
		}
		notifications = append(notifications, n)
	}
	json.NewEncoder(w).Encode(notifications)
}
