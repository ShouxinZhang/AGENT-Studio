# PostgreSQL (Local Dev)

This folder provides a single-command PostgreSQL instance for local development.

## Start

```bash
docker compose -f backend/infra/postgres/compose.yml up -d
```

## Connection

Default connection string:

```text
postgresql://agent_studio:agent_studio@localhost:5432/agent_studio?sslmode=disable
```

## Change Port

If `5432` is already taken (common if you already have a local Postgres running):

- Option A (recommended): change host port for this repo
- Option B: stop your existing Postgres and keep using `5432`

```bash
export AGENT_STUDIO_PG_PORT=55432
docker compose -f backend/infra/postgres/compose.yml up -d
```

To free `5432` on Linux (if you know what you're doing):

```bash
sudo systemctl stop postgresql || true
sudo systemctl disable postgresql || true
```

## Stop

```bash
docker compose -f backend/infra/postgres/compose.yml down
```

## Reset Data (DANGER)

```bash
docker compose -f backend/infra/postgres/compose.yml down -v
```
