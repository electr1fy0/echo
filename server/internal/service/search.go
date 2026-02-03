package service

import (
	"context"
	"echo/internal/types"
)

func (s *Service) GlobalSearch(ctx context.Context, query string, currentUser string) (types.SearchResponse, error) {
	resp := types.SearchResponse{
		Chambers:  []types.Chamber{},
		Questions: []types.QuestionItem{},
		Replies:   []types.AnswerItem{},
		Users:     []types.Profile{},
	}
	chambers, err := s.Repo.SearchChambers(ctx, query, currentUser)
	if err != nil {
		return resp, err
	}
	questions, err := s.Repo.SearchQuestionsPreview(ctx, query, currentUser)
	if err != nil {
		return resp, err
	}
	replies, err := s.Repo.SearchReplies(ctx, query, currentUser)
	if err != nil {
		return resp, err
	}
	users, err := s.Repo.SearchUsers(ctx, query)
	if err != nil {
		return resp, err
	}

	resp.Chambers = chambers
	resp.Questions = questions
	resp.Replies = replies
	resp.Users = users
	return resp, nil
}
