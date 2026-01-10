package repo

import (
	"context"
	"time"
)

type EnglishNote struct {
	WordID    string    `json:"word_id"`
	ContentMD string    `json:"content_md"`
	UpdatedAt time.Time `json:"updated_at"`
}

type EnglishNotesRepo interface {
	Get(ctx context.Context, wordID string) (EnglishNote, bool, error)
	Upsert(ctx context.Context, wordID string, contentMD string) (EnglishNote, error)
}
