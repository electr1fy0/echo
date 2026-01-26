package service

import (
	"context"
	"echo/internal/database"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"time"
)

func (s *Service) ListReplies(ctx context.Context, questionUID pgtype.UUID, currentUser string) ([]database.ListRepliesRow, error) {
	return s.Repo.ListReplies(ctx, database.ListRepliesParams{
		QuestionUid: questionUID,
		CurrentUser: currentUser,
	})
}

func (s *Service) CreateReply(ctx context.Context, uid, questionUID pgtype.UUID, author, content string) error {
	err := s.Repo.CreateReply(ctx, database.CreateReplyParams{
		Uid:         uid,
		Content:     content,
		QuestionUid: questionUID,
		Author:      author,
		TimeCreated: pgtype.Timestamp{Time: time.Now().UTC(), Valid: true},
	})
	if err != nil {
		return err
	}

	qAuthor, err := s.Repo.GetQuestionAuthor(ctx, questionUID)
	if err != nil {
		return nil
	}

	if qAuthor != "" && qAuthor != author {
		_ = s.Repo.CreateNotification(ctx, database.CreateNotificationParams{
			UserUsername:  qAuthor,
			ActorUsername: pgtype.Text{String: author, Valid: true},
			Type:          "reply_question",
			ReferenceUid:  uid,
		})
	}
	return nil
}

func (s *Service) UpdateReply(ctx context.Context, uid pgtype.UUID, author, content string) error {
	_, err := s.Repo.UpdateReply(ctx, database.UpdateReplyParams{
		Content: content,
		Uid:     uid,
		Author:  author,
	})
	return err
}

func (s *Service) DeleteReply(ctx context.Context, uid, questionUID pgtype.UUID, author string) error {
	return s.Repo.DeleteReply(ctx, database.DeleteReplyParams{
		Uid:         uid,
		QuestionUid: questionUID,
		Author:      author,
	})
}

func (s *Service) UpdateReplyVote(ctx context.Context, username string, ruid pgtype.UUID) error {
	_, err := s.Repo.GetAnswerVote(ctx, database.GetAnswerVoteParams{
		Username:  username,
		AnswerUid: ruid,
	})

	if err == pgx.ErrNoRows {
		err := s.Repo.CreateAnswerVote(ctx, database.CreateAnswerVoteParams{
			Username:  username,
			AnswerUid: ruid,
		})
		if err != nil {
			return err
		}
		_ = s.Repo.IncrementAnswerUpvotes(ctx, ruid)

		author, err := s.Repo.GetAnswerAuthor(ctx, ruid)
		if err == nil && author != "" && author != username {
			exists, _ := s.Repo.CheckNotificationExists(ctx, database.CheckNotificationExistsParams{
				Type:          "upvote_reply",
				ActorUsername: pgtype.Text{String: username, Valid: true},
				ReferenceUid:  ruid,
			})
			if !exists {
				_ = s.Repo.CreateNotification(ctx, database.CreateNotificationParams{
					UserUsername:  author,
					ActorUsername: pgtype.Text{String: username, Valid: true},
					Type:          "upvote_reply",
					ReferenceUid:  ruid,
				})
			}
		}
		return nil
	} else if err == nil {
		err := s.Repo.DeleteAnswerVote(ctx, database.DeleteAnswerVoteParams{
			Username:  username,
			AnswerUid: ruid,
		})
		if err != nil {
			return err
		}
		_ = s.Repo.DecrementAnswerUpvotes(ctx, ruid)
		return nil
	} else {
		return err
	}
}
