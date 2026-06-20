# Provider Contract — codex-home

- **Target:** `codex`
- **Scope (kind):** `home` — CLI global config (`~/.codex/`).
- **Root:** `.codex`
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `agents/**` | `.codex/config.toml` `[agents.<name>]` + `.codex/AGENTS.md` | re-expressed as native agent tables (carry `description` only) and named in the capability index; no per-agent `.toml` file emitted |
| `skills`/`commands` | `.codex/**` | bodies kept as sibling files; SKILL.md frontmatter reduced to `name`+`description` |
| (consolidated) | `.codex/AGENTS.md` | scaffolded agent index |
| (consolidated) | `.codex/config.toml` | scaffolded runtime config; carries Prompt Defense Baseline as a string field |
| `rules`/`hooks`/`mcp` | folded | merged into the consolidated context model |

## Notes

- The Prompt Defense Baseline is carried inside `config.toml` (TOML string field), not as a markdown section.
- Agents are not files: each canonical agent becomes an `[agents.<name>]` table in `config.toml` (carrying only `description`, Codex's real agent-table field) and is named in the `AGENTS.md` capability index.
- SKILL.md frontmatter is reduced to Codex's `name` + `description`. Claude-only fields (`color`/`tools`/`model`/`argument-hint`) have no Codex frontmatter slot and are dropped; where a native equivalent exists they are re-expressed (a skill's `agents/openai.yaml` — `color` → `interface.brand_color` hex, `tools` → `dependencies.tools`).
- Frontmatter adaptation is deterministic (`engine/frontmatter.js`, keep/rewrite/drop) for the in-markdown fields; the non-frontmatter re-expression into `openai.yaml` is handled agentically by the projector.
