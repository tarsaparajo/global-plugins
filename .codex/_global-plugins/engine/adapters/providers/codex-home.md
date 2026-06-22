# Provider Contract — codex-home

- **Target:** `codex`
- **Scope (kind):** `home` — CLI global config (`~/.codex/`); installation merges the projected `.codex/.` contents into `~/.codex/` (`mkdir -p ~/.codex && cp -R .codex/. ~/.codex/` — the trailing `/.` avoids nesting a `.codex` inside an existing `~/.codex/`).
- **Root:** `.codex`
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `agents/**` | `.codex/config.toml` `[agents.<name>]` + `.codex/AGENTS.md` | re-expressed as native agent tables (carry `description` only) and named in the capability index; no per-agent `.toml` file emitted |
| `skills`/`commands` | `.codex/**` | bodies kept as sibling files; SKILL.md frontmatter reduced to `name`+`description` |
| (consolidated) | `.codex/AGENTS.md` | scaffolded agent index |
| (consolidated) | `.codex/config.toml` | scaffolded runtime config; carries Prompt Defense Baseline as a `[prompt_defense]` table (`baseline = "…"`) |
| `rules`/`hooks`/`mcp` | folded | merged into the consolidated context model |
| `engine`/`scripts`/`manifests`/`adapters`/`templates`/`.evolution/baseline` (runtime payload) | `.codex/engine/**` | copied **verbatim** (no frontmatter adapt, no prompt-defense injection) so the install can run the projection engine itself — see Notes |

## Notes

- The Prompt Defense Baseline is carried inside `config.toml` under a dedicated `[prompt_defense]` table (`baseline = "…"`, a single escaped basic string), not as a markdown section. A dedicated table — rather than a bare root key — is **append-safe**: when this config is merged after an existing `~/.codex/config.toml` that ends in tables (e.g. `[desktop]`), a trailing root key would be parsed as a member of that last table; a table header re-scopes everything after it, so the baseline always resolves at `prompt_defense.baseline` regardless of merge position.
- Agents are not files: each canonical agent becomes an `[agents.<name>]` table in `config.toml` (carrying only `description`, Codex's real agent-table field) and is named in the `AGENTS.md` capability index.
- SKILL.md frontmatter is reduced to Codex's `name` + `description`. Claude-only fields (`color`/`tools`/`model`/`argument-hint`) have no Codex frontmatter slot and are dropped; where a native equivalent exists they are re-expressed (a skill's `agents/openai.yaml` — `color` → `interface.brand_color` hex, `tools` → `dependencies.tools`).
- Frontmatter adaptation is deterministic (`engine/frontmatter.js`, keep/rewrite/drop) for the in-markdown fields; the non-frontmatter re-expression into `openai.yaml` is handled agentically by the projector.
- **Owner identity (Codex has no native namespacing).** Every `description` is prefixed `[<plugin>] …` — in SKILL.md/command frontmatter, in the `[agents.<name>]` table descriptions in `config.toml`, and in the `AGENTS.md` capability index. The `AGENTS.md` index is additionally **grouped** under a `### <plugin>` heading (per-type sections demote to `####`) so capabilities are attributable to their owner when several plugins are installed. The slug `<plugin>` comes from `.claude-plugin/plugin.json` (fallback `package.json`) `name`; the prefix is idempotent and is stripped on adapt (reverse).
- **Runtime payload (`.codex/engine/`).** The install carries the deterministic projection engine (`engine/` + `scripts/evolve/` + `manifests/` + `adapters/` + `templates/` + `.evolution/baseline/`) under a reserved `engine/` subdir so a Codex install can itself **generate/adapt/evolve** child plugins — not only Claude. Codex runs Node in-workspace (`sandbox_mode = "workspace-write"`, `approval_policy = "on-request"`), so the agent runs `cd ~/.codex/engine && node scripts/evolve/project.mjs --apply <child-root>` (one approval prompt per run). The payload is copied **verbatim** (byte-identical to canonical, drift-guarded) and lives entirely OUTSIDE the capability surface — it is never scanned as an agent/skill/command. This is the additive counterpart to the 0.7.0 anti-bloat guard, which keeps infrastructure OUT of the capability dirs; the payload is a separate, explicitly-typed channel.
