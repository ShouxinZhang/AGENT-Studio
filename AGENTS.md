# Repo Agent Instructions

## Skills

Canonical (single source of truth) Skill packages live in `docs/skills/`.

Each Skill is a folder containing a `SKILL.md` with YAML frontmatter (`name`, `description`) plus optional `scripts/`, `references/`, and `assets/`.

If you need Codex / Claude Code auto-discovery, link or copy `docs/skills/` into:

- Codex: `.codex/skills/`
- Claude Code: `.claude/skills/`

