package repository

import (
	"context"
	"echo/internal/types"
)

func (r *Repository) SearchChambersRaw(ctx context.Context, query string, currentUser string) ([]types.Chamber, error) {
	rows, err := r.DB.Query(ctx, `
			SELECT 
				c.uid, c.name, COALESCE(c.description, ''), c.color_index, c.created_at,
				(SELECT COUNT(*) FROM chamber_members cm WHERE cm.chamber_uid = c.uid) as member_count,
				EXISTS(SELECT 1 FROM chamber_members cm WHERE cm.chamber_uid = c.uid AND cm.username = $1) as is_joined
			FROM chambers c
			WHERE c.name ILIKE $2 OR c.description ILIKE $2
			LIMIT 5`, currentUser, "%"+query+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var chambers []types.Chamber
	for rows.Next() {
		var c types.Chamber
		if err := rows.Scan(&c.UID, &c.Name, &c.Description, &c.ColorIndex, &c.TimeCreated, &c.MemberCount, &c.IsJoined); err == nil {
			chambers = append(chambers, c)
		}
	}
	return chambers, nil
}

func (r *Repository) SearchQuestionsRaw(ctx context.Context, query string, currentUser string) ([]types.QuestionItem, error) {
	rows, err := r.DB.Query(ctx, `
			select
				q.uid, q.content, q.time_created, q.author,
				u.avatar,
				q.upvotes_count,
				exists (select 1 from question_upvotes v2 where v2.question_uid = q.uid and v2.username = $1) as is_upvoted
			from questions q
			left join users u on u.username = q.author
			where q.content ilike $2
			limit 5`, currentUser, "%"+query+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var questions []types.QuestionItem
	for rows.Next() {
		var q types.QuestionItem
		var avatar *string
		if err := rows.Scan(&q.Question.UID, &q.Question.Content, &q.Question.TimeCreated, &q.Question.AuthorUsername, &avatar, &q.Question.Upvotes, &q.Question.IsUpvoted); err == nil {
			if avatar != nil {
				q.Author.Avatar = *avatar
			}
			q.Author.Username = q.Question.AuthorUsername
			questions = append(questions, q)
		}
	}
	return questions, nil
}

func (r *Repository) SearchRepliesRaw(ctx context.Context, query string, currentUser string) ([]types.AnswerItem, error) {
	rows, err := r.DB.Query(ctx, `
			select 
				a.uid, a.content, a.time_created, a.question_uid, a.author,
				u.avatar,
				a.upvotes_count,
				exists (select 1 from answer_upvotes v2 where v2.answer_uid = a.uid and v2.username = $1) as is_upvoted
			from answers a
			left join users u on u.username = a.author
			where a.content ilike $2
			limit 5`, currentUser, "%"+query+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var replies []types.AnswerItem
	for rows.Next() {
		var ans types.AnswerItem
		var avatar *string
		if err := rows.Scan(&ans.Answer.UID, &ans.Answer.Content, &ans.Answer.TimeCreated, &ans.Answer.QuestionUID, &ans.Answer.AuthorUsername, &avatar, &ans.Answer.Upvotes, &ans.Answer.IsUpvoted); err == nil {
			if avatar != nil {
				ans.Author.Avatar = *avatar
			}
			ans.Author.Username = ans.Answer.AuthorUsername
			replies = append(replies, ans)
		}
	}
	return replies, nil
}

func (r *Repository) SearchUsersRaw(ctx context.Context, query string) ([]types.Profile, error) {
	rows, err := r.DB.Query(ctx, `
			SELECT username, COALESCE(avatar, ''), COALESCE(bio, '')
			FROM users
			WHERE username ILIKE $1
			LIMIT 5`, "%"+query+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []types.Profile
	for rows.Next() {
		var u types.Profile
		if err := rows.Scan(&u.Username, &u.Avatar, &u.Bio); err == nil {
			users = append(users, u)
		}
	}
	return users, nil
}
