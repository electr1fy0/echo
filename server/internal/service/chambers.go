package service

import (
	"context"
	"echo/internal/database"
	"github.com/jackc/pgx/v5/pgtype"
)

func (s *Service) CreateChamber(ctx context.Context, uid pgtype.UUID, name, description, creator string, colorIndex int32) error {
	err := s.Repo.CreateChamber(ctx, database.CreateChamberParams{
		Uid:             uid,
		Name:            name,
		Description:     pgtype.Text{String: description, Valid: true},
		CreatorUsername: pgtype.Text{String: creator, Valid: true},
		ColorIndex:      pgtype.Int4{Int32: colorIndex, Valid: true},
	})
	if err != nil {
		return err
	}
	return s.Repo.AddChamberMember(ctx, database.AddChamberMemberParams{
		ChamberUid: uid,
		Username:   creator,
	})
}

func (s *Service) DeleteChamber(ctx context.Context, creator, name string) error {
	return s.Repo.DeleteChamber(ctx, database.DeleteChamberParams{
		CreatorUsername: pgtype.Text{String: creator, Valid: true},
		Name:            name,
	})
}

func (s *Service) ListChambers(ctx context.Context, filter string, currentUser string) ([]database.ListChambersRow, error) {
	return s.Repo.ListChambers(ctx, database.ListChambersParams{
		Column1:     filter,
		CurrentUser: currentUser,
	})
}

func (s *Service) JoinChamber(ctx context.Context, uid pgtype.UUID, username string) error {
	return s.Repo.JoinChamber(ctx, database.JoinChamberParams{
		ChamberUid: uid,
		Username:   username,
	})
}

func (s *Service) LeaveChamber(ctx context.Context, uid pgtype.UUID, username string) error {
	return s.Repo.LeaveChamber(ctx, database.LeaveChamberParams{
		ChamberUid: uid,
		Username:   username,
	})
}
