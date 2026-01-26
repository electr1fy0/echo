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
	return s.Repo.CreateQuestion(ctx, database.CreateQuestionParams{
		Content:    pgtype.Text{String: question.Content, Valid: true},
		Author:     author,
		ChamberUid: pgtype.UUID{Bytes: uuid.UUID(question.ChamberUID), Valid: true},
	})
}

func (s *Service) GetQuestion(ctx context.Context, uid pgtype.UUID, currentUser string) (*types.QuestionItem, error) {
	row, err := s.Repo.GetQuestion(ctx, database.GetQuestionParams{
		CurrentUser: currentUser,
		Uid:         uid,
	})
	if err != nil {
		return nil, err
	}

	q := &types.QuestionItem{
		Question: types.Question{
			UID:            types.UUID(row.Uid.Bytes),
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
	return q, nil
}

func (s *Service) DeleteQuestion(ctx context.Context, uid pgtype.UUID, author string) error {
	qAuthor, err := s.Repo.GetQuestionAuthor(ctx, uid)
	if err == pgx.ErrNoRows {
		return errors.New("question not found")
	} else if err != nil {
		return err
	}

	if qAuthor != author {
		return errors.New("unauthorized")
	}

	return s.Repo.DeleteQuestion(ctx, database.DeleteQuestionParams{
		Uid:    uid,
		Author: author,
	})
}

func (s *Service) UpdateQuestion(ctx context.Context, uid pgtype.UUID, author string, content string) error {
	_, err := s.Repo.UpdateQuestion(ctx, database.UpdateQuestionParams{
		Content: pgtype.Text{String: content, Valid: true},
		Uid:     uid,
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
				UID:            types.UUID(row.Uid.Bytes),
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
			q.Question.ChamberUID = types.UUID(row.ChamberUid.Bytes)
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
				UID:            types.UUID(row.Uid.Bytes),
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

func (s *Service) UpdateQuestionVote(ctx context.Context, username string, quid pgtype.UUID) error {
	_, err := s.Repo.GetQuestionVote(ctx, database.GetQuestionVoteParams{
		Username:    username,
		QuestionUid: quid,
	})

	if err == pgx.ErrNoRows {
		err := s.Repo.CreateQuestionVote(ctx, database.CreateQuestionVoteParams{
			Username:    username,
			QuestionUid: quid,
		})
		if err != nil {
			return err
		}
		_ = s.Repo.IncrementQuestionUpvotes(ctx, quid)

		author, err := s.Repo.GetQuestionAuthor(ctx, quid)
		if err == nil && author != "" && author != username {
			exists, _ := s.Repo.CheckNotificationExists(ctx, database.CheckNotificationExistsParams{
				Type:          "upvote_question",
				ActorUsername: pgtype.Text{String: username, Valid: true},
				ReferenceUid:  quid,
			})
			if !exists {
				s.Repo.CreateNotification(ctx, database.CreateNotificationParams{
					UserUsername:  author,
					ActorUsername: pgtype.Text{String: username, Valid: true},
					Type:          "upvote_question",
					ReferenceUid:  quid,
				})
			}
		}
		return nil
	} else if err == nil {
		err := s.Repo.DeleteQuestionVote(ctx, database.DeleteQuestionVoteParams{
			Username:    username,
			QuestionUid: quid,
		})
		if err != nil {
			return err
		}
		_ = s.Repo.DecrementQuestionUpvotes(ctx, quid)
		return nil
	} else {
		return err
	}
}
