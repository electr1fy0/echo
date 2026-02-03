package service

import (
	"echo/internal/database"
	"echo/internal/types"

	"github.com/google/uuid"
)

func chamberFromListRow(row database.ListChambersRow) types.Chamber {
	return types.Chamber{
		UID:             uuid.UUID(row.Uid.Bytes).String(),
		Name:            row.Name,
		Description:     row.Description,
		CreatorUsername: row.CreatorUsername.String,
		ColorIndex:      row.ColorIndex.Int32,
		TimeCreated:     row.CreatedAt.Time,
		MemberCount:     int(row.MemberCount),
		IsJoined:        row.IsJoined,
	}
}

func chamberFromSearchRow(row database.SearchChambersRow) types.Chamber {
	return types.Chamber{
		UID:             uuid.UUID(row.Uid.Bytes).String(),
		Name:            row.Name,
		Description:     row.Description,
		CreatorUsername: row.CreatorUsername.String,
		ColorIndex:      row.ColorIndex.Int32,
		TimeCreated:     row.CreatedAt.Time,
		MemberCount:     int(row.MemberCount),
		IsJoined:        row.IsJoined,
	}
}

func questionItemFromGetRow(row database.GetQuestionRow) types.QuestionItem {
	question := types.Question{
		UID:            uuid.UUID(row.Uid.Bytes).String(),
		Content:        row.Content.String,
		TimeCreated:    row.TimeCreated.Time,
		Upvotes:        int(row.Upvotes.Int32),
		IsUpvoted:      row.IsUpvoted,
		AuthorUsername: row.Author,
		ChamberName:    row.ChamberName,
		IsPinned:       row.PinnedAt.Valid,
	}
	if row.ChamberUid.Valid {
		question.ChamberUID = uuid.UUID(row.ChamberUid.Bytes).String()
	}
	if row.AcceptedAnswerUid.Valid {
		question.AcceptedAnswerUID = uuid.UUID(row.AcceptedAnswerUid.Bytes).String()
	}
	return types.QuestionItem{
		Question: question,
		Author: types.Profile{
			Username: row.Author,
			Avatar:   row.Avatar.String,
		},
	}
}

func questionItemFromListFilteredRow(row database.ListQuestionsFilteredRow) types.QuestionItem {
	question := types.Question{
		UID:            uuid.UUID(row.Uid.Bytes).String(),
		Content:        row.Content.String,
		TimeCreated:    row.TimeCreated.Time,
		Upvotes:        int(row.Upvotes.Int32),
		IsUpvoted:      row.IsUpvoted,
		AuthorUsername: row.Author,
		ChamberName:    row.ChamberName,
		IsPinned:       row.PinnedAt.Valid,
	}
	if row.AcceptedAnswerUid.Valid {
		question.AcceptedAnswerUID = uuid.UUID(row.AcceptedAnswerUid.Bytes).String()
	}
	if row.ChamberUid.Valid {
		question.ChamberUID = uuid.UUID(row.ChamberUid.Bytes).String()
	}
	return types.QuestionItem{
		Question: question,
		Author: types.Profile{
			Username: row.Author,
			Avatar:   row.Avatar.String,
		},
	}
}

func questionItemFromListByAuthorRow(row database.ListQuestionsByAuthorRow) types.QuestionItem {
	question := types.Question{
		UID:            uuid.UUID(row.Uid.Bytes).String(),
		Content:        row.Content.String,
		TimeCreated:    row.TimeCreated.Time,
		Upvotes:        int(row.Upvotes.Int32),
		IsUpvoted:      row.IsUpvoted,
		AuthorUsername: row.Author,
		ChamberName:    row.ChamberName,
		IsPinned:       row.PinnedAt.Valid,
	}
	if row.ChamberUid.Valid {
		question.ChamberUID = uuid.UUID(row.ChamberUid.Bytes).String()
	}
	if row.AcceptedAnswerUid.Valid {
		question.AcceptedAnswerUID = uuid.UUID(row.AcceptedAnswerUid.Bytes).String()
	}
	return types.QuestionItem{
		Question: question,
		Author: types.Profile{
			Username: row.Author,
			Avatar:   row.Avatar.String,
		},
	}
}

func questionItemFromSearchRow(row database.SearchQuestionsRow) types.QuestionItem {
	question := types.Question{
		UID:            uuid.UUID(row.Uid.Bytes).String(),
		Content:        row.Content.String,
		TimeCreated:    row.TimeCreated.Time,
		Upvotes:        int(row.UpvotesCount.Int32),
		IsUpvoted:      row.IsUpvoted,
		AuthorUsername: row.Author,
		IsPinned:       row.PinnedAt.Valid,
	}
	if row.AcceptedAnswerUid.Valid {
		question.AcceptedAnswerUID = uuid.UUID(row.AcceptedAnswerUid.Bytes).String()
	}
	return types.QuestionItem{
		Question: question,
		Author: types.Profile{
			Username: row.Author,
			Avatar:   row.Avatar.String,
		},
	}
}

func answerItemFromListRow(row database.ListRepliesRow) types.AnswerItem {
	answer := types.Answer{
		UID:            uuid.UUID(row.Uid.Bytes).String(),
		Content:        row.Content,
		TimeCreated:    row.TimeCreated.Time,
		QuestionUID:    uuid.UUID(row.QuestionUid.Bytes).String(),
		Upvotes:        int(row.Upvotes.Int32),
		IsUpvoted:      row.IsUpvoted,
		AuthorUsername: row.Author,
		IsAccepted:     row.AcceptedAnswerUid.Valid && row.AcceptedAnswerUid.Bytes == row.Uid.Bytes,
	}
	return types.AnswerItem{
		Answer: answer,
		Author: types.Profile{
			Username: row.Author,
			Avatar:   row.Avatar.String,
		},
	}
}

func answerItemFromSearchRow(row database.SearchRepliesRow) types.AnswerItem {
	answer := types.Answer{
		UID:            uuid.UUID(row.Uid.Bytes).String(),
		Content:        row.Content,
		TimeCreated:    row.TimeCreated.Time,
		QuestionUID:    uuid.UUID(row.QuestionUid.Bytes).String(),
		Upvotes:        int(row.UpvotesCount.Int32),
		IsUpvoted:      row.IsUpvoted,
		AuthorUsername: row.Author,
		IsAccepted:     false,
	}
	return types.AnswerItem{
		Answer: answer,
		Author: types.Profile{
			Username: row.Author,
			Avatar:   row.Avatar.String,
		},
	}
}

func notificationFromRow(row database.ListNotificationsRow) types.Notification {
	n := types.Notification{
		UID:             uuid.UUID(row.Uid.Bytes).String(),
		UserUsername:    row.UserUsername,
		Type:            row.Type,
		ReferenceUID:    uuid.UUID(row.ReferenceUid.Bytes).String(),
		IsRead:          row.IsRead.Bool,
		CreatedAt:       row.CreatedAt.Time,
		Content:         row.Content,
		QuestionContent: row.QuestionContent,
	}
	if row.ActorUsername.Valid {
		n.ActorUsername = row.ActorUsername.String
	}
	if row.ActorAvatar.Valid {
		n.ActorAvatar = row.ActorAvatar.String
	}
	return n
}

func mapSearchChambers(rows []database.SearchChambersRow) []types.Chamber {
	chambers := make([]types.Chamber, 0, len(rows))
	for _, row := range rows {
		chambers = append(chambers, chamberFromSearchRow(row))
	}
	return chambers
}

func mapSearchQuestions(rows []database.SearchQuestionsRow) []types.QuestionItem {
	questions := make([]types.QuestionItem, 0, len(rows))
	for _, row := range rows {
		questions = append(questions, questionItemFromSearchRow(row))
	}
	return questions
}

func mapSearchReplies(rows []database.SearchRepliesRow) []types.AnswerItem {
	replies := make([]types.AnswerItem, 0, len(rows))
	for _, row := range rows {
		replies = append(replies, answerItemFromSearchRow(row))
	}
	return replies
}

func mapSearchUsers(rows []database.SearchUsersRow) []types.Profile {
	users := make([]types.Profile, 0, len(rows))
	for _, row := range rows {
		users = append(users, types.Profile{
			Username: row.Username,
			Avatar:   row.Avatar,
			Bio:      row.Bio,
		})
	}
	return users
}
