package repository

import (
	"context"
	"echo/internal/database"
	"echo/internal/types"
	"fmt"

	"github.com/google/uuid"
)

func (r *Repository) ListNotifications(ctx context.Context, currentUser string, limit, offset int32) ([]types.Notification, error) {
	rows, err := r.Q.ListNotifications(ctx, database.ListNotificationsParams{
		UserUsername: currentUser,
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch notifications: %w", err)
	}

		var notifications []types.Notification

		for _, row := range rows {

			n := types.Notification{

				UID:             uuid.UUID(row.Uid.Bytes).String(),

				UserUsername:    row.UserUsername,

				Type:            row.Type,

				ReferenceUID:    uuid.UUID(row.ReferenceUid.Bytes).String(),

				IsRead:          row.IsRead.Bool,

				CreatedAt:       row.CreatedAt.Time,

				Content:         row.Content,

				QuestionContent: row.QuestionContent,

			}

			if row.ActorAvatar.Valid {

				n.ActorAvatar = row.ActorAvatar.String

			}

			if row.ActorUsername.Valid {

				n.ActorUsername = row.ActorUsername.String

			}

			notifications = append(notifications, n)

		}

		return notifications, nil

	}

	