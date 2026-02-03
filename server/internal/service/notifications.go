package service

import (
	"context"
	"echo/internal/database"
	"echo/internal/types"
)

func (s *Service) ListNotifications(ctx context.Context, currentUser string, limit, offset int32) ([]types.Notification, error) {
	rows, err := s.Q.ListNotifications(ctx, database.ListNotificationsParams{
		UserUsername: currentUser,
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		return nil, err
	}
	notifications := make([]types.Notification, 0, len(rows))
	for _, row := range rows {
		notifications = append(notifications, notificationFromRow(row))
	}
	return notifications, nil
}
