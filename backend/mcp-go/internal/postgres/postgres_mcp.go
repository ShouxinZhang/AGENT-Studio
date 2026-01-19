package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

var ErrBadRequest = errors.New("bad_request")

type Config struct {
	DatabaseURI string
	AccessMode  string // "restricted" or "unrestricted"
	DockerImage string
}

type Client struct {
	cfg Config

	mu      sync.Mutex
	session *mcp.ClientSession
	client  *mcp.Client
}

func New(cfg Config) *Client {
	if cfg.AccessMode == "" {
		cfg.AccessMode = "restricted"
	}
	if cfg.DockerImage == "" {
		cfg.DockerImage = "crystaldba/postgres-mcp"
	}
	return &Client{cfg: cfg}
}

func (c *Client) Call(ctx context.Context, tool string, args map[string]any) (any, error) {
	if c.cfg.DatabaseURI == "" {
		return nil, fmt.Errorf("%w: missing_database_uri", ErrBadRequest)
	}
	toolName := strings.TrimPrefix(tool, "postgres_mcp.")
	if toolName == tool {
		return nil, fmt.Errorf("%w: invalid_tool_prefix", ErrBadRequest)
	}

	sess, err := c.getSession(ctx)
	if err != nil {
		return nil, err
	}

	callCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	res, err := sess.CallTool(callCtx, &mcp.CallToolParams{Name: toolName, Arguments: args})
	if err != nil {
		// If the session is broken, drop it so next call reconnects.
		c.dropSession()
		return nil, err
	}
	if res.IsError {
		c.dropSession()
		return nil, fmt.Errorf("tool_error: %s", toolName)
	}

	return normalizeToolContent(res.Content)
}

func (c *Client) getSession(ctx context.Context) (*mcp.ClientSession, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.session != nil {
		return c.session, nil
	}

	impl := &mcp.Implementation{Name: "agent-studio-mcp-go", Version: "0.1.0"}
	c.client = mcp.NewClient(impl, nil)

	cmd := exec.Command(
		"docker",
		"run",
		"-i",
		"--rm",
		"-e",
		"DATABASE_URI",
		c.cfg.DockerImage,
		"--access-mode="+c.cfg.AccessMode,
	)
	cmd.Env = append(cmd.Environ(), "DATABASE_URI="+c.cfg.DatabaseURI)

	transport := &mcp.CommandTransport{Command: cmd}

	sess, err := c.client.Connect(ctx, transport, nil)
	if err != nil {
		return nil, err
	}
	c.session = sess
	return sess, nil
}

func (c *Client) dropSession() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.session != nil {
		_ = c.session.Close()
		c.session = nil
	}
}

func normalizeToolContent(content []mcp.Content) (any, error) {
	if len(content) == 0 {
		return map[string]any{}, nil
	}
	// Common case: a single text content containing JSON.
	if len(content) == 1 {
		if tc, ok := content[0].(*mcp.TextContent); ok {
			text := strings.TrimSpace(tc.Text)
			if text == "" {
				return map[string]any{}, nil
			}
			var v any
			if json.Unmarshal([]byte(text), &v) == nil {
				return v, nil
			}
			return map[string]any{"text": text}, nil
		}
	}

	// Fallback: return all text chunks.
	out := make([]string, 0, len(content))
	for _, c := range content {
		if tc, ok := c.(*mcp.TextContent); ok {
			out = append(out, tc.Text)
		}
	}
	if len(out) > 0 {
		return map[string]any{"text": strings.Join(out, "\n")}, nil
	}
	return map[string]any{"content": fmt.Sprintf("%T", content[0])}, nil
}
