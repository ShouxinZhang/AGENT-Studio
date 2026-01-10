package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ShouxinZhang/AGENT-Studio/backend/learning-go/internal/config"
	"github.com/ShouxinZhang/AGENT-Studio/backend/learning-go/internal/db"
	apphttp "github.com/ShouxinZhang/AGENT-Studio/backend/learning-go/internal/http"
	"github.com/ShouxinZhang/AGENT-Studio/backend/learning-go/internal/repo"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := db.OpenPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db open: %v", err)
	}
	defer pool.Close()

	if cfg.RunMigrations {
		if err := db.RunMigrations(pool, cfg.MigrationsDir); err != nil {
			log.Fatalf("migrations: %v", err)
		}
	}

	notesRepo := repo.NewEnglishNotesRepo(pool)
	srv := apphttp.NewServer(cfg, notesRepo)

	httpServer := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           srv.Router(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("learning-go listening on %s", cfg.HTTPAddr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("http listen: %v", err)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = httpServer.Shutdown(shutdownCtx)
	log.Printf("learning-go stopped")
}
