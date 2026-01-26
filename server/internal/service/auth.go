package service

import (
	"context"
	"echo/internal/email"
	"echo/internal/types"
	"echo/internal/utils"
	"errors"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserExists         = errors.New("username already taken")
	ErrInvalidCredentials = errors.New("incorrect username or password")
	ErrNotVerified        = errors.New("please verify your email before signing in")
	ErrInvalidToken       = errors.New("invalid or expired token")
)

func (s *Service) Signup(ctx context.Context, user types.User) error {
	user.Username = strings.TrimSpace(user.Username)
	if strings.Contains(user.Username, " ") {
		return errors.New("username cannot contain spaces")
	}
	user.Email = strings.TrimSpace(user.Email)

	hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), 10)
	if err != nil {
		return err
	}

	token, err := utils.GenerateRandomToken(32)
	if err != nil {
		return err
	}
	go func() {
		if err := email.SendVerificationEmail(user.Email, user.Username, token); err != nil {
			slog.Error("failed to send verification email", "error", err, "user", user.Username)
		}
	}()
	return s.Repo.CreateUser(ctx, user, hash, token)
}

func (s *Service) VerifyEmail(ctx context.Context, token string) (string, error) {
	return s.Repo.VerifyUser(ctx, token)
}

func (s *Service) Signin(ctx context.Context, user types.User) (string, error) {
	user.Username = strings.TrimSpace(user.Username)
	dbUser, isVerified, err := s.Repo.GetUserByUsername(ctx, user.Username)
	if err != nil {
		return "", ErrInvalidCredentials
	}
	if dbUser.Username == "" {
		return "", ErrInvalidCredentials
	}

	if bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(user.Password)) != nil {
		return "", ErrInvalidCredentials
	}
	if !isVerified {
		return "", ErrNotVerified
	}

	claims := &jwt.MapClaims{
		"iat":    time.Now().Unix(),
		"exp":    time.Now().Add(48 * time.Hour).Unix(),
		"sub":    user.Username,
		"access": []string{"view", "create"},
		"role":   "user",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	key := []byte(os.Getenv("SECRET_KEY"))
	return token.SignedString(key)
}

func (s *Service) RequestPasswordReset(ctx context.Context, reqEmail string) error {
	username, _, err := s.Repo.GetUserByEmail(ctx, reqEmail)
	if err != nil {
		return nil
	}
	if username == "" {
		return nil
	}

	token, err := utils.GenerateRandomToken(32)
	if err != nil {
		return err
	}

	if err := s.Repo.SetPasswordResetToken(ctx, reqEmail, token, time.Now().UTC().Add(time.Hour)); err != nil {
		return err
	}

	go func() {
		if err := email.SendPasswordResetEmail(reqEmail, username, token); err != nil {
			slog.Error("failed to send reset email", "error", err, "email", reqEmail)
		}
	}()
	return nil
}

func (s *Service) ResetPassword(ctx context.Context, token, newPassword string) error {
	email, expiry, err := s.Repo.GetUserByResetToken(ctx, token)
	if err != nil || email == "" {
		return ErrInvalidToken
	}

	if time.Now().UTC().After(expiry) {
		return errors.New("token expired")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), 10)
	if err != nil {
		return err
	}

	return s.Repo.UpdatePassword(ctx, email, hash)
}

func (s *Service) ResendVerification(ctx context.Context, reqEmail string) error {
	username, isVerified, err := s.Repo.GetUserByEmail(ctx, reqEmail)
	if err != nil || username == "" {
		return nil
	}
	if isVerified {
		return errors.New("account is already verified")
	}

	token, err := utils.GenerateRandomToken(32)
	if err != nil {
		return err
	}

	if err := s.Repo.SetVerificationToken(ctx, reqEmail, token); err != nil {

		return err

	}

	go func() {

		if err := email.SendVerificationEmail(reqEmail, username, token); err != nil {

			slog.Error("failed to send verification email", "error", err, "email", reqEmail)

		}

	}()

	return nil

}
