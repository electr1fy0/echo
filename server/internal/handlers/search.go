package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type SearchResponse struct {
	Chambers  []Chamber      `json:"chambers"`
	Questions []QuestionItem `json:"questions"`
	Replies   []AnswerItem   `json:"replies"`
}

func (h *APIHandler) GlobalSearch(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	q := r.URL.Query()
	query := q.Get("q")

	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)

	if query == "" {
		json.NewEncoder(w).Encode(SearchResponse{
			Chambers:  []Chamber{},
			Questions: []QuestionItem{},
			Replies:   []AnswerItem{},
		})
		return
	}

	var wg sync.WaitGroup
	resp := SearchResponse{
		Chambers:  []Chamber{},
		Questions: []QuestionItem{},
		Replies:   []AnswerItem{},
	}
	var errChambers, errQuestions, errReplies error
	_ = errChambers
	_ = errQuestions
	_ = errReplies

	wg.Add(1)
	go func() {
		defer wg.Done()
		chamberRows, err := h.DB.Query(ctx, `
			SELECT 
				c.uid, c.name, COALESCE(c.description, ''), c.color_index,
				(SELECT COUNT(*) FROM chamber_members cm WHERE cm.chamber_uid = c.uid) as member_count,
				EXISTS(SELECT 1 FROM chamber_members cm WHERE cm.chamber_uid = c.uid AND cm.username = $1) as is_joined
			FROM chambers c
			WHERE c.name ILIKE $2 OR c.description ILIKE $2
			LIMIT 5`, sub, "%"+query+"%")
		if err != nil {
			errChambers = err
			return
		}
		defer chamberRows.Close()

		for chamberRows.Next() {
			var c Chamber
			if err := chamberRows.Scan(&c.UID, &c.Name, &c.Description, &c.ColorIndex, &c.MemberCount, &c.IsJoined); err == nil {
				resp.Chambers = append(resp.Chambers, c)
			}
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		questionRows, err := h.DB.Query(ctx, `
			select
				q.uid, q.content, q.time_created, q.author,
				u.avatar,
				count(v.question_uid) as vote_count,
				exists (select 1 from question_upvotes v2 where v2.question_uid = q.uid and v2.username = $1) as is_upvoted
			from questions q
			left join question_upvotes v on q.uid = v.question_uid
			left join users u on u.username = q.author
			where q.content ilike $2
			group by q.uid, q.content, q.time_created, q.author, u.avatar
			limit 5`, sub, "%"+query+"%")
		if err != nil {
			errQuestions = err
			return
		}
		defer questionRows.Close()

		for questionRows.Next() {
			var q QuestionItem
			var avatar *string
			if err := questionRows.Scan(&q.Question.UID, &q.Question.Content, &q.Question.TimeCreated, &q.Question.AuthorUsername, &avatar, &q.Question.Upvotes, &q.Question.IsUpvoted); err == nil {
				if avatar != nil {
					q.Author.Avatar = *avatar
				}
				q.Author.Username = q.Question.AuthorUsername
				resp.Questions = append(resp.Questions, q)
			}
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		replyRows, err := h.DB.Query(ctx, `
			select 
				a.uid, a.content, a.time_created, a.question_uid, a.author,
				u.avatar,
				count(v.answer_uid) as vote_count,
				exists (select 1 from answer_upvotes v2 where v2.answer_uid = a.uid and v2.username = $1) as is_upvoted
			from answers a
			left join answer_upvotes v on a.uid = v.answer_uid
			left join users u on u.username = a.author
			where a.content ilike $2
			group by a.uid, a.content, a.time_created, a.question_uid, a.author, u.avatar
			limit 5`, sub, "%"+query+"%")
		if err != nil {
			errReplies = err
			return
		}
		defer replyRows.Close()

		for replyRows.Next() {
			var ans AnswerItem
			var avatar *string
			if err := replyRows.Scan(&ans.Answer.UID, &ans.Answer.Content, &ans.Answer.TimeCreated, &ans.Answer.QuestionUID, &ans.Answer.AuthorUsername, &avatar, &ans.Answer.Upvotes, &ans.Answer.IsUpvoted); err == nil {
				if avatar != nil {
					ans.Author.Avatar = *avatar
				}
				ans.Author.Username = ans.Answer.AuthorUsername
				resp.Replies = append(resp.Replies, ans)
			}
		}
	}()

	wg.Wait()

	json.NewEncoder(w).Encode(resp)
}
