# Learning Backend (Go)

Minimal Go service for the Learning module.

## Run (Local)

1) Start Postgres:

```bash
docker compose -f backend/infra/postgres/compose.yml up -d
```

2) Run the service:

```bash
cd backend/learning-go

# If your local Postgres is already using 5432, switch compose port:
# AGENT_STUDIO_PG_PORT=55432 docker compose -f backend/infra/postgres/compose.yml up -d

export DATABASE_URL='postgresql://agent_studio:agent_studio@localhost:5432/agent_studio?sslmode=disable'
export LEARNING_HTTP_ADDR=':8081'
export LEARNING_RUN_MIGRATIONS=true

go run ./cmd/server
```

## API

- `GET /healthz`
- `GET /learning/english/notes/{wordId}`
- `PUT /learning/english/notes/{wordId}` with JSON `{ "content_md": "..." }`
