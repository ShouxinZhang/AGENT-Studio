package handlers

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/ShouxinZhang/AGENT-Studio/backend/learning-go/internal/repo"
	"github.com/go-chi/chi/v5"
)

type fakeNotesRepo struct {
	store map[string]repo.EnglishNote
}

func (f *fakeNotesRepo) Get(ctx context.Context, wordID string) (repo.EnglishNote, bool, error) {
	n, ok := f.store[wordID]
	return n, ok, nil
}

func (f *fakeNotesRepo) Upsert(ctx context.Context, wordID string, contentMD string) (repo.EnglishNote, error) {
	n := repo.EnglishNote{WordID: wordID, ContentMD: contentMD, UpdatedAt: time.Unix(1700000000, 0).UTC()}
	f.store[wordID] = n
	return n, nil
}

func TestEnglishNotes_Get_NotFound(t *testing.T) {
	h := NewEnglishNotesHandler(&fakeNotesRepo{store: map[string]repo.EnglishNote{}})

	r := chi.NewRouter()
	r.Get("/learning/english/notes/{wordId}", h.Get)

	req := httptest.NewRequest(http.MethodGet, "/learning/english/notes/serendipity", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestEnglishNotes_Put_And_Get(t *testing.T) {
	repo := &fakeNotesRepo{store: map[string]repo.EnglishNote{}}
	h := NewEnglishNotesHandler(repo)

	r := chi.NewRouter()
	r.Put("/learning/english/notes/{wordId}", h.Put)
	r.Get("/learning/english/notes/{wordId}", h.Get)

	putBody := []byte(`{"content_md":"# hi"}`)
	putReq := httptest.NewRequest(http.MethodPut, "/learning/english/notes/serendipity", bytes.NewReader(putBody))
	putReq.Header.Set("Content-Type", "application/json")
	putW := httptest.NewRecorder()
	r.ServeHTTP(putW, putReq)
	if putW.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", putW.Code, putW.Body.String())
	}

	getReq := httptest.NewRequest(http.MethodGet, "/learning/english/notes/serendipity", nil)
	getW := httptest.NewRecorder()
	r.ServeHTTP(getW, getReq)
	if getW.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", getW.Code, getW.Body.String())
	}
	if !bytes.Contains(getW.Body.Bytes(), []byte(`"content_md":"# hi"`)) {
		t.Fatalf("expected content_md in response, got: %s", getW.Body.String())
	}
}
