package store

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type Server struct {
	ID     string         `json:"id"`
	Name   string         `json:"name"`
	Type   string         `json:"type"`
	Config map[string]any `json:"config"`
}

type FileStoreConfig struct {
	Path string
}

type FileStore struct {
	path string
	mu   sync.Mutex
}

func NewFileStore(cfg FileStoreConfig) *FileStore {
	p := cfg.Path
	if p == "" {
		p = "./data/servers.json"
	}
	return &FileStore{path: p}
}

func (s *FileStore) List(ctx context.Context) ([]Server, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.loadLocked(ctx)
}

func (s *FileStore) Create(ctx context.Context, server Server) (Server, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if server.Name == "" {
		return Server{}, errors.New("name_required")
	}
	if server.Type == "" {
		return Server{}, errors.New("type_required")
	}

	servers, err := s.loadLocked(ctx)
	if err != nil {
		return Server{}, err
	}

	server.ID = newID()
	if server.Config == nil {
		server.Config = map[string]any{}
	}
	servers = append([]Server{server}, servers...)

	if err := s.saveLocked(ctx, servers); err != nil {
		return Server{}, err
	}
	return server, nil
}

func (s *FileStore) loadLocked(ctx context.Context) ([]Server, error) {
	_ = ctx
	b, err := os.ReadFile(s.path)
	if err != nil {
		if os.IsNotExist(err) {
			return []Server{}, nil
		}
		return nil, err
	}
	var servers []Server
	if err := json.Unmarshal(b, &servers); err != nil {
		return nil, err
	}
	return servers, nil
}

func (s *FileStore) saveLocked(ctx context.Context, servers []Server) error {
	_ = ctx
	dir := filepath.Dir(s.path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}

	tmp := s.path + ".tmp"
	f, err := os.OpenFile(tmp, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o644)
	if err != nil {
		return err
	}
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(servers); err != nil {
		_ = f.Close()
		_ = os.Remove(tmp)
		return err
	}
	if err := f.Sync(); err != nil {
		_ = f.Close()
		_ = os.Remove(tmp)
		return err
	}
	if err := f.Close(); err != nil {
		_ = os.Remove(tmp)
		return err
	}

	// Atomic-ish replace.
	if err := os.Rename(tmp, s.path); err != nil {
		// Windows fallback is irrelevant on Linux, but keep safe path anyway.
		_ = os.Remove(tmp)
		return err
	}

	// Touch mtime to aid dev scripts.
	_ = os.Chtimes(s.path, time.Now(), time.Now())
	return nil
}

func newID() string {
	buf := make([]byte, 12)
	if _, err := io.ReadFull(rand.Reader, buf); err != nil {
		return "srv_" + time.Now().Format("20060102_150405")
	}
	return "srv_" + hex.EncodeToString(buf)
}
