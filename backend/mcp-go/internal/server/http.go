package server

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"agent-studio/mcp-go/internal/postgres"
	"agent-studio/mcp-go/internal/store"
)

type mcpCallRequest struct {
	Tool string         `json:"tool"`
	Args map[string]any `json:"args"`
}

type mcpValidateRequest struct {
	Type string `json:"type"`
	Name string `json:"name"`
}

type mcpValidateResponse struct {
	State     string `json:"state"`
	Publisher string `json:"publisher,omitempty"`
	Name      string `json:"name,omitempty"`
	Version   string `json:"version,omitempty"`
	Readme    string `json:"readme,omitempty"`
	Error     string `json:"error,omitempty"`
	ErrorType string `json:"errorType,omitempty"`
}

func New() http.Handler {
	mux := http.NewServeMux()

	st := store.NewFileStore(store.FileStoreConfig{Path: getenv("MCP_SERVERS_PATH", "./data/servers.json")})
	pg := postgres.New(postgres.Config{
		DatabaseURI: getenv("POSTGRES_MCP_DATABASE_URI", getenv("DATABASE_URI", getenv("DATABASE_URL", ""))),
		AccessMode:  getenv("POSTGRES_MCP_ACCESS_MODE", "restricted"),
		DockerImage: getenv("POSTGRES_MCP_DOCKER_IMAGE", "crystaldba/postgres-mcp"),
	})

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{"ok": true, "time": time.Now().UTC().Format(time.RFC3339)})
	})

	mux.HandleFunc("GET /mcp/servers", func(w http.ResponseWriter, r *http.Request) {
		servers, err := st.List(r.Context())
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "servers_list_failed", "message": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, servers)
	})

	mux.HandleFunc("POST /mcp/servers", func(w http.ResponseWriter, r *http.Request) {
		var req store.Server
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "bad_json"})
			return
		}

		created, err := st.Create(r.Context(), store.Server{
			Name:   strings.TrimSpace(req.Name),
			Type:   strings.TrimSpace(req.Type),
			Config: req.Config,
		})
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "servers_create_failed", "message": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, created)
	})

	mux.HandleFunc("POST /mcp/validate", func(w http.ResponseWriter, r *http.Request) {
		var req mcpValidateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, mcpValidateResponse{State: "error", Error: "bad_json"})
			return
		}
		t := strings.TrimSpace(req.Type)
		n := strings.TrimSpace(req.Name)
		if t == "" || n == "" {
			writeJSON(w, http.StatusBadRequest, mcpValidateResponse{State: "error", Error: "missing_type_or_name"})
			return
		}
		writeJSON(w, http.StatusOK, mcpValidateResponse{State: "ok", Name: n, Publisher: t})
	})

	mux.HandleFunc("POST /mcp/call", func(w http.ResponseWriter, r *http.Request) {
		var req mcpCallRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "bad_json"})
			return
		}

		tool := strings.TrimSpace(req.Tool)
		if tool == "" {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "missing_tool"})
			return
		}

		args := req.Args
		if args == nil {
			args = map[string]any{}
		}

		if strings.HasPrefix(tool, "postgres_mcp.") {
			res, err := pg.Call(r.Context(), tool, args)
			if err != nil {
				code := http.StatusInternalServerError
				if errors.Is(err, postgres.ErrBadRequest) {
					code = http.StatusBadRequest
				}
				writeJSON(w, code, map[string]any{"error": "mcp_call_failed", "message": err.Error()})
				return
			}
			writeJSON(w, http.StatusOK, res)
			return
		}

		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "unknown_tool", "tool": tool})
	})

	return withCORS(mux)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type,Accept")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func getenv(k, def string) string {
	v := os.Getenv(k)
	if v == "" {
		return def
	}
	return v
}
