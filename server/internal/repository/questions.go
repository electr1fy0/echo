package repository

import (
	"context"
	"echo/internal/database"
	"echo/internal/types"
	"fmt"

	"github.com/google/uuid"
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

func (r *Repository) ListQuestions(ctx context.Context, params ListQuestionsParams) ([]types.QuestionItem, error) {
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

	rows, err := r.Q.ListQuestionsFiltered(ctx, database.ListQuestionsFilteredParams{
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

func (r *Repository) CreateQuestion(ctx context.Context, arg database.CreateQuestionParams) error {
	_, err := r.Q.CreateQuestion(ctx, arg)
	return err
}

func (r *Repository) GetQuestion(ctx context.Context, arg database.GetQuestionParams) (types.QuestionItem, error) {
	row, err := r.Q.GetQuestion(ctx, arg)
	if err != nil {
		return types.QuestionItem{}, err
	}
	return questionItemFromGetRow(row), nil
}

func (r *Repository) DeleteQuestion(ctx context.Context, arg database.DeleteQuestionParams) error {
	return r.Q.DeleteQuestion(ctx, arg)
}

func (r *Repository) UpdateQuestion(ctx context.Context, arg database.UpdateQuestionParams) (pgtype.UUID, error) {
	return r.Q.UpdateQuestion(ctx, arg)
}

func (r *Repository) ListUserQuestions(ctx context.Context, arg database.ListQuestionsByAuthorParams) ([]types.QuestionItem, error) {
	rows, err := r.Q.ListQuestionsByAuthor(ctx, arg)
	if err != nil {
		return nil, err
	}
	questions := make([]types.QuestionItem, 0, len(rows))
	for _, row := range rows {
		questions = append(questions, questionItemFromListByAuthorRow(row))
	}
	return questions, nil
}

func (r *Repository) SearchQuestions(ctx context.Context, arg database.SearchQuestionsParams) ([]types.QuestionItem, error) {
	rows, err := r.Q.SearchQuestions(ctx, arg)
	if err != nil {
		return nil, err
	}
	questions := make([]types.QuestionItem, 0, len(rows))
	for _, row := range rows {
		questions = append(questions, questionItemFromSearchRow(row))
	}
	return questions, nil
}

func (r *Repository) GetQuestionVote(ctx context.Context, arg database.GetQuestionVoteParams) (database.QuestionUpvote, error) {
	return r.Q.GetQuestionVote(ctx, arg)
}

func (r *Repository) CreateQuestionVote(ctx context.Context, arg database.CreateQuestionVoteParams) error {
	return r.Q.CreateQuestionVote(ctx, arg)
}

func (r *Repository) DeleteQuestionVote(ctx context.Context, arg database.DeleteQuestionVoteParams) error {
	return r.Q.DeleteQuestionVote(ctx, arg)
}

func (r *Repository) IncrementQuestionUpvotes(ctx context.Context, uid pgtype.UUID) error {
	return r.Q.IncrementQuestionUpvotes(ctx, uid)
}

func (r *Repository) DecrementQuestionUpvotes(ctx context.Context, uid pgtype.UUID) error {
	return r.Q.DecrementQuestionUpvotes(ctx, uid)
}

func (r *Repository) GetQuestionAuthor(ctx context.Context, uid pgtype.UUID) (string, error) {
	return r.Q.GetQuestionAuthor(ctx, uid)
}

func (r *Repository) CreateNotification(ctx context.Context, arg database.CreateNotificationParams) error {
	return r.Q.CreateNotification(ctx, arg)
}

func (r *Repository) GetChamberCreatorByQuestion(ctx context.Context, questionUid pgtype.UUID) (string, error) {
	creator, err := r.Q.GetChamberCreatorByQuestion(ctx, questionUid)
	if err != nil {
		return "", err
	}
	if !creator.Valid {
		return "", nil
	}
	return creator.String, nil
}

func (r *Repository) SetQuestionPinnedAt(ctx context.Context, questionUid pgtype.UUID, pinnedAt pgtype.Timestamp) (int64, error) {
	return r.Q.SetQuestionPinnedAt(ctx, database.SetQuestionPinnedAtParams{
		PinnedAt: pinnedAt,
		Uid:      questionUid,
	})
}

func (r *Repository) ClearQuestionPinnedAt(ctx context.Context, questionUid pgtype.UUID) (int64, error) {
	return r.Q.ClearQuestionPinnedAt(ctx, questionUid)
}

func (r *Repository) SetQuestionAcceptedAnswer(ctx context.Context, questionUid pgtype.UUID, answerUid pgtype.UUID) (int64, error) {
	return r.Q.SetQuestionAcceptedAnswer(ctx, database.SetQuestionAcceptedAnswerParams{
		AcceptedAnswerUid: answerUid,
		Uid:               questionUid,
	})
}

func (r *Repository) ClearQuestionAcceptedAnswer(ctx context.Context, questionUid pgtype.UUID, answerUid pgtype.UUID) (int64, error) {
	return r.Q.ClearQuestionAcceptedAnswer(ctx, database.ClearQuestionAcceptedAnswerParams{
		Uid:               questionUid,
		AcceptedAnswerUid: answerUid,
	})
}
