package service

import (
	"context"
	"echo/internal/database"
	"echo/internal/types"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func (s *Service) ListReplies(ctx context.Context, questionUID string, currentUser string) ([]types.AnswerItem, error) {
	qUID, err := uuid.Parse(questionUID)
	if err != nil {
		return nil, ErrInvalidQuestionUID
	}
	return s.Repo.ListReplies(ctx, database.ListRepliesParams{
		QuestionUid: pgtype.UUID{Bytes: qUID, Valid: true},
		CurrentUser: currentUser,
	})
}

func (s *Service) CreateReply(ctx context.Context, questionUID string, author, content string) (string, error) {
	qUID, err := uuid.Parse(questionUID)
	if err != nil {
		return "", ErrInvalidQuestionUID
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
		s.notifyMentions(ctx, content, author, pgtype.UUID{Bytes: newUID, Valid: true}, true, "")
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
	s.notifyMentions(ctx, content, author, pgtype.UUID{Bytes: newUID, Valid: true}, true, qAuthor)
	return newUID.String(), nil
}

func (s *Service) UpdateReply(ctx context.Context, uid string, author, content string) error {
	pUID, err := uuid.Parse(uid)
	if err != nil {
		return ErrInvalidReplyUID
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
		return ErrInvalidReplyUID
	}
	qUID, err := uuid.Parse(questionUID)
	if err != nil {
		return ErrInvalidQuestionUID
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
		return ErrInvalidReplyUID
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
			_ = s.Repo.CreateNotification(ctx, database.CreateNotificationParams{
				UserUsername:  author,
				ActorUsername: pgtype.Text{String: username, Valid: true},
				Type:          "upvote_reply",
				ReferenceUid:  ruidPg,
			})
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

func (s *Service) AcceptReply(ctx context.Context, questionUID, replyUID, actor string) error {
	qUID, err := uuid.Parse(questionUID)
	if err != nil {
		return ErrInvalidQuestionUID
	}
	rUID, err := uuid.Parse(replyUID)
	if err != nil {
		return ErrInvalidReplyUID
	}
	qUidPg := pgtype.UUID{Bytes: qUID, Valid: true}
	qAuthor, err := s.Repo.GetQuestionAuthor(ctx, qUidPg)
	if err == pgx.ErrNoRows {
		return ErrQuestionNotFound
	} else if err != nil {
		return err
	}
	if qAuthor != actor {
		return ErrUnauthorized
	}
	rows, err := s.Repo.SetQuestionAcceptedAnswer(ctx, qUidPg, pgtype.UUID{Bytes: rUID, Valid: true})
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrReplyNotFound
	}
	return nil
}

func (s *Service) UnacceptReply(ctx context.Context, questionUID, replyUID, actor string) error {
	qUID, err := uuid.Parse(questionUID)
	if err != nil {
		return ErrInvalidQuestionUID
	}
	rUID, err := uuid.Parse(replyUID)
	if err != nil {
		return ErrInvalidReplyUID
	}
	qUidPg := pgtype.UUID{Bytes: qUID, Valid: true}
	qAuthor, err := s.Repo.GetQuestionAuthor(ctx, qUidPg)
	if err == pgx.ErrNoRows {
		return ErrQuestionNotFound
	} else if err != nil {
		return err
	}
	if qAuthor != actor {
		return ErrUnauthorized
	}
	rows, err := s.Repo.ClearQuestionAcceptedAnswer(ctx, qUidPg, pgtype.UUID{Bytes: rUID, Valid: true})
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrReplyNotFound
	}
	return nil
}
