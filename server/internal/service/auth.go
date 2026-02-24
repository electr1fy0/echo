package service

import (
	"context"
	"echo/internal/database"
	"echo/internal/email"
	"echo/internal/types"
	"echo/internal/utils"
	"errors"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
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
	if err := s.Q.CreateUser(ctx, database.CreateUserParams{
		Username:          user.Username,
		Email:             user.Email,
		Password:          pgtype.Text{String: string(hash), Valid: true},
		VerificationToken: pgtype.Text{String: token, Valid: true},
		IsVerified:        pgtype.Bool{Bool: false, Valid: true},
	}); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrUserExists
		}
		return err
	}
	return nil
}

func (s *Service) VerifyEmail(ctx context.Context, token string) (string, error) {
	return s.Q.VerifyUser(ctx, pgtype.Text{String: token, Valid: true})
}

func (s *Service) Signin(ctx context.Context, user types.User) (string, error) {
	user.Username = strings.TrimSpace(user.Username)
	row, err := s.Q.GetUserByUsername(ctx, user.Username)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", ErrInvalidCredentials
		}
		return "", ErrInvalidCredentials
	}
	if row.Username == "" {
		return "", ErrInvalidCredentials
	}

	if !row.Password.Valid || bcrypt.CompareHashAndPassword([]byte(row.Password.String), []byte(user.Password)) != nil {
		return "", ErrInvalidCredentials
	}
	if !row.IsVerified.Bool {
		return "", ErrNotVerified
	}

	return s.generateToken(user.Username)
}

func (s *Service) SigninOrSignupWithGoogle(ctx context.Context, email string) (string, bool, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return "", false, errors.New("missing email from google profile")
	}

	row, err := s.Q.GetUserByEmail(ctx, email)
	if err == nil {
		token, tokenErr := s.generateToken(row.Username)
		return token, false, tokenErr
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", false, err
	}

	return "", true, nil
}

func (s *Service) CompleteGoogleOnboarding(ctx context.Context, email, username string) (string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	username = strings.TrimSpace(username)
	if email == "" || username == "" {
		return "", errors.New("email and username are required")
	}
	if strings.Contains(username, " ") {
		return "", errors.New("username cannot contain spaces")
	}

	count, err := s.Q.CheckUsernameExists(ctx, username)
	if err != nil {
		return "", err
	}
	if count > 0 {
		return "", ErrUserExists
	}

	if row, err := s.Q.GetUserByEmail(ctx, email); err == nil && row.Username != "" {
		return s.generateToken(row.Username)
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	if err := s.Q.CreateUser(ctx, database.CreateUserParams{
		Username:          username,
		Email:             email,
		Password:          pgtype.Text{},
		VerificationToken: pgtype.Text{},
		IsVerified:        pgtype.Bool{Bool: true, Valid: true},
	}); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return "", ErrUserExists
		}
		return "", err
	}

	return s.generateToken(username)
}

func (s *Service) generateToken(username string) (string, error) {
	claims := &jwt.MapClaims{
		"iat":    time.Now().Unix(),
		"exp":    time.Now().Add(48 * time.Hour).Unix(),
		"sub":    username,
		"access": []string{"view", "create"},
		"role":   "user",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	key := []byte(os.Getenv("SECRET_KEY"))
	return token.SignedString(key)
}

func (s *Service) RequestPasswordReset(ctx context.Context, reqEmail string) error {
	row, err := s.Q.GetUserByEmail(ctx, reqEmail)
	if err != nil || row.Username == "" {
		return nil
	}

	token, err := utils.GenerateRandomToken(32)
	if err != nil {
		return err
	}

	if err := s.Q.SetPasswordResetToken(ctx, database.SetPasswordResetTokenParams{
		ResetToken: pgtype.Text{String: token, Valid: true},
		ResetExpiry: pgtype.Timestamp{
			Time:  time.Now().UTC().Add(time.Hour),
			Valid: true,
		},
		Email: reqEmail,
	}); err != nil {
		return err
	}

	go func() {
		if err := email.SendPasswordResetEmail(reqEmail, row.Username, token); err != nil {
			slog.Error("failed to send reset email", "error", err, "email", reqEmail)
		}
	}()
	return nil
}

func (s *Service) ResetPassword(ctx context.Context, token, newPassword string) error {
	row, err := s.Q.GetUserByResetToken(ctx, pgtype.Text{String: token, Valid: true})
	if err != nil || row.Email == "" {
		return ErrInvalidToken
	}

	if time.Now().UTC().After(row.ResetExpiry.Time) {
		return errors.New("token expired")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), 10)
	if err != nil {
		return err
	}

	return s.Q.UpdatePassword(ctx, database.UpdatePasswordParams{
		Password: pgtype.Text{String: string(hash), Valid: true},
		Email:    row.Email,
	})
}

func (s *Service) ResendVerification(ctx context.Context, reqEmail string) error {
	row, err := s.Q.GetUserByEmail(ctx, reqEmail)
	if err != nil || row.Username == "" {
		return nil
	}
	if row.IsVerified.Bool {
		return errors.New("account is already verified")
	}

	token, err := utils.GenerateRandomToken(32)
	if err != nil {
		return err
	}

	if err := s.Q.SetVerificationToken(ctx, database.SetVerificationTokenParams{
		VerificationToken: pgtype.Text{String: token, Valid: true},
		Email:             reqEmail,
	}); err != nil {
		return err
	}

	go func() {

		if err := email.SendVerificationEmail(reqEmail, row.Username, token); err != nil {

			slog.Error("failed to send verification email", "error", err, "email", reqEmail)

		}

	}()

	return nil

}
