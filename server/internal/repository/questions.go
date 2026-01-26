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
	orderBy := "q.time_created desc"
	if params.Sort == "votes" {
		orderBy = "q.upvotes_count desc"
	}

	baseQuery := `
		select
			q.uid,
			q.content,
			q.time_created,
			q.author,
			u.avatar,
			q.upvotes_count as upvotes,
			exists (
				select 1 from question_upvotes v2
				where v2.question_uid = q.uid and v2.username = $1
			) as is_upvoted,
			q.chamber_uid,
			coalesce(c.name, '') as chamber_name
		from questions q
		left join users u
			on u.username = q.author
		left join chambers c
			on c.uid = q.chamber_uid
	`
	whereConditions := []string{}
	args := []any{params.CurrentUser}
	argCount := 2

	if params.Filter == "joined" {
		baseQuery += ` join chamber_members cm on cm.chamber_uid = q.chamber_uid `
		whereConditions = append(whereConditions, "cm.username = $1")
	}
	if params.TargetChamberUID != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("q.chamber_uid = $%d", argCount))
		args = append(args, params.TargetChamberUID)
		argCount++
	}
	if params.Author != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("q.author = $%d", argCount))
		args = append(args, params.Author)
		argCount++
	}

	args = append(args, params.Limit)
	limitArg := argCount
	argCount++

	args = append(args, params.Offset)
	offsetArg := argCount

	if len(whereConditions) > 0 {
		baseQuery += " WHERE " + whereConditions[0]
		for i := 1; i < len(whereConditions); i++ {
			baseQuery += " AND " + whereConditions[i]
		}
	}
	finalQuery := fmt.Sprintf("%s order by %s limit $%d offset $%d", baseQuery, orderBy, limitArg, offsetArg)

	rows, err := r.DB.Query(ctx, finalQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	questions := make([]types.QuestionItem, 0)
	for rows.Next() {
		var q types.QuestionItem
		var avatar *string
		var chamberUID *uuid.UUID
		var chamberName string
		err := rows.Scan(&q.Question.UID, &q.Question.Content, &q.Question.TimeCreated, &q.Question.AuthorUsername, &avatar, &q.Question.Upvotes, &q.Question.IsUpvoted, &chamberUID, &chamberName)
		if err != nil {
			return nil, err
		}
		if avatar != nil {
			q.Author.Avatar = *avatar
		}
		if chamberUID != nil {
			q.Question.ChamberUID = types.UUID(*chamberUID)
		}
		q.Question.ChamberName = chamberName
		q.Author.Username = q.Question.AuthorUsername
		questions = append(questions, q)
	}
	if rows.Err() != nil {
		return nil, rows.Err()
	}
	return questions, nil
}

func (r *Repository) CreateQuestion(ctx context.Context, arg database.CreateQuestionParams) error {
	return r.Q.CreateQuestion(ctx, arg)
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
