package main

import (
	"context"
	"echo/internal/handlers"
	"echo/internal/middleware"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	db  *pgxpool.Pool
	err error
)

// func Chain(h http.Handler,  middlewares ...func(http.Handler) http.Handler) http.Handler{

// }

func main() {
	db, err = pgxpool.New(context.Background(), os.Getenv("POSTGRES_CONN_STR"))
	if err != nil {
		log.Fatal("failed to create pool:", err)
	}
	defer db.Close()

	h := &handlers.APIHandler{DB: db}

	mux := http.NewServeMux()

	mux.HandleFunc("POST /auth/register", h.Register)
	mux.HandleFunc("POST /auth/login", h.Login)
	mux.HandleFunc("POST /auth/logout", h.Logout)

	mux.HandleFunc("GET /users/{uid}", h.GetUser)
	mux.HandleFunc("PATCH /users/{uid}", h.UpdateUser)

	mux.HandleFunc("/questions/{id}/vote", h.UpdateVote)

	mux.HandleFunc("POST /questions", h.CreateQuestion)
	mux.HandleFunc("GET /questions", h.ListQuestions)

	mux.HandleFunc("GET /questions/{uid}", h.GetQuestion)
	mux.HandleFunc("DELETE /questions/{uid}", h.DeleteQuestion)

	mux.HandleFunc("POST /questions/{uid}/replies", h.CreateReply)
	mux.HandleFunc("DELETE /questions/{quid}/replies/{ruid}", h.DeleteReply)
	mux.HandleFunc("UPDATE /questions/{quid}/replies/{ruid}", h.UpdateReply)
	mux.HandleFunc("GET /questions/{uid}/replies", h.ListReplies)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: middleware.CORS(mux),
	}

	fmt.Println("starting server on :" + port)
	log.Fatal(srv.ListenAndServe())
}
