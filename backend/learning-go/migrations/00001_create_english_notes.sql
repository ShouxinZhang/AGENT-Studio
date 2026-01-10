-- +goose Up
CREATE TABLE IF NOT EXISTS english_notes (
  word_id TEXT PRIMARY KEY,
  content_md TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS english_notes;
