package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/ShouxinZhang/AGENT-Studio/backend/learning-go/internal/repo"
	"github.com/go-chi/chi/v5"
)

type EnglishNotesHandler struct {
	repo repo.EnglishNotesRepo
}

type putNoteRequest struct {
	ContentMD string `json:"content_md"`
}

func NewEnglishNotesHandler(r repo.EnglishNotesRepo) *EnglishNotesHandler {
	return &EnglishNotesHandler{repo: r}
}

func (h *EnglishNotesHandler) Get(w http.ResponseWriter, r *http.Request) {
	wordID := strings.TrimSpace(chi.URLParam(r, "wordId"))
	if wordID == "" {
		http.Error(w, "wordId is required", http.StatusBadRequest)
		return
	}

	n, ok, err := h.repo.Get(r.Context(), wordID)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if !ok {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(n)
}

func (h *EnglishNotesHandler) Put(w http.ResponseWriter, r *http.Request) {
	wordID := strings.TrimSpace(chi.URLParam(r, "wordId"))
	if wordID == "" {
		http.Error(w, "wordId is required", http.StatusBadRequest)
		return
	}

	var req putNoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	n, err := h.repo.Upsert(r.Context(), wordID, req.ContentMD)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(n)
}
