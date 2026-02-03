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

	questions := make([]types.QuestionItem, 0)
	for _, row := range rows {
		q := types.QuestionItem{
			Question: types.Question{
				UID:            uuid.UUID(row.Uid.Bytes).String(),
				Content:        row.Content.String,
				TimeCreated:    row.TimeCreated.Time,
				AuthorUsername: row.Author,
				Upvotes:        int(row.Upvotes.Int32),
				IsUpvoted:      row.IsUpvoted,
				ChamberName:    row.ChamberName,
				IsPinned:       row.PinnedAt.Valid,
			},
			Author: types.Profile{
				Username: row.Author,
				Avatar:   row.Avatar.String,
			},
		}
		if row.AcceptedAnswerUid.Valid {
			q.Question.AcceptedAnswerUID = uuid.UUID(row.AcceptedAnswerUid.Bytes).String()
		}
		if row.ChamberUid.Valid {
			q.Question.ChamberUID = uuid.UUID(row.ChamberUid.Bytes).String()
		}
		questions = append(questions, q)
	}
	return questions, nil
}

func (r *Repository) CreateQuestion(ctx context.Context, arg database.CreateQuestionParams) error {
	_, err := r.Q.CreateQuestion(ctx, arg)
	return err
}

func (r *Repository) GetQuestion(ctx context.Context, arg database.GetQuestionParams) (database.GetQuestionRow, error) {
	return r.Q.GetQuestion(ctx, arg)
}

func (r *Repository) DeleteQuestion(ctx context.Context, arg database.DeleteQuestionParams) error {
	return r.Q.DeleteQuestion(ctx, arg)
}

func (r *Repository) UpdateQuestion(ctx context.Context, arg database.UpdateQuestionParams) (pgtype.UUID, error) {
	return r.Q.UpdateQuestion(ctx, arg)
}

func (r *Repository) ListUserQuestions(ctx context.Context, arg database.ListQuestionsByAuthorParams) ([]database.ListQuestionsByAuthorRow, error) {
	return r.Q.ListQuestionsByAuthor(ctx, arg)
}

func (r *Repository) SearchQuestions(ctx context.Context, arg database.SearchQuestionsParams) ([]database.SearchQuestionsRow, error) {
	return r.Q.SearchQuestions(ctx, arg)
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

func (r *Repository) CheckNotificationExists(ctx context.Context, arg database.CheckNotificationExistsParams) (bool, error) {
	return r.Q.CheckNotificationExists(ctx, arg)
}

func (r *Repository) CreateNotification(ctx context.Context, arg database.CreateNotificationParams) error {
	return r.Q.CreateNotification(ctx, arg)
}

func (r *Repository) GetChamberCreatorByQuestion(ctx context.Context, questionUid pgtype.UUID) (string, error) {
	row := r.DB.QueryRow(ctx, `
		SELECT c.creator_username
		FROM chambers c
		JOIN questions q ON q.chamber_uid = c.uid
		WHERE q.uid = $1
	`, questionUid)
	var creator pgtype.Text
	if err := row.Scan(&creator); err != nil {
		return "", err
	}
	if !creator.Valid {
		return "", nil
	}
	return creator.String, nil
}

func (r *Repository) SetQuestionPinnedAt(ctx context.Context, questionUid pgtype.UUID, pinnedAt pgtype.Timestamp) (int64, error) {
	tag, err := r.DB.Exec(ctx, `UPDATE questions SET pinned_at = $1 WHERE uid = $2`, pinnedAt, questionUid)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (r *Repository) ClearQuestionPinnedAt(ctx context.Context, questionUid pgtype.UUID) (int64, error) {
	tag, err := r.DB.Exec(ctx, `UPDATE questions SET pinned_at = NULL WHERE uid = $1`, questionUid)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (r *Repository) SetQuestionAcceptedAnswer(ctx context.Context, questionUid pgtype.UUID, answerUid pgtype.UUID) (int64, error) {
	tag, err := r.DB.Exec(ctx, `
		UPDATE questions q
		SET accepted_answer_uid = $1
		FROM answers a
		WHERE q.uid = $2 AND a.uid = $1 AND a.question_uid = q.uid
	`, answerUid, questionUid)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (r *Repository) ClearQuestionAcceptedAnswer(ctx context.Context, questionUid pgtype.UUID, answerUid pgtype.UUID) (int64, error) {
	tag, err := r.DB.Exec(ctx, `
		UPDATE questions
		SET accepted_answer_uid = NULL
		WHERE uid = $1 AND accepted_answer_uid = $2
	`, questionUid, answerUid)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}
