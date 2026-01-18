package handlers

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Profile struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Bio      string `json:"bio"`
	Avatar   string `json:"avatar"`
	Link     string `json:"link"`
	Answered int    `json:"answered"`
	Posted   int    `json:"posted"`
}

type Question struct {
	UID            uuid.UUID `json:"uid"`
	Content        string    `json:"content"`
	TimeCreated    time.Time `json:"timeCreated"`
	Upvotes        int       `json:"upvotes"`
	IsUpvoted      bool      `json:"isUpvoted"`
	AuthorUsername string    `json:"authorUsername"`
	ChamberUID     uuid.UUID `json:"chamberUid"`
}

type QuestionItem struct {
	Question Question `json:"question"`
	Author   Profile  `json:"author"`
}

type AnswerItem struct {
	Answer Answer  `json:"answer"`
	Author Profile `json:"author"`
}

type Vote struct {
	Username  string
	ObjectUID string
}

type Answer struct {
	UID            uuid.UUID `json:"uid"`
	Content        string    `json:"content"`
	TimeCreated    time.Time `json:"timeCreated"`
	QuestionUID    uuid.UUID `json:"questionUid"`
	Upvotes        int       `json:"upvotes"`
	IsUpvoted      bool      `json:"isUpvoted"`
	AuthorUsername string    `json:"authorUsername"`
}
