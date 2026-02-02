package app

import (
	"context"
	"echo/internal/handlers"
	"echo/internal/middleware"
	"echo/internal/repository"
	"echo/internal/service"
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	router *http.ServeMux
	repo   *repository.Repository
	svc    *service.Service
}

func New() (*Server, error) {
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	db, err := pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		return nil, fmt.Errorf("failed to create db pool: %w", err)
	}

	repo := repository.New(db)
	svc := service.New(repo)

	s := &Server{
		repo: repo,
		svc:  svc,
	}
	s.setupRouter()
	return s, nil
}

func (s *Server) setupRouter() {

	authH := &handlers.AuthHandler{Service: s.svc}
	userH := &handlers.UserHandler{Service: s.svc}
	questionH := &handlers.QuestionHandler{Service: s.svc}
	replyH := &handlers.ReplyHandler{Service: s.svc}
	chamberH := &handlers.ChamberHandler{Service: s.svc}
	notifH := &handlers.NotificationHandler{Service: s.svc}
	searchH := &handlers.SearchHandler{Service: s.svc}

	mux := http.NewServeMux()

	mux.HandleFunc("POST /auth/signup", authH.Signup)
	mux.HandleFunc("POST /auth/signin", authH.Signin)
	mux.HandleFunc("POST /auth/signout", middleware.Auth(authH.Signout))
	mux.HandleFunc("GET /auth/verify", middleware.Auth(authH.Verify))
	mux.HandleFunc("POST /auth/verify-email", authH.VerifyEmail)
	mux.HandleFunc("POST /auth/resend-verification", authH.ResendVerification)
	mux.HandleFunc("POST /auth/request-password-reset", authH.RequestPasswordReset)
	mux.HandleFunc("POST /auth/reset-password", authH.ResetPassword)

	mux.HandleFunc("GET /users/me", middleware.Auth(userH.GetProfile))
	mux.HandleFunc("DELETE /users/me", middleware.Auth(userH.DeleteUser))
	mux.HandleFunc("GET /users/{username}", userH.GetPublicProfile)
	mux.HandleFunc("PATCH /users/me", middleware.Auth(userH.UpdateUser))

	mux.HandleFunc("GET /users/me/questions", middleware.Auth(questionH.ListUserQuestions))
	mux.HandleFunc("GET /users/me/notifications", middleware.Auth(notifH.ListNotifications))

	mux.HandleFunc("POST /questions", middleware.Auth(questionH.CreateQuestion))
	mux.HandleFunc("GET /questions", middleware.Auth(questionH.ListQuestions))
	mux.HandleFunc("GET /questions/{uid}", questionH.GetQuestion)
	mux.HandleFunc("GET /questions/search", middleware.Auth(questionH.SearchQuestions))
	mux.HandleFunc("DELETE /questions/{uid}", middleware.Auth(questionH.DeleteQuestion))
	mux.HandleFunc("PATCH /questions/{uid}", middleware.Auth(questionH.UpdateQuestion))
	mux.HandleFunc("POST /questions/{uid}/votes", middleware.Auth(questionH.UpdateQuestionVote))

	mux.HandleFunc("POST /questions/{uid}/replies", middleware.Auth(replyH.CreateReply))
	mux.HandleFunc("GET /questions/{uid}/replies", middleware.Auth(replyH.ListReplies))
	mux.HandleFunc("PATCH /questions/{quid}/replies/{ruid}", middleware.Auth(replyH.UpdateReply))
	mux.HandleFunc("DELETE /questions/{quid}/replies/{ruid}", middleware.Auth(replyH.DeleteReply))
	mux.HandleFunc("POST /questions/{quid}/replies/{ruid}/votes", middleware.Auth(replyH.UpdateReplyVote))

	mux.HandleFunc("POST /chambers", middleware.Auth(chamberH.CreateChamber))
	mux.HandleFunc("GET /chambers", middleware.Auth(chamberH.ListChambers))
	mux.HandleFunc("DELETE /chambers", middleware.Auth(chamberH.DeleteChamber))
	mux.HandleFunc("POST /chambers/{uid}/join", middleware.Auth(chamberH.JoinChamber))
	mux.HandleFunc("POST /chambers/{uid}/leave", middleware.Auth(chamberH.LeaveChamber))

	mux.HandleFunc("GET /search", middleware.Auth(searchH.GlobalSearch))

	s.router = mux
}

func (s *Server) Run() error {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: middleware.Logger(middleware.CORS(s.router)),
	}

	slog.Info("starting server", "port", port)
	return srv.ListenAndServe()
}

func (s *Server) Close() {
	if s.repo != nil {
		s.repo.Close()
	}
}
