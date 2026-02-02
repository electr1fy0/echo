package repository

import (
	"echo/internal/database"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	DB *pgxpool.Pool
	Q  *database.Queries
}

func New(db *pgxpool.Pool) *Repository {
	return &Repository{
		DB: db,
		Q:  database.New(db),
	}
}

func (r *Repository) Close() {
	if r.DB != nil {
		r.DB.Close()
	}
}
