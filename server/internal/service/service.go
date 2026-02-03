package service

import (
	"echo/internal/database"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	DB *pgxpool.Pool
	Q  *database.Queries
}

func New(db *pgxpool.Pool) *Service {
	return &Service{
		DB: db,
		Q:  database.New(db),
	}
}

func (s *Service) Close() {
	if s.DB != nil {
		s.DB.Close()
	}
}
