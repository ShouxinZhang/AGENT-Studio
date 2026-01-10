package config

import (
	"errors"
	"os"
	"strconv"
)

type Config struct {
	HTTPAddr      string
	DatabaseURL   string
	MigrationsDir string
	RunMigrations bool
}

func Load() (Config, error) {
	cfg := Config{
		HTTPAddr:      envOr("LEARNING_HTTP_ADDR", ":8081"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		MigrationsDir: envOr("LEARNING_MIGRATIONS_DIR", "migrations"),
		RunMigrations: envBoolOr("LEARNING_RUN_MIGRATIONS", true),
	}
	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}
	return cfg, nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envBoolOr(key string, fallback bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return b
}
