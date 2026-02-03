package service

import (
	"context"
	"echo/internal/database"
	"echo/internal/types"
	"errors"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func (s *Service) GetProfile(ctx context.Context, username string) (types.Profile, error) {
	row, err := s.Q.GetProfile(ctx, username)
	if err != nil {
		return types.Profile{}, err
	}
	return types.Profile{
		Username: row.Username,
		Email:    row.Email,
		Bio:      row.Bio,
		Avatar:   row.Avatar,
		Link:     row.Links,
		Posted:   int(row.Posted),
		Answered: int(row.Answered),
	}, nil
}

func (s *Service) GetPublicProfile(ctx context.Context, username string) (types.Profile, error) {
	row, err := s.Q.GetPublicProfile(ctx, username)
	if err != nil {
		return types.Profile{}, err
	}
	return types.Profile{
		Username: row.Username,
		Bio:      row.Bio,
		Avatar:   row.Avatar,
		Link:     row.Links,
		Posted:   int(row.Posted),
		Answered: int(row.Answered),
	}, nil
}

func (s *Service) UpdateUser(ctx context.Context, currentUsername string, profile types.Profile) (string, error) {
	newUsername := currentUsername
	if profile.Username != "" && profile.Username != currentUsername {
		profile.Username = strings.TrimSpace(profile.Username)
		if strings.Contains(profile.Username, " ") {
			return "", errors.New("username cannot contain spaces")
		}

		count, err := s.Q.CheckUsernameExists(ctx, profile.Username)
		if err != nil {
			return "", err
		}
		if count > 0 {
			return "", ErrUserExists
		}
		newUsername = profile.Username
	} else {
		profile.Username = currentUsername
	}

	if err := s.Q.UpdateUser(ctx, database.UpdateUserParams{
		Bio:        pgtype.Text{String: profile.Bio, Valid: true},
		Avatar:     pgtype.Text{String: profile.Avatar, Valid: true},
		Links:      pgtype.Text{String: profile.Link, Valid: true},
		Username:   profile.Username,
		Username_2: currentUsername,
	}); err != nil {
		return "", err
	}

	if newUsername != currentUsername {
		newClaims := &jwt.MapClaims{
			"iat":    time.Now().Unix(),
			"exp":    time.Now().Add(48 * time.Hour).Unix(),
			"sub":    newUsername,
			"access": []string{"view", "create"},
			"role":   "user",
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)
		key := []byte(os.Getenv("SECRET_KEY"))
		return token.SignedString(key)
	}
	return "", nil
}

func (s *Service) DeleteUser(ctx context.Context, username string) error {
	return s.Q.DeleteUser(ctx, username)
}

func (s *Service) SearchUsers(ctx context.Context, query string) ([]types.Profile, error) {
	rows, err := s.Q.SearchUsers(ctx, pgtype.Text{String: query, Valid: true})
	if err != nil {
		return nil, err
	}
	return mapSearchUsers(rows), nil
}

func (s *Service) ResolveUsers(ctx context.Context, usernames []string) ([]string, error) {
	if len(usernames) == 0 {
		return []string{}, nil
	}
	return s.Q.ResolveUsers(ctx, usernames)
}
