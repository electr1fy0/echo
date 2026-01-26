package repository

import (
	"context"
	"echo/internal/database"
)

func (r *Repository) ListChambers(ctx context.Context, arg database.ListChambersParams) ([]database.ListChambersRow, error) {
	return r.Q.ListChambers(ctx, arg)
}

func (r *Repository) CreateChamber(ctx context.Context, arg database.CreateChamberParams) error {
	return r.Q.CreateChamber(ctx, arg)
}

func (r *Repository) AddChamberMember(ctx context.Context, arg database.AddChamberMemberParams) error {
	return r.Q.AddChamberMember(ctx, arg)
}

func (r *Repository) DeleteChamber(ctx context.Context, arg database.DeleteChamberParams) error {
	return r.Q.DeleteChamber(ctx, arg)
}

func (r *Repository) JoinChamber(ctx context.Context, arg database.JoinChamberParams) error {
	return r.Q.JoinChamber(ctx, arg)
}

func (r *Repository) LeaveChamber(ctx context.Context, arg database.LeaveChamberParams) error {
	return r.Q.LeaveChamber(ctx, arg)
}
