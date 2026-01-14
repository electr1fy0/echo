package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

type Question struct {
	Title   string `json:"title"`
	Content string `json:"content"`

	TimeCreated time.Time `json:"timeCreated"`
}

var (
	conn, err = pgx.Connect(context.Background(), os.Getenv("POSTGRES_CONN_STR"))
)

func createHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	defer r.Body.Close()
	var question Question
	json.NewDecoder(r.Body).Decode(&question)

	_, err := conn.Exec(ctx, "insert into questions (title, content) values ($1, $2)", question.Title, question.Content)
	if err != nil {
		http.Error(w, "failed to insert data: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write([]byte("all good"))
}

func CORSMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	}
}

func listHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	q := r.URL.Query()
	limit := q.Get("limit")
	offset := q.Get("offset")

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("failed to connect to db"))
		return
	}

	rows, err := conn.Query(ctx, "select title, content, time_created from questions limit $1 offset $2", limit, offset)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("failed to query rows" + err.Error()))
		return
	}

	questions := make([]Question, 0)
	for rows.Next() {
		var q Question
		err := rows.Scan(&q.Title, &q.Content, &q.TimeCreated)
		if err != nil {
			fmt.Println("failed to scan row", err)
			return
		}
		questions = append(questions, q)
	}
	rows.Close()
	json.NewEncoder(w).Encode(questions)
}

func main() {
	http.HandleFunc("/question/create", CORSMiddleware(createHandler))
	http.HandleFunc("/question/list", CORSMiddleware(listHandler))

	fmt.Println("starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
