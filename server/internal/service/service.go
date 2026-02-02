package service

import (
	"echo/internal/repository"
)

type Service struct {
	Repo *repository.Repository
}

func New(repo *repository.Repository) *Service {
	return &Service{Repo: repo}
}

func (s *Service) Close() {
	if s.Repo != nil {
		s.Repo.Close()
	}
}
