package service

import (
	"context"
	"echo/internal/database"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func (s *Service) ListReplies(ctx context.Context, questionUID string, currentUser string) ([]database.ListRepliesRow, error) {
	qUID, err := uuid.Parse(questionUID)
	if err != nil {
		return nil, errors.New("invalid question uid")
	}
	return s.Repo.ListReplies(ctx, database.ListRepliesParams{
		QuestionUid: pgtype.UUID{Bytes: qUID, Valid: true},
		CurrentUser: currentUser,
	})
}

func (s *Service) CreateReply(ctx context.Context, questionUID string, author, content string) (string, error) {
	qUID, err := uuid.Parse(questionUID)
	if err != nil {
		return "", errors.New("invalid question uid")
	}
	newUID := uuid.New()
	
	err = s.Repo.CreateReply(ctx, database.CreateReplyParams{
		Uid:         pgtype.UUID{Bytes: newUID, Valid: true},
		Content:     content,
		QuestionUid: pgtype.UUID{Bytes: qUID, Valid: true},
		Author:      author,
		TimeCreated: pgtype.Timestamp{Time: time.Now().UTC(), Valid: true},
	})
	if err != nil {
		return "", err
	}

	qAuthor, err := s.Repo.GetQuestionAuthor(ctx, pgtype.UUID{Bytes: qUID, Valid: true})
	if err != nil {
		return newUID.String(), nil
	}

	if qAuthor != "" && qAuthor != author {
		_ = s.Repo.CreateNotification(ctx, database.CreateNotificationParams{
			UserUsername:  qAuthor,
			ActorUsername: pgtype.Text{String: author, Valid: true},
			Type:          "reply_question",
			ReferenceUid:  pgtype.UUID{Bytes: newUID, Valid: true},
		})
	}
	return newUID.String(), nil
}

func (s *Service) UpdateReply(ctx context.Context, uid string, author, content string) error {
	pUID, err := uuid.Parse(uid)
	if err != nil {
		return errors.New("invalid uid")
	}
	_, err = s.Repo.UpdateReply(ctx, database.UpdateReplyParams{
		Content: content,
		Uid:     pgtype.UUID{Bytes: pUID, Valid: true},
		Author:  author,
	})
	return err
}

func (s *Service) DeleteReply(ctx context.Context, uid, questionUID string, author string) error {
	pUID, err := uuid.Parse(uid)
	if err != nil {
		return errors.New("invalid uid")
	}
	qUID, err := uuid.Parse(questionUID)
	if err != nil {
		return errors.New("invalid question uid")
	}
	return s.Repo.DeleteReply(ctx, database.DeleteReplyParams{
		Uid:         pgtype.UUID{Bytes: pUID, Valid: true},
		QuestionUid: pgtype.UUID{Bytes: qUID, Valid: true},
		Author:      author,
	})
}

func (s *Service) UpdateReplyVote(ctx context.Context, username string, ruid string) error {
	pRUID, err := uuid.Parse(ruid)
	if err != nil {
		return errors.New("invalid uid")
	}
	ruidPg := pgtype.UUID{Bytes: pRUID, Valid: true}
	_, err = s.Repo.GetAnswerVote(ctx, database.GetAnswerVoteParams{
		Username:  username,
		AnswerUid: ruidPg,
	})

	if err == pgx.ErrNoRows {
		err := s.Repo.CreateAnswerVote(ctx, database.CreateAnswerVoteParams{
			Username:  username,
			AnswerUid: ruidPg,
		})
		if err != nil {
			return err
		}
		_ = s.Repo.IncrementAnswerUpvotes(ctx, ruidPg)

		author, err := s.Repo.GetAnswerAuthor(ctx, ruidPg)
		if err == nil && author != "" && author != username {
			exists, _ := s.Repo.CheckNotificationExists(ctx, database.CheckNotificationExistsParams{
				Type:          "upvote_reply",
				ActorUsername: pgtype.Text{String: username, Valid: true},
				ReferenceUid:  ruidPg,
			})
			if !exists {
				_ = s.Repo.CreateNotification(ctx, database.CreateNotificationParams{
					UserUsername:  author,
					ActorUsername: pgtype.Text{String: username, Valid: true},
					Type:          "upvote_reply",
					ReferenceUid:  ruidPg,
				})
			}
		}
		return nil
	} else if err == nil {
		err := s.Repo.DeleteAnswerVote(ctx, database.DeleteAnswerVoteParams{
			Username:  username,
			AnswerUid: ruidPg,
		})
		if err != nil {
			return err
		}
		_ = s.Repo.DecrementAnswerUpvotes(ctx, ruidPg)
		return nil
	} else {
		return err
	}
}
