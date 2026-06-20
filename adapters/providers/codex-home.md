# Provider Contract — codex-home

- **Target:** `codex`
- **Scope (kind):** `home` — CLI global config (`~/.codex/`).
- **Root:** `.codex`
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `agents/**` | `.codex/agents/<name>.toml` | flatten; `.md` → `.toml` |
| (consolidated) | `.codex/AGENTS.md` | scaffolded agent index |
| (consolidated) | `.codex/config.toml` | scaffolded runtime config; carries Prompt Defense Baseline as a string field |
| `rules`/`skills`/`commands`/`hooks`/`mcp` | folded | merged into the consolidated context model |

## Notes

- The Prompt Defense Baseline is carried inside `config.toml` (TOML string field), not as a markdown section.
