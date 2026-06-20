# Provider Contract — codex-home

- **Target:** `codex`
- **Scope (kind):** `home` — CLI global config (`~/.codex/`).
- **Root:** `.codex`
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `agents/*.md` | `.codex/agents/<name>.toml` | `.md` → `.toml`; frontmatter + body rewritten into a TOML document (`name`/`description`/`tools` keys + multi-line `instructions`) |
| (consolidated) | `.codex/AGENTS.md` | scaffolded agent index |
| (consolidated) | `.codex/config.toml` | scaffolded runtime config; carries Prompt Defense Baseline as a string field |
| `rules`/`skills`/`commands`/`hooks`/`mcp` | folded | merged into the consolidated context model |

## Notes

- The Prompt Defense Baseline is carried inside `config.toml` (TOML string field). Each agent's `instructions` block also retains the baseline section from the canonical source body.
- Codex agents are TOML, not markdown-with-frontmatter — the body is emitted as a multi-line `instructions` string so the file is valid TOML. The canonical `model` alias (Anthropic-specific) is omitted unless it is an explicit `provider/slug`, since Codex runs OpenAI models.
