# AGENT Studio

**An AI agent development & interaction workbench** — combines a modern chat UI with a Game Playground for agent development, testing, and RL experimentation.

## ⚡ Quick Start

```bash
# One-click start (recommended)
chmod +x restart.sh && ./restart.sh

# Or run manually
npm install && npm run dev        # Frontend :3115
cd backend/game-py && pip install -r requirements.txt && python main.py  # Backend  :8000

# Learning backend (Go) + Postgres
docker compose -f backend/infra/postgres/compose.yml up -d
cd backend/learning-go && DATABASE_URL='postgresql://agent_studio:agent_studio@localhost:5432/agent_studio?sslmode=disable' go run ./cmd/server
```

Configure `.env.local`:

```
OPENROUTER_API_KEY=your_key

# Optional: override Learning API base URL (default: http://localhost:8081)
# NEXT_PUBLIC_LEARNING_API_BASE_URL=http://localhost:8081
```

## 🗺️ Roadmap (Planned)

### Conversation memory & agent thought flow

- **Memory management**: pluggable memory (summaries / vector / structured), with long-term vs working memory
- **Thread tree**: branched conversations, references/backtracking, diff/merge for exploratory reasoning
- **Loop structure**: observable “sense → think → act → reflect/evaluate” execution chain (tracing/replay)

### Game data & Agent-SQL

- **Data flywheel**: large-scale trajectories from gameplay (state/action/reward/render/metadata)
- **Database as source of truth**: queryable, reusable, evaluatable datasets (training/regression/comparison)
- **Agent-SQL**: let an agent turn “collect → clean → analyze → evaluate” into auditable SQL/query workflows

## ✦ Key Features

### 🤖 AI Chat

- **Streaming chat** — Vercel AI SDK + OpenRouter (Gemini/Claude/GPT and more)
- **Reasoning display** — native support for showing reasoning/thought parts
- **Multi-conversation** — persisted via Zustand, supports editing and regenerate

### 🎮 Game Playground

- **Arcade games** — Snake 🐍, Tetris 🧱 (frontend-rendered)
- **RL classic envs** — CartPole, MountainCar, Acrobot, Pendulum (Gymnasium)
- **Two render modes** — `scene` (frontend Canvas) / `frame` (Python-rendered frames)
- **Extensible registry** — add new games via a centralized registry

## ◈ Tech Stack

| Frontend              | Backend           |
| --------------------- | ----------------- |
| Next.js 16 + React 19 | FastAPI + Uvicorn |
| Vercel AI SDK         | Gymnasium         |
| Tailwind CSS 4        | Python 3.x        |
| Zustand               | Session Manager   |

## 📁 Project Structure

```
src/
├── app/api/chat/       # Chat API (OpenRouter)
├── app/playground/     # Lobby & game page
├── components/features # Chat/Playground feature modules
└── lib/games/          # Game registry

backend/
├── main.py             # FastAPI entry
└── engine/             # Game engine (Snake, Tetris, Gym wrapper)
```

## 🛠️ Dev Docs

- [Chat architecture](docs/dev_docs/2025-12-31-chat-architecture-refactor.md)
- [Playground roadmap](docs/dev_docs/2025-12-31-game-playground-roadmap.md)
- [Skills](docs/skills/)

---

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
</p>
