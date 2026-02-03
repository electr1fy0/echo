package service

import (
	"context"
	"echo/internal/database"
	"echo/internal/repository"
	"echo/internal/types"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func (s *Service) ListQuestions(ctx context.Context, params repository.ListQuestionsParams) ([]types.QuestionItem, error) {
	return s.Repo.ListQuestions(ctx, params)
}

func (s *Service) CreateQuestion(ctx context.Context, question types.Question, author string) (string, error) {
	chamberUUID, err := uuid.Parse(question.ChamberUID)
	if err != nil {
		return "", err
	}
	newUID := uuid.New()
	now := time.Now().UTC()
	err = s.Repo.CreateQuestion(ctx, database.CreateQuestionParams{
		Uid:         pgtype.UUID{Bytes: newUID, Valid: true},
		Content:     pgtype.Text{String: question.Content, Valid: true},
		Author:      author,
		ChamberUid:  pgtype.UUID{Bytes: chamberUUID, Valid: true},
		TimeCreated: pgtype.Timestamp{Time: now, Valid: true},
	})
	if err != nil {
		return "", err
	}
	s.notifyMentions(ctx, question.Content, author, pgtype.UUID{Bytes: newUID, Valid: true}, false, "")
	return newUID.String(), nil
}

func (s *Service) GetQuestion(ctx context.Context, uid string, currentUser string) (types.QuestionItem, error) {
	parsedUID, err := uuid.Parse(uid)
	if err != nil {
		return types.QuestionItem{}, ErrInvalidUID
	}
	return s.Repo.GetQuestion(ctx, database.GetQuestionParams{
		CurrentUser: currentUser,
		Uid:         pgtype.UUID{Bytes: parsedUID, Valid: true},
	})
}

func (s *Service) DeleteQuestion(ctx context.Context, uid string, author string) error {
	parsedUID, err := uuid.Parse(uid)
	if err != nil {
		return ErrInvalidUID
	}
	uidPg := pgtype.UUID{Bytes: parsedUID, Valid: true}

	qAuthor, err := s.Repo.GetQuestionAuthor(ctx, uidPg)
	if err == pgx.ErrNoRows {
		return ErrQuestionNotFound
	} else if err != nil {
		return err
	}

	if qAuthor != author {
		return ErrUnauthorized
	}

	return s.Repo.DeleteQuestion(ctx, database.DeleteQuestionParams{
		Uid:    uidPg,
		Author: author,
	})
}

func (s *Service) UpdateQuestion(ctx context.Context, uid string, author string, content string) error {
	parsedUID, err := uuid.Parse(uid)
	if err != nil {
		return ErrInvalidUID
	}
	_, err = s.Repo.UpdateQuestion(ctx, database.UpdateQuestionParams{
		Content: pgtype.Text{String: content, Valid: true},
		Uid:     pgtype.UUID{Bytes: parsedUID, Valid: true},
		Author:  author,
	})
	return err
}

func (s *Service) ListUserQuestions(ctx context.Context, limit, offset int32, currentUser, author string) ([]types.QuestionItem, error) {
	return s.Repo.ListUserQuestions(ctx, database.ListQuestionsByAuthorParams{
		Limit:       limit,
		Offset:      offset,
		CurrentUser: currentUser,
		Author:      author,
	})
}

func (s *Service) SearchQuestions(ctx context.Context, query string, limit, offset int32, currentUser string) ([]types.QuestionItem, error) {
	return s.Repo.SearchQuestions(ctx, database.SearchQuestionsParams{
		CurrentUser: currentUser,
		Query:       pgtype.Text{String: "%" + query + "%", Valid: true},
		Limit:       limit,
		Offset:      offset,
	})
}

func (s *Service) PinQuestion(ctx context.Context, uid string, actor string) error {
	parsedUID, err := uuid.Parse(uid)
	if err != nil {
		return ErrInvalidUID
	}
	uidPg := pgtype.UUID{Bytes: parsedUID, Valid: true}
	creator, err := s.Repo.GetChamberCreatorByQuestion(ctx, uidPg)
	if err == pgx.ErrNoRows {
		return ErrQuestionNotFound
	} else if err != nil {
		return err
	}
	if creator != actor {
		return ErrUnauthorized
	}
	rows, err := s.Repo.SetQuestionPinnedAt(ctx, uidPg, pgtype.Timestamp{Time: time.Now().UTC(), Valid: true})
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrQuestionNotFound
	}
	return nil
}

func (s *Service) UnpinQuestion(ctx context.Context, uid string, actor string) error {
	parsedUID, err := uuid.Parse(uid)
	if err != nil {
		return ErrInvalidUID
	}
	uidPg := pgtype.UUID{Bytes: parsedUID, Valid: true}
	creator, err := s.Repo.GetChamberCreatorByQuestion(ctx, uidPg)
	if err == pgx.ErrNoRows {
		return ErrQuestionNotFound
	} else if err != nil {
		return err
	}
	if creator != actor {
		return ErrUnauthorized
	}
	rows, err := s.Repo.ClearQuestionPinnedAt(ctx, uidPg)
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrQuestionNotFound
	}
	return nil
}

func (s *Service) UpdateQuestionVote(ctx context.Context, username string, quid string) error {
	parsedUID, err := uuid.Parse(quid)
	if err != nil {
		return ErrInvalidUID
	}
	quidPg := pgtype.UUID{Bytes: parsedUID, Valid: true}

	_, err = s.Repo.GetQuestionVote(ctx, database.GetQuestionVoteParams{
		Username:    username,
		QuestionUid: quidPg,
	})

	if err == pgx.ErrNoRows {
		err := s.Repo.CreateQuestionVote(ctx, database.CreateQuestionVoteParams{
			Username:    username,
			QuestionUid: quidPg,
		})
		if err != nil {
			return err
		}
		_ = s.Repo.IncrementQuestionUpvotes(ctx, quidPg)

		author, err := s.Repo.GetQuestionAuthor(ctx, quidPg)
		if err == nil && author != "" && author != username {
			_ = s.Repo.CreateNotification(ctx, database.CreateNotificationParams{
				UserUsername:  author,
				ActorUsername: pgtype.Text{String: username, Valid: true},
				Type:          "upvote_question",
				ReferenceUid:  quidPg,
			})
		}
		return nil
	} else if err == nil {
		err := s.Repo.DeleteQuestionVote(ctx, database.DeleteQuestionVoteParams{
			Username:    username,
			QuestionUid: quidPg,
		})
		if err != nil {
			return err
		}
		_ = s.Repo.DecrementQuestionUpvotes(ctx, quidPg)
		return nil
	} else {
		return err
	}
}
