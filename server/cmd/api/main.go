package main

import (
	"echo/internal/app"
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)
	_ = godotenv.Load()

	server, err := app.New()
	if err != nil {
		slog.Error("failed to initialize app", "error", err)
		os.Exit(1)
	}
	defer server.Close()

	if err := server.Run(); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
