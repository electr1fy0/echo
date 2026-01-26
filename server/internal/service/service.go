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
