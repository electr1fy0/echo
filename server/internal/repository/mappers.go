package repository

import (
	"echo/internal/database"
	"echo/internal/types"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func chamberFromListRow(row database.ListChambersRow) types.Chamber {
	return chamberFromFields(
		row.Uid,
		row.Name,
		row.Description,
		row.CreatorUsername,
		row.ColorIndex,
		row.CreatedAt,
		row.MemberCount,
		row.IsJoined,
	)
}

func chamberFromSearchRow(row database.SearchChambersRow) types.Chamber {
	return chamberFromFields(
		row.Uid,
		row.Name,
		row.Description,
		row.CreatorUsername,
		row.ColorIndex,
		row.CreatedAt,
		row.MemberCount,
		row.IsJoined,
	)
}

func chamberFromFields(uid pgtype.UUID, name, description string, creatorUsername pgtype.Text, colorIndex pgtype.Int4, createdAt pgtype.Timestamp, memberCount int64, isJoined bool) types.Chamber {
	return types.Chamber{
		UID:             uuid.UUID(uid.Bytes).String(),
		Name:            name,
		Description:     description,
		CreatorUsername: creatorUsername.String,
		ColorIndex:      colorIndex.Int32,
		TimeCreated:     createdAt.Time,
		MemberCount:     int(memberCount),
		IsJoined:        isJoined,
	}
}

func questionItemFromGetRow(row database.GetQuestionRow) types.QuestionItem {
	return questionItemFromFields(
		row.Uid,
		row.Content,
		row.TimeCreated,
		row.Author,
		row.Avatar,
		row.Upvotes,
		row.IsUpvoted,
		row.ChamberUid,
		row.ChamberName,
		row.AcceptedAnswerUid,
		row.PinnedAt,
	)
}

func questionItemFromListRow(row database.ListQuestionsRow) types.QuestionItem {
	return questionItemFromFields(
		row.Uid,
		row.Content,
		row.TimeCreated,
		row.Author,
		row.Avatar,
		row.Upvotes,
		row.IsUpvoted,
		row.ChamberUid,
		row.ChamberName,
		row.AcceptedAnswerUid,
		row.PinnedAt,
	)
}

func questionItemFromListByAuthorRow(row database.ListQuestionsByAuthorRow) types.QuestionItem {
	return questionItemFromFields(
		row.Uid,
		row.Content,
		row.TimeCreated,
		row.Author,
		row.Avatar,
		row.Upvotes,
		row.IsUpvoted,
		row.ChamberUid,
		row.ChamberName,
		row.AcceptedAnswerUid,
		row.PinnedAt,
	)
}

func questionItemFromListFilteredRow(row database.ListQuestionsFilteredRow) types.QuestionItem {
	return questionItemFromFields(
		row.Uid,
		row.Content,
		row.TimeCreated,
		row.Author,
		row.Avatar,
		row.Upvotes,
		row.IsUpvoted,
		row.ChamberUid,
		row.ChamberName,
		row.AcceptedAnswerUid,
		row.PinnedAt,
	)
}

func questionItemFromSearchRow(row database.SearchQuestionsRow) types.QuestionItem {
	return questionItemFromFields(
		row.Uid,
		row.Content,
		row.TimeCreated,
		row.Author,
		row.Avatar,
		row.UpvotesCount,
		row.IsUpvoted,
		pgtype.UUID{},
		"",
		row.AcceptedAnswerUid,
		row.PinnedAt,
	)
}

func questionItemFromFields(uid pgtype.UUID, content pgtype.Text, timeCreated pgtype.Timestamp, author string, avatar pgtype.Text, upvotes pgtype.Int4, isUpvoted bool, chamberUID pgtype.UUID, chamberName string, acceptedAnswerUID pgtype.UUID, pinnedAt pgtype.Timestamp) types.QuestionItem {
	question := types.Question{
		UID:            uuid.UUID(uid.Bytes).String(),
		Content:        content.String,
		TimeCreated:    timeCreated.Time,
		Upvotes:        int(upvotes.Int32),
		IsUpvoted:      isUpvoted,
		AuthorUsername: author,
		ChamberName:    chamberName,
		IsPinned:       pinnedAt.Valid,
	}
	if chamberUID.Valid {
		question.ChamberUID = uuid.UUID(chamberUID.Bytes).String()
	}
	if acceptedAnswerUID.Valid {
		question.AcceptedAnswerUID = uuid.UUID(acceptedAnswerUID.Bytes).String()
	}
	return types.QuestionItem{
		Question: question,
		Author: types.Profile{
			Username: author,
			Avatar:   avatar.String,
		},
	}
}

func answerItemFromListRow(row database.ListRepliesRow) types.AnswerItem {
	return answerItemFromFields(
		row.Uid,
		row.Content,
		row.TimeCreated,
		row.QuestionUid,
		row.Author,
		row.Avatar,
		row.Upvotes,
		row.IsUpvoted,
		row.AcceptedAnswerUid,
	)
}

func answerItemFromSearchRow(row database.SearchRepliesRow) types.AnswerItem {
	return answerItemFromFields(
		row.Uid,
		row.Content,
		row.TimeCreated,
		row.QuestionUid,
		row.Author,
		row.Avatar,
		row.UpvotesCount,
		row.IsUpvoted,
		pgtype.UUID{},
	)
}

func answerItemFromFields(uid pgtype.UUID, content string, timeCreated pgtype.Timestamp, questionUID pgtype.UUID, author string, avatar pgtype.Text, upvotes pgtype.Int4, isUpvoted bool, acceptedAnswerUID pgtype.UUID) types.AnswerItem {
	answer := types.Answer{
		UID:            uuid.UUID(uid.Bytes).String(),
		Content:        content,
		TimeCreated:    timeCreated.Time,
		Upvotes:        int(upvotes.Int32),
		IsUpvoted:      isUpvoted,
		AuthorUsername: author,
		IsAccepted:     acceptedAnswerUID.Valid && acceptedAnswerUID.Bytes == uid.Bytes,
	}
	if questionUID.Valid {
		answer.QuestionUID = uuid.UUID(questionUID.Bytes).String()
	}
	return types.AnswerItem{
		Answer: answer,
		Author: types.Profile{
			Username: author,
			Avatar:   avatar.String,
		},
	}
}
