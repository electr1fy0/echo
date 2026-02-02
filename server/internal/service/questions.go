package service

import (
	"context"
	"echo/internal/database"
	"echo/internal/repository"
	"echo/internal/types"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func (s *Service) ListQuestions(ctx context.Context, params repository.ListQuestionsParams) ([]types.QuestionItem, error) {
	return s.Repo.ListQuestions(ctx, params)
}

func (s *Service) CreateQuestion(ctx context.Context, question types.Question, author string) error {
	chamberUUID, err := uuid.Parse(question.ChamberUID)
	if err != nil {
		return err
	}
	return s.Repo.CreateQuestion(ctx, database.CreateQuestionParams{
		Content:    pgtype.Text{String: question.Content, Valid: true},
		Author:     author,
		ChamberUid: pgtype.UUID{Bytes: chamberUUID, Valid: true},
	})
}

func (s *Service) GetQuestion(ctx context.Context, uid string, currentUser string) (*types.QuestionItem, error) {
	parsedUID, err := uuid.Parse(uid)
	if err != nil {
		return nil, errors.New("invalid uid")
	}
	row, err := s.Repo.GetQuestion(ctx, database.GetQuestionParams{
		CurrentUser: currentUser,
		Uid:         pgtype.UUID{Bytes: parsedUID, Valid: true},
	})
	if err != nil {
		return nil, err
	}

	q := &types.QuestionItem{
		Question: types.Question{
			UID:            uuid.UUID(row.Uid.Bytes).String(),
			Content:        row.Content.String,
			TimeCreated:    row.TimeCreated.Time,
			Upvotes:        int(row.Upvotes.Int32),
			IsUpvoted:      row.IsUpvoted,
			AuthorUsername: row.Author,
			ChamberName:    row.ChamberName,
		},
		Author: types.Profile{
			Username: row.Author,
			Avatar:   row.Avatar.String,
		},
	}
	if row.ChamberUid.Valid {
		q.Question.ChamberUID = uuid.UUID(row.ChamberUid.Bytes).String()
	}
	return q, nil
}

func (s *Service) DeleteQuestion(ctx context.Context, uid string, author string) error {
	parsedUID, err := uuid.Parse(uid)
	if err != nil {
		return errors.New("invalid uid")
	}
	uidPg := pgtype.UUID{Bytes: parsedUID, Valid: true}

	qAuthor, err := s.Repo.GetQuestionAuthor(ctx, uidPg)
	if err == pgx.ErrNoRows {
		return errors.New("question not found")
	} else if err != nil {
		return err
	}

	if qAuthor != author {
		return errors.New("unauthorized")
	}

	return s.Repo.DeleteQuestion(ctx, database.DeleteQuestionParams{
		Uid:    uidPg,
		Author: author,
	})
}

func (s *Service) UpdateQuestion(ctx context.Context, uid string, author string, content string) error {
	parsedUID, err := uuid.Parse(uid)
	if err != nil {
		return errors.New("invalid uid")
	}
	_, err = s.Repo.UpdateQuestion(ctx, database.UpdateQuestionParams{
		Content: pgtype.Text{String: content, Valid: true},
		Uid:     pgtype.UUID{Bytes: parsedUID, Valid: true},
		Author:  author,
	})
	return err
}

func (s *Service) ListUserQuestions(ctx context.Context, limit, offset int32, currentUser, author string) ([]types.QuestionItem, error) {
	rows, err := s.Repo.ListUserQuestions(ctx, database.ListQuestionsByAuthorParams{
		Limit:       limit,
		Offset:      offset,
		CurrentUser: currentUser,
		Author:      author,
	})
	if err != nil {
		return nil, err
	}

	questions := make([]types.QuestionItem, 0)
	for _, row := range rows {
		q := types.QuestionItem{
			Question: types.Question{
				UID:            uuid.UUID(row.Uid.Bytes).String(),
				Content:        row.Content.String,
				TimeCreated:    row.TimeCreated.Time,
				Upvotes:        int(row.Upvotes.Int32),
				IsUpvoted:      row.IsUpvoted,
				AuthorUsername: row.Author,
			},
			Author: types.Profile{
				Username: row.Author,
				Avatar:   row.Avatar.String,
			},
		}
		if row.ChamberUid.Valid {
			q.Question.ChamberUID = uuid.UUID(row.ChamberUid.Bytes).String()
		}
		q.Question.ChamberName = row.ChamberName
		questions = append(questions, q)
	}
	return questions, nil
}

func (s *Service) SearchQuestions(ctx context.Context, query string, limit, offset int32, currentUser string) ([]types.QuestionItem, error) {
	rows, err := s.Repo.SearchQuestions(ctx, database.SearchQuestionsParams{
		CurrentUser: currentUser,
		Query:       pgtype.Text{String: "%" + query + "%", Valid: true},
		Limit:       limit,
		Offset:      offset,
	})
	if err != nil {
		return nil, err
	}

	questions := make([]types.QuestionItem, 0)
	for _, row := range rows {
		q := types.QuestionItem{
			Question: types.Question{
				UID:            uuid.UUID(row.Uid.Bytes).String(),
				Content:        row.Content.String,
				TimeCreated:    row.TimeCreated.Time,
				Upvotes:        int(row.UpvotesCount.Int32),
				IsUpvoted:      row.IsUpvoted,
				AuthorUsername: row.Author,
			},
			Author: types.Profile{
				Username: row.Author,
				Avatar:   row.Avatar.String,
			},
		}
		questions = append(questions, q)
	}
	return questions, nil
}

func (s *Service) UpdateQuestionVote(ctx context.Context, username string, quid string) error {
	parsedUID, err := uuid.Parse(quid)
	if err != nil {
		return errors.New("invalid uid")
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
			exists, _ := s.Repo.CheckNotificationExists(ctx, database.CheckNotificationExistsParams{
				Type:          "upvote_question",
				ActorUsername: pgtype.Text{String: username, Valid: true},
				ReferenceUid:  quidPg,
			})
			if !exists {
				s.Repo.CreateNotification(ctx, database.CreateNotificationParams{
					UserUsername:  author,
					ActorUsername: pgtype.Text{String: username, Valid: true},
					Type:          "upvote_question",
					ReferenceUid:  quidPg,
				})
			}
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
