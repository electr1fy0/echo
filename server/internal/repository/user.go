package repository

import (
	"context"
	"echo/internal/database"
	"echo/internal/types"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func (r *Repository) CreateUser(ctx context.Context, user types.User, hash []byte, token string) error {
	return r.Q.CreateUser(ctx, database.CreateUserParams{
		Username:          user.Username,
		Email:             user.Email,
		Password:          pgtype.Text{String: string(hash), Valid: true},
		VerificationToken: pgtype.Text{String: token, Valid: true},
		IsVerified:        pgtype.Bool{Bool: false, Valid: true},
	})
}

func (r *Repository) VerifyUser(ctx context.Context, token string) (string, error) {
	return r.Q.VerifyUser(ctx, pgtype.Text{String: token, Valid: true})
}

func (r *Repository) GetUserByUsername(ctx context.Context, username string) (types.User, bool, error) {
	username = strings.TrimSpace(username)
	u, err := r.Q.GetUserByUsername(ctx, username)
	if err == pgx.ErrNoRows {
		return types.User{}, false, nil
	}
	if err != nil {
		return types.User{}, false, err
	}
	return types.User{
		Username: u.Username,
		Email:    u.Email,
		Password: u.Password.String,
	}, u.IsVerified.Bool, nil
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (string, bool, error) {
	u, err := r.Q.GetUserByEmail(ctx, email)
	if err == pgx.ErrNoRows {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}
	return u.Username, u.IsVerified.Bool, nil
}

func (r *Repository) SetVerificationToken(ctx context.Context, email, token string) error {
	return r.Q.SetVerificationToken(ctx, database.SetVerificationTokenParams{
		VerificationToken: pgtype.Text{String: token, Valid: true},
		Email:             email,
	})
}

func (r *Repository) SetPasswordResetToken(ctx context.Context, email, token string, expiry time.Time) error {
	return r.Q.SetPasswordResetToken(ctx, database.SetPasswordResetTokenParams{
		ResetToken: pgtype.Text{String: token, Valid: true},
		ResetExpiry: pgtype.Timestamp{
			Time:  expiry,
			Valid: true,
		},
		Email: email,
	})
}

func (r *Repository) GetUserByResetToken(ctx context.Context, token string) (string, time.Time, error) {
	row, err := r.Q.GetUserByResetToken(ctx, pgtype.Text{String: token, Valid: true})
	if err != nil {
		return "", time.Time{}, err
	}
	return row.Email, row.ResetExpiry.Time, nil
}

func (r *Repository) UpdatePassword(ctx context.Context, email string, hash []byte) error {
	return r.Q.UpdatePassword(ctx, database.UpdatePasswordParams{
		Password: pgtype.Text{String: string(hash), Valid: true},
		Email:    email,
	})
}

func (r *Repository) UpdateUser(ctx context.Context, oldUsername string, profile types.Profile) error {
	return r.Q.UpdateUser(ctx, database.UpdateUserParams{
		Bio:        pgtype.Text{String: profile.Bio, Valid: true},
		Avatar:     pgtype.Text{String: profile.Avatar, Valid: true},
		Links:      pgtype.Text{String: profile.Link, Valid: true},
		Username:   profile.Username,
		Username_2: oldUsername,
	})
}

func (r *Repository) CheckUsernameExists(ctx context.Context, username string) (bool, error) {
	count, err := r.Q.CheckUsernameExists(ctx, username)
	return count > 0, err
}

func (r *Repository) DeleteUser(ctx context.Context, username string) error {
	return r.Q.DeleteUser(ctx, username)
}

func (r *Repository) GetProfile(ctx context.Context, username string) (types.Profile, error) {
	row, err := r.Q.GetProfile(ctx, username)
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

func (r *Repository) GetPublicProfile(ctx context.Context, username string) (types.Profile, error) {
	row, err := r.Q.GetPublicProfile(ctx, username)
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
