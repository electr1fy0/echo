package types

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// UUID is a wrapper around google/uuid.UUID that supports flexible JSON unmarshalling
type UUID uuid.UUID

// MarshalJSON implements the json.Marshaler interface
func (u UUID) MarshalJSON() ([]byte, error) {
	return json.Marshal(uuid.UUID(u).String())
}

// UnmarshalJSON implements the json.Unmarshaler interface
func (u *UUID) UnmarshalJSON(data []byte) error {
	var v interface{}
	if err := json.Unmarshal(data, &v); err != nil {
		return err
	}

	switch val := v.(type) {
	case string:
		id, err := uuid.Parse(val)
		if err != nil {
			return err
		}
		*u = UUID(id)
	case []interface{}:
		// Handle [16]byte sent as JSON array of numbers
		if len(val) == 16 {
			var bytes [16]byte
			for i, item := range val {
				if f, ok := item.(float64); ok {
					bytes[i] = byte(f)
				} else {
					return fmt.Errorf("invalid uuid byte at index %d", i)
				}
			}
			*u = UUID(bytes)
			return nil
		}
		return fmt.Errorf("invalid uuid array length: %d", len(val))
	default:
		return fmt.Errorf("invalid uuid format: %T", val)
	}
	return nil
}

// Scan implements the sql.Scanner interface
func (u *UUID) Scan(src interface{}) error {
	var id uuid.UUID
	if err := id.Scan(src); err != nil {
		return err
	}
	*u = UUID(id)
	return nil
}

// Value implements the driver.Valuer interface
func (u UUID) Value() (driver.Value, error) {
	return uuid.UUID(u).Value()
}

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
	UID            UUID      `json:"uid"`
	Content        string    `json:"content"`
	TimeCreated    time.Time `json:"timeCreated"`
	Upvotes        int       `json:"upvotes"`
	IsUpvoted      bool      `json:"isUpvoted"`
	AuthorUsername string    `json:"authorUsername"`
	ChamberUID     UUID      `json:"chamberUid"`
	ChamberName    string    `json:"chamberName"`
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
	UID            UUID      `json:"uid"`
	Content        string    `json:"content"`
	TimeCreated    time.Time `json:"timeCreated"`
	QuestionUID    UUID      `json:"questionUid"`
	Upvotes        int       `json:"upvotes"`
	IsUpvoted      bool      `json:"isUpvoted"`
	AuthorUsername string    `json:"authorUsername"`
}

type Chamber struct {
	UID             UUID      `json:"uid"`
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
