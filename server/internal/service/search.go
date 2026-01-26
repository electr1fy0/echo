package service

import (
	"context"
	"echo/internal/types"
	"sync"
)

func (s *Service) GlobalSearch(ctx context.Context, query string, currentUser string) (types.SearchResponse, error) {
	var wg sync.WaitGroup
	resp := types.SearchResponse{
		Chambers:  []types.Chamber{},
		Questions: []types.QuestionItem{},
		Replies:   []types.AnswerItem{},
		Users:     []types.Profile{},
	}
	var respMutex sync.Mutex

	wg.Add(4)

	go func() {
		defer wg.Done()
		chambers, _ := s.Repo.SearchChambersRaw(ctx, query, currentUser)
		if len(chambers) > 0 {
			respMutex.Lock()
			resp.Chambers = chambers
			respMutex.Unlock()
		}
	}()

	go func() {
		defer wg.Done()
		questions, _ := s.Repo.SearchQuestionsRaw(ctx, query, currentUser)
		if len(questions) > 0 {
			respMutex.Lock()
			resp.Questions = questions
			respMutex.Unlock()
		}
	}()

	go func() {
		defer wg.Done()
		replies, _ := s.Repo.SearchRepliesRaw(ctx, query, currentUser)
		if len(replies) > 0 {
			respMutex.Lock()
			resp.Replies = replies
			respMutex.Unlock()
		}
	}()

	go func() {
		defer wg.Done()
		users, _ := s.Repo.SearchUsersRaw(ctx, query)
		if len(users) > 0 {
			respMutex.Lock()
			resp.Users = users
			respMutex.Unlock()
		}
	}()

	wg.Wait()
	return resp, nil
}
