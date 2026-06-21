# Rules

Always-apply instruction rules for this plugin — coding conventions, standards,
and checklists the agent should follow on every task. One concern per file.

## How rules reach each provider

- **Claude Code** — rules are copied verbatim into `.claude/rules/`. Claude Code's
  `/plugin install` does **not** distribute rules, so a generated child also ships
  `scripts/install-rules.mjs` to copy them into `~/.claude/rules/` (user) or
  `.claude/rules/` (project). See the README "Rules" section.
- **Codex** — rule content is folded into `AGENTS.md` (committed and
  auto-discovered); nothing extra to install.
- **OpenCode** — rule content is folded into `AGENTS.md` (read natively, with
  `CLAUDE.md` as a compatibility fallback); nothing extra to install.

## Authoring

Each `rules/<name>.md` is a focused, always-true instruction set. Keep them
provider-neutral: the same rule body is copied for Claude Code and folded into
`AGENTS.md` for Codex and OpenCode.
