package repository

import (
	"context"
	"echo/internal/database"
	"echo/internal/types"

	"github.com/jackc/pgx/v5/pgtype"
)

func (r *Repository) SearchChambers(ctx context.Context, query string, currentUser string) ([]types.Chamber, error) {
	rows, err := r.Q.SearchChambers(ctx, database.SearchChambersParams{
		Query:       pgtype.Text{String: query, Valid: true},
		CurrentUser: currentUser,
	})
	if err != nil {
		return nil, err
	}

	chambers := make([]types.Chamber, 0, len(rows))
	for _, row := range rows {
		chambers = append(chambers, chamberFromSearchRow(row))
	}
	return chambers, nil
}

func (r *Repository) SearchQuestionsPreview(ctx context.Context, query string, currentUser string) ([]types.QuestionItem, error) {
	rows, err := r.Q.SearchQuestions(ctx, database.SearchQuestionsParams{
		Query:       pgtype.Text{String: "%" + query + "%", Valid: true},
		CurrentUser: currentUser,
		Limit:       5,
		Offset:      0,
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

func (r *Repository) SearchReplies(ctx context.Context, query string, currentUser string) ([]types.AnswerItem, error) {
	rows, err := r.Q.SearchReplies(ctx, database.SearchRepliesParams{
		Query:       pgtype.Text{String: query, Valid: true},
		CurrentUser: currentUser,
	})
	if err != nil {
		return nil, err
	}

	replies := make([]types.AnswerItem, 0, len(rows))
	for _, row := range rows {
		replies = append(replies, answerItemFromSearchRow(row))
	}
	return replies, nil
}

func (r *Repository) SearchUsers(ctx context.Context, query string) ([]types.Profile, error) {
	rows, err := r.Q.SearchUsers(ctx, pgtype.Text{String: query, Valid: true})
	if err != nil {
		return nil, err
	}

	users := make([]types.Profile, 0, len(rows))
	for _, row := range rows {
		users = append(users, types.Profile{
			Username: row.Username,
			Avatar:   row.Avatar,
			Bio:      row.Bio,
		})
	}
	return users, nil
}
