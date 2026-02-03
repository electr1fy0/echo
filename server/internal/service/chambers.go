package service

import (
	"context"
	"echo/internal/database"
	"echo/internal/types"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

func (s *Service) UpdateChamber(ctx context.Context, uid string, actor string, chamber types.Chamber) error {
	pUID, err := uuid.Parse(uid)
	if err != nil {
		return errors.New("invalid uid")
	}
	uidPg := pgtype.UUID{Bytes: pUID, Valid: true}
	creator, err := s.Repo.GetChamberCreator(ctx, uidPg)
	if err == pgx.ErrNoRows {
		return errors.New("chamber not found")
	} else if err != nil {
		return err
	}
	if creator != actor {
		return errors.New("unauthorized")
	}
	_, err = s.Repo.UpdateChamber(ctx, database.UpdateChamberParams{
		Uid:             uidPg,
		Name:            chamber.Name,
		Description:     pgtype.Text{String: chamber.Description, Valid: true},
		ColorIndex:      pgtype.Int4{Int32: chamber.ColorIndex, Valid: true},
		CreatorUsername: pgtype.Text{String: actor, Valid: true},
	})
	return err
}
