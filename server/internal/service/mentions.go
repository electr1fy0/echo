package service

import (
	"context"
	"echo/internal/database"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
)

var mentionPattern = regexp.MustCompile(`@([a-zA-Z0-9_]+)`)

func extractMentions(content string) []string {
	matches := mentionPattern.FindAllStringSubmatch(content, -1)
	if len(matches) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(matches))
	out := make([]string, 0, len(matches))
	for _, match := range matches {
		if len(match) < 2 {
			continue
		}
		username := strings.TrimSpace(match[1])
		if username == "" {
			continue
		}
		if _, ok := seen[username]; ok {
			continue
		}
		seen[username] = struct{}{}
		out = append(out, username)
	}
	return out
}

func (s *Service) notifyMentions(ctx context.Context, content, actor string, referenceUid pgtype.UUID, isReply bool, skipUser string) {
	mentions := extractMentions(content)
	if len(mentions) == 0 {
		return
	}
	notificationType := "mention_question"
	if isReply {
		notificationType = "mention_reply"
	}
	for _, username := range mentions {
		if username == actor {
			continue
		}
		if skipUser != "" && username == skipUser {
			continue
		}
		exists, err := s.Repo.CheckUsernameExists(ctx, username)
		if err != nil || !exists {
			continue
		}
		_ = s.Repo.CreateNotification(ctx, database.CreateNotificationParams{
			UserUsername:  username,
			ActorUsername: pgtype.Text{String: actor, Valid: true},
			Type:          notificationType,
			ReferenceUid:  referenceUid,
		})
	}
}
