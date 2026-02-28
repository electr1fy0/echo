package app

import (
	"context"
	"echo/internal/handlers"
	"echo/internal/middleware"
	"echo/internal/service"
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	router chi.Router
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

	svc := service.New(db)

	s := &Server{
		svc: svc,
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

	r := chi.NewRouter()
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.CORS)

	pingHandler := func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		if req.Method != http.MethodHead {
			_, _ = w.Write([]byte("pong"))
		}
	}
	r.MethodFunc(http.MethodGet, "/ping", pingHandler)
	r.MethodFunc(http.MethodHead, "/ping", pingHandler)
	r.MethodFunc(http.MethodPost, "/ping", pingHandler)

	r.Route("/auth", func(r chi.Router) {
		r.Post("/signup", authH.Signup)
		r.Post("/signin", authH.Signin)
		r.Post("/verify-email", authH.VerifyEmail)
		r.Post("/resend-verification", authH.ResendVerification)
		r.Post("/request-password-reset", authH.RequestPasswordReset)
		r.Post("/reset-password", authH.ResetPassword)
		r.Post("/google/onboarding", authH.CompleteGoogleOnboarding)
		r.Get("/signin-with-google", authH.SigninWithGoogle)
		r.Get("/callback", authH.CallbackHandler)
		r.Get("/google/callback", authH.CallbackHandler)

		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth)
			r.Post("/signout", authH.Signout)
			r.Get("/verify", authH.Verify)
		})
	})

	r.Route("/users", func(r chi.Router) {
		r.Get("/{username}", userH.GetPublicProfile)

		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth)
			r.Get("/me", userH.GetProfile)
			r.Patch("/me", userH.UpdateUser)
			r.Delete("/me", userH.DeleteUser)
			r.Get("/me/questions", questionH.ListUserQuestions)
			r.Get("/me/notifications", notifH.ListNotifications)
			r.Get("/search", userH.SearchUsers)
			r.Post("/resolve", userH.ResolveUsers)
		})
	})

	r.Route("/questions", func(r chi.Router) {
		r.Use(middleware.Auth)
		r.Get("/", questionH.ListQuestions)
		r.Post("/", questionH.CreateQuestion)
		r.Get("/search", questionH.SearchQuestions)

		r.Route("/{uid}", func(r chi.Router) {
			r.Get("/", questionH.GetQuestion)
			r.Patch("/", questionH.UpdateQuestion)
			r.Delete("/", questionH.DeleteQuestion)
			r.Post("/votes", questionH.UpdateQuestionVote)
			r.Post("/pin", questionH.PinQuestion)
			r.Delete("/pin", questionH.UnpinQuestion)

			r.Get("/replies", replyH.ListReplies)
			r.Post("/replies", replyH.CreateReply)
			r.Route("/replies/{ruid}", func(r chi.Router) {
				r.Patch("/", replyH.UpdateReply)
				r.Delete("/", replyH.DeleteReply)
				r.Post("/votes", replyH.UpdateReplyVote)
				r.Post("/accept", replyH.AcceptReply)
				r.Delete("/accept", replyH.UnacceptReply)
			})
		})
	})

	r.Route("/chambers", func(r chi.Router) {
		r.Use(middleware.Auth)
		r.Get("/", chamberH.ListChambers)
		r.Post("/", chamberH.CreateChamber)
		r.Delete("/", chamberH.DeleteChamber)

		r.Route("/{uid}", func(r chi.Router) {
			r.Patch("/", chamberH.UpdateChamber)
			r.Post("/join", chamberH.JoinChamber)
			r.Post("/leave", chamberH.LeaveChamber)
		})
	})

	r.With(middleware.Auth).Get("/search", searchH.GlobalSearch)

	s.router = r
}

func (s *Server) Run() error {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: s.router,
	}

	slog.Info("starting server", "port", port)
	return srv.ListenAndServe()
}

func (s *Server) Close() {
	if s.svc != nil {
		s.svc.Close()
	}
}
