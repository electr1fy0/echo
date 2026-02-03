package service

import (
	"context"
	"echo/internal/types"
	"errors"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func (s *Service) GetProfile(ctx context.Context, username string) (types.Profile, error) {
	return s.Repo.GetProfile(ctx, username)
}

func (s *Service) GetPublicProfile(ctx context.Context, username string) (types.Profile, error) {
	return s.Repo.GetPublicProfile(ctx, username)
}

func (s *Service) UpdateUser(ctx context.Context, currentUsername string, profile types.Profile) (string, error) {
	newUsername := currentUsername
	if profile.Username != "" && profile.Username != currentUsername {
		profile.Username = strings.TrimSpace(profile.Username)
		if strings.Contains(profile.Username, " ") {
			return "", errors.New("username cannot contain spaces")
		}

		exists, err := s.Repo.CheckUsernameExists(ctx, profile.Username)
		if err != nil {
			return "", err
		}
		if exists {
			return "", ErrUserExists
		}
		newUsername = profile.Username
	} else {
		profile.Username = currentUsername
	}

	if err := s.Repo.UpdateUser(ctx, currentUsername, profile); err != nil {
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
	return s.Repo.DeleteUser(ctx, username)
}

func (s *Service) SearchUsers(ctx context.Context, query string) ([]types.Profile, error) {
	return s.Repo.SearchUsers(ctx, query)
}

func (s *Service) ResolveUsers(ctx context.Context, usernames []string) ([]string, error) {
	return s.Repo.ResolveUsers(ctx, usernames)
}
