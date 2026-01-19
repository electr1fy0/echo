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

func main() {
	db, err = pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal("failed to create pool:", err)
	}
	defer db.Close()
	h := &handlers.APIHandler{DB: db}
	mux := http.NewServeMux()
	mux.HandleFunc("POST /auth/signup", h.Signup)
	mux.HandleFunc("POST /auth/signin", h.Signin)
	mux.HandleFunc("POST /auth/signout", middleware.Auth(h.Signout))
	mux.HandleFunc("GET /auth/verify", middleware.Auth(h.Verify))
	mux.HandleFunc("POST /auth/verify-email", h.VerifyEmail)
	mux.HandleFunc("POST /auth/resend-verification", h.ResendVerification)
	mux.HandleFunc("POST /auth/request-password-reset", h.RequestPasswordReset)
	mux.HandleFunc("POST /auth/reset-password", h.ResetPassword)
	mux.HandleFunc("GET /users/me", middleware.Auth(h.GetProfile))
	mux.HandleFunc("DELETE /users/me", middleware.Auth(h.DeleteUser))
	mux.HandleFunc("GET /users/{username}", h.GetPublicProfile)
	mux.HandleFunc("PATCH /users/me", middleware.Auth(h.UpdateUser))
	mux.HandleFunc("GET /users/me/questions", middleware.Auth(h.ListUserQuestions))
	mux.HandleFunc("GET /users/me/notifications", middleware.Auth(h.ListNotifications))
	mux.HandleFunc("POST /questions", middleware.Auth(h.CreateQuestion))
	mux.HandleFunc("GET /questions", middleware.Auth(h.ListQuestions))
	mux.HandleFunc("GET /questions/{uid}", h.GetQuestion)
	mux.HandleFunc("GET /questions/search", middleware.Auth(h.SearchQuestions))
	mux.HandleFunc("DELETE /questions/{uid}", middleware.Auth(h.DeleteQuestion))
	mux.HandleFunc("PATCH /questions/{uid}", middleware.Auth(h.UpdateQuestion))
	mux.HandleFunc("POST /questions/{uid}/votes", middleware.Auth(h.UpdateQuestionVote))
	mux.HandleFunc("POST /questions/{uid}/replies", middleware.Auth(h.CreateReply))
	mux.HandleFunc("GET /questions/{uid}/replies", middleware.Auth(h.ListReplies))
	mux.HandleFunc("PATCH /questions/{quid}/replies/{ruid}", middleware.Auth(h.UpdateReply))
	mux.HandleFunc("DELETE /questions/{quid}/replies/{ruid}", middleware.Auth(h.DeleteReply))
	mux.HandleFunc("POST /questions/{quid}/replies/{ruid}/votes", middleware.Auth(h.UpdateReplyVote))
	mux.HandleFunc("POST /chambers", middleware.Auth(h.CreateChamber))
	mux.HandleFunc("GET /chambers", middleware.Auth(h.ListChambers))
	mux.HandleFunc("DELETE /chambers", middleware.Auth(h.DeleteChamber))
	mux.HandleFunc("POST /chambers/{uid}/join", middleware.Auth(h.JoinChamber))
	mux.HandleFunc("POST /chambers/{uid}/leave", middleware.Auth(h.LeaveChamber))
	mux.HandleFunc("GET /search", middleware.Auth(h.GlobalSearch))
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: middleware.Logger(middleware.CORS(mux)),
	}
	fmt.Println("starting server on :" + port)
	log.Fatal(srv.ListenAndServe())
}
