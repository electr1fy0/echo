package service

import (
	"context"
	"echo/internal/types"
)

func (s *Service) ListNotifications(ctx context.Context, currentUser string, limit, offset int32) ([]types.Notification, error) {
	return s.Repo.ListNotifications(ctx, currentUser, limit, offset)
}
