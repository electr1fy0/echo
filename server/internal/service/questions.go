package service

import (
	"context"
	"echo/internal/database"
	"echo/internal/types"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type ListQuestionsParams struct {
	Limit            int
	Offset           int
	Sort             string
	Filter           string
	TargetChamberUID string
	Author           string
	CurrentUser      string
}

func (s *Service) ListQuestions(ctx context.Context, params ListQuestionsParams) ([]types.QuestionItem, error) {
	var targetChamber pgtype.UUID
	if params.TargetChamberUID != "" {
		u, err := uuid.Parse(params.TargetChamberUID)
		if err != nil {
			return nil, fmt.Errorf("invalid chamber uid: %w", err)
		}
		targetChamber = pgtype.UUID{Bytes: u, Valid: true}
	}

	var author pgtype.Text
	if params.Author != "" {
		author = pgtype.Text{String: params.Author, Valid: true}
	}

	var filterJoined pgtype.Bool
	if params.Filter == "joined" {
		filterJoined = pgtype.Bool{Bool: true, Valid: true}
	}

	rows, err := s.Q.ListQuestionsFiltered(ctx, database.ListQuestionsFilteredParams{
		CurrentUser:      params.CurrentUser,
		TargetChamberUid: targetChamber,
		Author:           author,
		FilterJoined:     filterJoined,
		Sort:             params.Sort,
		Limit:            int32(params.Limit),
		Offset:           int32(params.Offset),
	})
	if err != nil {
		return nil, err
	}
	questions := make([]types.QuestionItem, 0, len(rows))
	for _, row := range rows {
		questions = append(questions, questionItemFromListFilteredRow(row))
	}
	return questions, nil
}

func (s *Service) CreateQuestion(ctx context.Context, question types.Question, author string) (string, error) {
	chamberUUID, err := uuid.Parse(question.ChamberUID)
	if err != nil {
		return "", err
	}
	newUID := uuid.New()
	now := time.Now().UTC()
	_, err = s.Q.CreateQuestion(ctx, database.CreateQuestionParams{
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
	row, err := s.Q.GetQuestion(ctx, database.GetQuestionParams{
		CurrentUser: currentUser,
		Uid:         pgtype.UUID{Bytes: parsedUID, Valid: true},
	})
	if err != nil {
		return types.QuestionItem{}, err
	}
	return questionItemFromGetRow(row), nil
}

func (s *Service) DeleteQuestion(ctx context.Context, uid string, author string) error {
	parsedUID, err := uuid.Parse(uid)
	if err != nil {
		return ErrInvalidUID
	}
	uidPg := pgtype.UUID{Bytes: parsedUID, Valid: true}

	qAuthor, err := s.Q.GetQuestionAuthor(ctx, uidPg)
	if err == pgx.ErrNoRows {
		return ErrQuestionNotFound
	} else if err != nil {
		return err
	}

	if qAuthor != author {
		return ErrUnauthorized
	}

	return s.Q.DeleteQuestion(ctx, database.DeleteQuestionParams{
		Uid:    uidPg,
		Author: author,
	})
}

func (s *Service) UpdateQuestion(ctx context.Context, uid string, author string, content string) error {
	parsedUID, err := uuid.Parse(uid)
	if err != nil {
		return ErrInvalidUID
	}
	_, err = s.Q.UpdateQuestion(ctx, database.UpdateQuestionParams{
		Content: pgtype.Text{String: content, Valid: true},
		Uid:     pgtype.UUID{Bytes: parsedUID, Valid: true},
		Author:  author,
	})
	return err
}

func (s *Service) ListUserQuestions(ctx context.Context, limit, offset int32, currentUser, author string) ([]types.QuestionItem, error) {
	rows, err := s.Q.ListQuestionsByAuthor(ctx, database.ListQuestionsByAuthorParams{
		Limit:       limit,
		Offset:      offset,
		CurrentUser: currentUser,
		Author:      author,
	})
	if err != nil {
		return nil, err
	}
	questions := make([]types.QuestionItem, 0, len(rows))
	for _, row := range rows {
		questions = append(questions, questionItemFromListByAuthorRow(row))
	}
	return questions, nil
}

func (s *Service) SearchQuestions(ctx context.Context, query string, limit, offset int32, currentUser string) ([]types.QuestionItem, error) {
	rows, err := s.Q.SearchQuestions(ctx, database.SearchQuestionsParams{
		CurrentUser: currentUser,
		Query:       pgtype.Text{String: "%" + query + "%", Valid: true},
		Limit:       limit,
		Offset:      offset,
	})
	if err != nil {
		return nil, err
	}
	questions := make([]types.QuestionItem, 0, len(rows))
	for _, row := range rows {
		questions = append(questions, questionItemFromSearchRow(row))
	}
	return questions, nil
}

func (s *Service) PinQuestion(ctx context.Context, uid string, actor string) error {
	parsedUID, err := uuid.Parse(uid)
	if err != nil {
		return ErrInvalidUID
	}
	uidPg := pgtype.UUID{Bytes: parsedUID, Valid: true}
	creator, err := s.Q.GetChamberCreatorByQuestion(ctx, uidPg)
	if err == pgx.ErrNoRows {
		return ErrQuestionNotFound
	} else if err != nil {
		return err
	}
	if !creator.Valid {
		return ErrQuestionNotFound
	}
	if creator.String != actor {
		return ErrUnauthorized
	}
	rows, err := s.Q.SetQuestionPinnedAt(ctx, database.SetQuestionPinnedAtParams{
		PinnedAt: pgtype.Timestamp{Time: time.Now().UTC(), Valid: true},
		Uid:      uidPg,
	})
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
	creator, err := s.Q.GetChamberCreatorByQuestion(ctx, uidPg)
	if err == pgx.ErrNoRows {
		return ErrQuestionNotFound
	} else if err != nil {
		return err
	}
	if !creator.Valid {
		return ErrQuestionNotFound
	}
	if creator.String != actor {
		return ErrUnauthorized
	}
	rows, err := s.Q.ClearQuestionPinnedAt(ctx, uidPg)
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

	_, err = s.Q.GetQuestionVote(ctx, database.GetQuestionVoteParams{
		Username:    username,
		QuestionUid: quidPg,
	})

	if err == pgx.ErrNoRows {
		err := s.Q.CreateQuestionVote(ctx, database.CreateQuestionVoteParams{
			Username:    username,
			QuestionUid: quidPg,
		})
		if err != nil {
			return err
		}
		_ = s.Q.IncrementQuestionUpvotes(ctx, quidPg)

		author, err := s.Q.GetQuestionAuthor(ctx, quidPg)
		if err == nil && author != "" && author != username {
			_ = s.Q.CreateNotification(ctx, database.CreateNotificationParams{
				UserUsername:  author,
				ActorUsername: pgtype.Text{String: username, Valid: true},
				Type:          "upvote_question",
				ReferenceUid:  quidPg,
			})
		}
		return nil
	} else if err == nil {
		err := s.Q.DeleteQuestionVote(ctx, database.DeleteQuestionVoteParams{
			Username:    username,
			QuestionUid: quidPg,
		})
		if err != nil {
			return err
		}
		_ = s.Q.DecrementQuestionUpvotes(ctx, quidPg)
		return nil
	} else {
		return err
	}
}
