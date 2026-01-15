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

	mux.HandleFunc("POST /auth/register", nil)
	mux.HandleFunc("POST /auth/login", nil)
	mux.HandleFunc("POST /auth/logout", nil)
	mux.HandleFunc("GET /users/{id}", nil)
	mux.HandleFunc("PATCH /users/{id}", nil)
	mux.HandleFunc("POST /users/{id}/questions", nil)
	mux.HandleFunc("POST /questions/{id}/vote", nil)
	mux.HandleFunc("DELETE /questions/{id}/vote", nil)
	mux.HandleFunc("POST /questions", nil)
	mux.HandleFunc("GET /questions", nil)
	mux.HandleFunc("GET /questions/{id}", nil)
	mux.HandleFunc("DELETE /questions/{id}", nil)
	mux.HandleFunc("POST /questions/{id}/replies", nil)
	mux.HandleFunc("GET /questions/{id}/replies", nil)

	srv := &http.Server{
		Addr:    ":8080",
		Handler: middleware.CORS(mux),
	}

	fmt.Println("starting server on :8080")
	log.Fatal(srv.ListenAndServe())
}
