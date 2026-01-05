# Workspace Agent Skills

Canonical skill packages are stored in this folder (`docs/skills/`).

If you want Codex / Claude Code to auto-discover them, link/copy this folder into:

- Codex: `.codex/skills/`
- Claude Code: `.claude/skills/`

## Included skills

- `agent-studio`: Run/debug the full stack (Next.js + FastAPI), find key paths, and follow common dev workflows.
- `agent-studio-chat`: Work on the chat UI and `/api/chat` (Vercel AI SDK + OpenRouter), including streaming/reasoning and message editing.
- `agent-studio-playground`: Work on Game Playground (frontend `/playground` + backend game API), including adding/debugging games and render modes.

## References

- https://developers.openai.com/codex/skills/
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview

