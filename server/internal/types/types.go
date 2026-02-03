package types

import (
	"time"
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
	UID            string    `json:"uid"`
	Content        string    `json:"content"`
	TimeCreated    time.Time `json:"timeCreated"`
	Upvotes        int       `json:"upvotes"`
	IsUpvoted      bool      `json:"isUpvoted"`
	AuthorUsername string    `json:"authorUsername"`
	ChamberUID     string    `json:"chamberUid"`
	ChamberName    string    `json:"chamberName"`
	AcceptedAnswerUID string `json:"acceptedAnswerUid"`
	IsPinned      bool      `json:"isPinned"`
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
	UID            string    `json:"uid"`
	Content        string    `json:"content"`
	TimeCreated    time.Time `json:"timeCreated"`
	QuestionUID    string    `json:"questionUid"`
	Upvotes        int       `json:"upvotes"`
	IsUpvoted      bool      `json:"isUpvoted"`
	AuthorUsername string    `json:"authorUsername"`
	IsAccepted     bool      `json:"isAccepted"`
}

type Chamber struct {
	UID             string    `json:"uid"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	CreatorUsername string    `json:"creatorUsername"`
	MemberCount     int       `json:"memberCount"`
	IsJoined        bool      `json:"isJoined"`
	ColorIndex      int32     `json:"colorIndex"`
	TimeCreated     time.Time `json:"timeCreated"`
}

type Notification struct {
	UID             string    `json:"uid"`
	UserUsername    string    `json:"user_username"`
	ActorUsername   string    `json:"actor_username"`
	ActorAvatar     string    `json:"actor_avatar"`
	Type            string    `json:"type"`
	ReferenceUID    string    `json:"reference_uid"`
	Content         string    `json:"content"`
	QuestionContent string    `json:"question_content"`
	IsRead          bool      `json:"is_read"`
	CreatedAt       time.Time `json:"created_at"`
}

type SearchResponse struct {
	Chambers  []Chamber      `json:"chambers"`
	Questions []QuestionItem `json:"questions"`
	Replies   []AnswerItem   `json:"replies"`
	Users     []Profile      `json:"users"`
}
