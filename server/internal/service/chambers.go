package service

import (
	"context"
	"echo/internal/database"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func (s *Service) CreateChamber(ctx context.Context, name, description, creator string, colorIndex int32) (string, error) {
	newUID := uuid.New()
	uidPg := pgtype.UUID{Bytes: newUID, Valid: true}
	err := s.Repo.CreateChamber(ctx, database.CreateChamberParams{
		Uid:             uidPg,
		Name:            name,
		Description:     pgtype.Text{String: description, Valid: true},
		CreatorUsername: pgtype.Text{String: creator, Valid: true},
		ColorIndex:      pgtype.Int4{Int32: colorIndex, Valid: true},
	})
	if err != nil {
		return "", err
	}
	err = s.Repo.AddChamberMember(ctx, database.AddChamberMemberParams{
		ChamberUid: uidPg,
		Username:   creator,
	})
	if err != nil {
		return "", err
	}
	return newUID.String(), nil
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

func (s *Service) JoinChamber(ctx context.Context, uid string, username string) error {
	pUID, err := uuid.Parse(uid)
	if err != nil {
		return errors.New("invalid uid")
	}
	return s.Repo.JoinChamber(ctx, database.JoinChamberParams{
		ChamberUid: pgtype.UUID{Bytes: pUID, Valid: true},
		Username:   username,
	})
}

func (s *Service) LeaveChamber(ctx context.Context, uid string, username string) error {
	pUID, err := uuid.Parse(uid)
	if err != nil {
		return errors.New("invalid uid")
	}
	return s.Repo.LeaveChamber(ctx, database.LeaveChamberParams{
		ChamberUid: pgtype.UUID{Bytes: pUID, Valid: true},
		Username:   username,
	})
}
