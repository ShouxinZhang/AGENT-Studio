package http

import (
	"net/http"

	"github.com/ShouxinZhang/AGENT-Studio/backend/learning-go/internal/config"
	"github.com/ShouxinZhang/AGENT-Studio/backend/learning-go/internal/http/handlers"
	"github.com/ShouxinZhang/AGENT-Studio/backend/learning-go/internal/repo"
	"github.com/go-chi/chi/v5"
)

type Server struct {
	cfg       config.Config
	notesRepo repo.EnglishNotesRepo
	router    chi.Router
}

func NewServer(cfg config.Config, notesRepo repo.EnglishNotesRepo) *Server {
	s := &Server{cfg: cfg, notesRepo: notesRepo}
	r := chi.NewRouter()

	// Minimal CORS for local dev (frontend :3115 or :3000).
	r.Use(devCORS)

	r.Get("/healthz", handlers.Healthz)

	r.Route("/learning/english", func(r chi.Router) {
		h := handlers.NewEnglishNotesHandler(notesRepo)
		r.Get("/notes/{wordId}", h.Get)
		r.Put("/notes/{wordId}", h.Put)
	})

	s.router = r
	return s
}

func (s *Server) Router() http.Handler {
	return s.router
}

func devCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		// Allow any localhost/127.0.0.1/LAN IP for local dev
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET,PUT,POST,PATCH,DELETE,OPTIONS")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
