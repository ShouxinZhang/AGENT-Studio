package repo

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type englishNotesRepo struct {
	pool *pgxpool.Pool
}

func NewEnglishNotesRepo(pool *pgxpool.Pool) EnglishNotesRepo {
	return &englishNotesRepo{pool: pool}
}

func (r *englishNotesRepo) Get(ctx context.Context, wordID string) (EnglishNote, bool, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT word_id, content_md, updated_at FROM english_notes WHERE word_id = $1`,
		wordID,
	)
	var n EnglishNote
	if err := row.Scan(&n.WordID, &n.ContentMD, &n.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return EnglishNote{}, false, nil
		}
		return EnglishNote{}, false, err
	}
	return n, true, nil
}

func (r *englishNotesRepo) Upsert(ctx context.Context, wordID string, contentMD string) (EnglishNote, error) {
	row := r.pool.QueryRow(ctx,
		`INSERT INTO english_notes (word_id, content_md)
		 VALUES ($1, $2)
		 ON CONFLICT (word_id)
		 DO UPDATE SET content_md = EXCLUDED.content_md, updated_at = now()
		 RETURNING word_id, content_md, updated_at`,
		wordID,
		contentMD,
	)
	var n EnglishNote
	if err := row.Scan(&n.WordID, &n.ContentMD, &n.UpdatedAt); err != nil {
		return EnglishNote{}, err
	}
	return n, nil
}
