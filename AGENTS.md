# Repo Agent Instructions

## Skills

Canonical (single source of truth) Skill packages live in `docs/skills/`.

Each Skill is a folder containing a `SKILL.md` with YAML frontmatter (`name`, `description`) plus optional `scripts/`, `references/`, and `assets/`.

If you need Codex / Claude Code auto-discovery, link or copy `docs/skills/` into:

- Codex: `.codex/skills/`
- Claude Code: `.claude/skills/`
- 代码构建应该尽可能遵循模块化原则，不同模块尽可能不要互相干扰。任何实验性功能，其全部文件都尽可能在一个子模块里，不要在大的模块里生产垃圾文件
- 构建新的代码之前，应该先查看已经有的代码，减少代码冗余度
- 任何新的改动，都尽可能保持简洁原则，不要节外生枝，擅自添加功能规划。
- 一切代码实现面向业务优先，以实现功能为第一标准；其次是长远架构规划，再次是模块风格简洁高效
- 任何新代码，严禁存放在高级模块（例如根目录或者其它高级模块层)，必须根据实际应用存放在叶子模块目录里！

给用户的代码解释，总是应该从业务角度说明，虽然用户是一名开发者，但实际解释的时候需要将用户视作一名管理的领导，领导只希望知道代码能干什么业务，优点，缺点。
