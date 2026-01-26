package repository

import (
	"context"
	"echo/internal/types"
	"fmt"
)

func (r *Repository) ListNotifications(ctx context.Context, currentUser string, limit, offset int32) ([]types.Notification, error) {
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
			COALESCE(q.content, a.content, '') as content,
			COALESCE(q2.content, '') as question_content
		FROM notifications n
		LEFT JOIN users u ON n.actor_username = u.username
		LEFT JOIN questions q ON n.type = 'upvote_question' AND n.reference_uid = q.uid
		LEFT JOIN answers a ON n.reference_uid = a.uid AND (n.type = 'reply_question' OR n.type = 'upvote_reply')
		LEFT JOIN questions q2 ON a.question_uid = q2.uid
		WHERE n.user_username = $1
		ORDER BY n.created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.DB.Query(ctx, query, currentUser, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch notifications: %w", err)
	}
	defer rows.Close()

	var notifications []types.Notification
	for rows.Next() {
		var n types.Notification
		var avatar *string
		var actorUsername *string
		err := rows.Scan(
			&n.UID,
			&n.UserUsername,
			&actorUsername,
			&n.Type,
			&n.ReferenceUID,
			&n.IsRead,
			&n.CreatedAt,
			&avatar,
			&n.Content,
			&n.QuestionContent,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan notification: %w", err)
		}
		if avatar != nil {
			n.ActorAvatar = *avatar
		}
		if actorUsername != nil {
			n.ActorUsername = *actorUsername
		}
		notifications = append(notifications, n)
	}
	return notifications, nil
}