package reddit

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RedditPost struct {
	Data struct {
		ID         string  `json:"id"`
		Title      string  `json:"title"`
		Selftext   string  `json:"selftext"`
		Author     string  `json:"author"`
		Score      int     `json:"score"`
		CreatedUTC float64 `json:"created_utc"`
	} `json:"data"`
}

type RedditListing struct {
	Data struct {
		Children []RedditPost `json:"children"`
	} `json:"data"`
}

type RedditComment struct {
	Data struct {
		ID         string  `json:"id"`
		Body       string  `json:"body"`
		Author     string  `json:"author"`
		Score      int     `json:"score"`
		CreatedUTC float64 `json:"created_utc"`
	} `json:"data"`
}

type RedditCommentListing struct {
	Data struct {
		Children []struct {
			Data struct {
				ID         string  `json:"id"`
				Body       string  `json:"body"`
				Author     string  `json:"author"`
				Score      int     `json:"score"`
				CreatedUTC float64 `json:"created_utc"`
			} `json:"data"`
		} `json:"children"`
	} `json:"data"`
}

type SyncState struct {
	UID             uuid.UUID
	Subreddit       string
	ChamberUID      uuid.UUID
	LastSyncAt      *time.Time
	ImportedPostIDs []string
}

func ShouldSync(ctx context.Context, db *pgxpool.Pool, chamberUID uuid.UUID) (bool, *SyncState, error) {
	log.Printf("[reddit] checking sync for chamber %s", chamberUID)
	var state SyncState
	var importedIDs []string
	err := db.QueryRow(ctx, `
		SELECT uid, subreddit, chamber_uid, last_sync_at, imported_post_ids
		FROM reddit_sync_state
		WHERE chamber_uid = $1
	`, chamberUID).Scan(&state.UID, &state.Subreddit, &state.ChamberUID, &state.LastSyncAt, &importedIDs)
	if err != nil {
		log.Printf("[reddit] no sync state found for chamber: %v", err)
		return false, nil, nil
	}
	state.ImportedPostIDs = importedIDs
	log.Printf("[reddit] found sync state for r/%s, last_sync: %v", state.Subreddit, state.LastSyncAt)
	if state.LastSyncAt == nil {
		log.Printf("[reddit] first sync for r/%s", state.Subreddit)
		return true, &state, nil
	}
	if time.Since(*state.LastSyncAt) > 15*time.Minute {
		log.Printf("[reddit] sync needed, last was %v ago", time.Since(*state.LastSyncAt))
		return true, &state, nil
	}
	log.Printf("[reddit] sync not needed, last was %v ago", time.Since(*state.LastSyncAt))
	return false, &state, nil
}

func SyncSubreddit(ctx context.Context, db *pgxpool.Pool, state *SyncState) error {
	log.Printf("[reddit] starting sync for r/%s", state.Subreddit)
	posts, err := fetchPosts(state.Subreddit)
	if err != nil {
		log.Printf("[reddit] failed to fetch posts: %v", err)
		return fmt.Errorf("fetch posts: %w", err)
	}
	log.Printf("[reddit] fetched %d posts from r/%s", len(posts), state.Subreddit)
	importedSet := make(map[string]bool)
	for _, id := range state.ImportedPostIDs {
		importedSet[id] = true
	}
	sevenDaysAgo := time.Now().AddDate(0, 0, -7)
	newPostIDs := []string{}
	skipped := 0
	inserted := 0
	for _, post := range posts {
		if importedSet[post.Data.ID] {
			skipped++
			continue
		}
		postTime := time.Unix(int64(post.Data.CreatedUTC), 0)
		if postTime.Before(sevenDaysAgo) {
			skipped++
			continue
		}
		content := post.Data.Title
		if post.Data.Selftext != "" {
			content = post.Data.Title + "\n\n" + post.Data.Selftext
		}
		if !strings.Contains(content, "?") {
			skipped++
			continue
		}
		author := "u/" + post.Data.Author
		db.Exec(ctx, `INSERT INTO users (username, email, password) VALUES ($1, $2, '') ON CONFLICT (username) DO NOTHING`, author, author+"@reddit.com")
		questionUID := uuid.New()
		_, err := db.Exec(ctx, `
			INSERT INTO questions (uid, content, author, chamber_uid, upvotes_count, reddit_upvotes, time_created)
			VALUES ($1, $2, $3, $4, 0, $5, $6)
		`, questionUID, content, author, state.ChamberUID, post.Data.Score, postTime)
		if err != nil {
			log.Printf("[reddit] insert error: %v", err)
			continue
		}
		inserted++
		comments, err := fetchComments(state.Subreddit, post.Data.ID)
		if err == nil {
			for _, comment := range comments {
				if comment.Data.Body == "" || comment.Data.Body == "[deleted]" || comment.Data.Body == "[removed]" {
					continue
				}
				commentAuthor := "u/" + comment.Data.Author
				db.Exec(ctx, `INSERT INTO users (username, email, password) VALUES ($1, $2, '') ON CONFLICT (username) DO NOTHING`, commentAuthor, commentAuthor+"@reddit.com")
				commentTime := time.Unix(int64(comment.Data.CreatedUTC), 0)
				_, _ = db.Exec(ctx, `
					INSERT INTO answers (uid, content, author, question_uid, upvotes_count, reddit_upvotes, time_created)
					VALUES ($1, $2, $3, $4, 0, $5, $6)
				`, uuid.New(), comment.Data.Body, commentAuthor, questionUID, comment.Data.Score, commentTime)
			}
		}
		newPostIDs = append(newPostIDs, post.Data.ID)
	}
	log.Printf("[reddit] inserted %d posts, skipped %d", inserted, skipped)
	allIDs := append(state.ImportedPostIDs, newPostIDs...)
	_, err = db.Exec(ctx, `
		UPDATE reddit_sync_state
		SET last_sync_at = $1, imported_post_ids = $2
		WHERE uid = $3
	`, time.Now(), allIDs, state.UID)
	return err
}

func fetchPosts(subreddit string) ([]RedditPost, error) {
	url := fmt.Sprintf("https://old.reddit.com/r/%s/new.json?limit=25", subreddit)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "web:echo-app:v1.0 (by /u/echo_app_bot)")
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body := make([]byte, 500)
		n, _ := resp.Body.Read(body)
		log.Printf("[reddit] bad status %d: %s", resp.StatusCode, string(body[:n]))
		return nil, fmt.Errorf("reddit returned status %d", resp.StatusCode)
	}
	var listing RedditListing
	if err := json.NewDecoder(resp.Body).Decode(&listing); err != nil {
		return nil, err
	}
	return listing.Data.Children, nil
}

func fetchComments(subreddit, postID string) ([]struct {
	Data struct {
		ID         string  `json:"id"`
		Body       string  `json:"body"`
		Author     string  `json:"author"`
		Score      int     `json:"score"`
		CreatedUTC float64 `json:"created_utc"`
	} `json:"data"`
}, error) {
	url := fmt.Sprintf("https://old.reddit.com/r/%s/comments/%s.json?limit=10", subreddit, postID)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "web:echo-app:v1.0 (by /u/echo_app_bot)")
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var listings []RedditCommentListing
	if err := json.NewDecoder(resp.Body).Decode(&listings); err != nil {
		return nil, err
	}
	if len(listings) < 2 {
		return nil, nil
	}
	return listings[1].Data.Children, nil
}
