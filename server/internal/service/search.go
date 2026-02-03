package service

import (
	"context"
	"echo/internal/database"
	"echo/internal/types"

	"github.com/jackc/pgx/v5/pgtype"
)

func (s *Service) GlobalSearch(ctx context.Context, query string, currentUser string) (types.SearchResponse, error) {
	resp := types.SearchResponse{
		Chambers:  []types.Chamber{},
		Questions: []types.QuestionItem{},
		Replies:   []types.AnswerItem{},
		Users:     []types.Profile{},
	}
	chambers, err := s.Q.SearchChambers(ctx, database.SearchChambersParams{
		Query:       pgtype.Text{String: query, Valid: true},
		CurrentUser: currentUser,
	})
	if err != nil {
		return resp, err
	}
	questions, err := s.Q.SearchQuestions(ctx, database.SearchQuestionsParams{
		Query:       pgtype.Text{String: "%" + query + "%", Valid: true},
		CurrentUser: currentUser,
		Limit:       5,
		Offset:      0,
	})
	if err != nil {
		return resp, err
	}
	replies, err := s.Q.SearchReplies(ctx, database.SearchRepliesParams{
		Query:       pgtype.Text{String: query, Valid: true},
		CurrentUser: currentUser,
	})
	if err != nil {
		return resp, err
	}
	users, err := s.Q.SearchUsers(ctx, pgtype.Text{String: query, Valid: true})
	if err != nil {
		return resp, err
	}

	resp.Chambers = mapSearchChambers(chambers)
	resp.Questions = mapSearchQuestions(questions)
	resp.Replies = mapSearchReplies(replies)
	resp.Users = mapSearchUsers(users)
	return resp, nil
}
