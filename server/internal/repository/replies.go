package repository

import (
	"context"
	"echo/internal/database"
	"echo/internal/types"

	"github.com/jackc/pgx/v5/pgtype"
)

func (r *Repository) ListReplies(ctx context.Context, arg database.ListRepliesParams) ([]types.AnswerItem, error) {
	rows, err := r.Q.ListReplies(ctx, arg)
	if err != nil {
		return nil, err
	}
	replies := make([]types.AnswerItem, 0, len(rows))
	for _, row := range rows {
		replies = append(replies, answerItemFromListRow(row))
	}
	return replies, nil
}

func (r *Repository) CreateReply(ctx context.Context, arg database.CreateReplyParams) error {
	return r.Q.CreateReply(ctx, arg)
}

func (r *Repository) UpdateReply(ctx context.Context, arg database.UpdateReplyParams) (pgtype.UUID, error) {
	return r.Q.UpdateReply(ctx, arg)
}

func (r *Repository) DeleteReply(ctx context.Context, arg database.DeleteReplyParams) error {
	return r.Q.DeleteReply(ctx, arg)
}

func (r *Repository) GetAnswerAuthor(ctx context.Context, uid pgtype.UUID) (string, error) {
	return r.Q.GetAnswerAuthor(ctx, uid)
}

func (r *Repository) GetAnswerVote(ctx context.Context, arg database.GetAnswerVoteParams) (database.AnswerUpvote, error) {
	return r.Q.GetAnswerVote(ctx, arg)
}

func (r *Repository) CreateAnswerVote(ctx context.Context, arg database.CreateAnswerVoteParams) error {
	return r.Q.CreateAnswerVote(ctx, arg)
}

func (r *Repository) DeleteAnswerVote(ctx context.Context, arg database.DeleteAnswerVoteParams) error {
	return r.Q.DeleteAnswerVote(ctx, arg)
}

func (r *Repository) IncrementAnswerUpvotes(ctx context.Context, uid pgtype.UUID) error {
	return r.Q.IncrementAnswerUpvotes(ctx, uid)
}

func (r *Repository) DecrementAnswerUpvotes(ctx context.Context, uid pgtype.UUID) error {
	return r.Q.DecrementAnswerUpvotes(ctx, uid)
}
