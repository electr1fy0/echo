package repository

import (
	"context"
	"echo/internal/database"
	"echo/internal/types"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func (r *Repository) SearchChambersRaw(ctx context.Context, query string, currentUser string) ([]types.Chamber, error) {
	rows, err := r.Q.SearchChambers(ctx, database.SearchChambersParams{
		Query:       pgtype.Text{String: query, Valid: true},
		CurrentUser: currentUser,
	})
	if err != nil {
		return nil, err
	}

	var chambers []types.Chamber
	for _, row := range rows {
		chambers = append(chambers, types.Chamber{
			UID:         uuid.UUID(row.Uid.Bytes).String(),
			Name:        row.Name,
			Description: row.Description,
			ColorIndex:  row.ColorIndex.Int32,
			TimeCreated: row.CreatedAt.Time,
			MemberCount: int(row.MemberCount),
			IsJoined:    row.IsJoined,
		})
	}
	return chambers, nil
}

func (r *Repository) SearchQuestionsRaw(ctx context.Context, query string, currentUser string) ([]types.QuestionItem, error) {
	rows, err := r.Q.SearchQuestions(ctx, database.SearchQuestionsParams{
		Query:       pgtype.Text{String: "%" + query + "%", Valid: true},
		CurrentUser: currentUser,
	})
	if err != nil {
		return nil, err
	}

	var questions []types.QuestionItem
	for _, row := range rows {
		q := types.QuestionItem{
			Question: types.Question{
				UID:            uuid.UUID(row.Uid.Bytes).String(),
				Content:        row.Content.String,
				TimeCreated:    row.TimeCreated.Time,
				AuthorUsername: row.Author,
				Upvotes:        int(row.UpvotesCount.Int32),
				IsUpvoted:      row.IsUpvoted,
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

func (r *Repository) SearchRepliesRaw(ctx context.Context, query string, currentUser string) ([]types.AnswerItem, error) {
	rows, err := r.Q.SearchReplies(ctx, database.SearchRepliesParams{
		Query:       pgtype.Text{String: query, Valid: true},
		CurrentUser: currentUser,
	})
	if err != nil {
		return nil, err
	}

	var replies []types.AnswerItem
	for _, row := range rows {
		ans := types.AnswerItem{
			Answer: types.Answer{
				UID:            uuid.UUID(row.Uid.Bytes).String(),
				Content:        row.Content,
				TimeCreated:    row.TimeCreated.Time,
				QuestionUID:    uuid.UUID(row.QuestionUid.Bytes).String(),
				AuthorUsername: row.Author,
				Upvotes:        int(row.UpvotesCount.Int32),
				IsUpvoted:      row.IsUpvoted,
			},
			Author: types.Profile{
				Username: row.Author,
				Avatar:   row.Avatar.String,
			},
		}
		replies = append(replies, ans)
	}
	return replies, nil
}

func (r *Repository) SearchUsersRaw(ctx context.Context, query string) ([]types.Profile, error) {
	rows, err := r.Q.SearchUsers(ctx, pgtype.Text{String: query, Valid: true})
	if err != nil {
		return nil, err
	}

	var users []types.Profile
	for _, row := range rows {
		users = append(users, types.Profile{
			Username: row.Username,
			Avatar:   row.Avatar,
			Bio:      row.Bio,
		})
	}
	return users, nil
}
