package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"agent-studio/mcp-go/internal/server"
)

func main() {
	addr := os.Getenv("MCP_HTTP_ADDR")
	if addr == "" {
		addr = ":8090"
	}

	srv := &http.Server{
		Addr:              addr,
		Handler:           server.New(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("mcp-go http listening on %s", addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("listen: %v", err)
	}
}
