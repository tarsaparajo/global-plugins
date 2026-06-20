# Provider Matrix — Reference

Three CLI provider adapters, chosen for their superior harness capability and high-functionality compatibility. All are **home**-scoped — they install into the user's global CLI config directory (`~/`). Getting the root wrong writes files to the wrong place.

| Adapter | Target | kind | Root | Key transform | Build? |
|---------|--------|------|------|---------------|--------|
| claude-home | claude | home | `.claude` | copy; MCP → `.mcp.json` | — |
| codex-home | codex | home | `.codex` | agents→`.toml`; skills/commands as sibling files; emit `AGENTS.md` index + `config.toml` | — |
| opencode-home | opencode | home | `.opencode` | copy; compiled plugin → `dist/` | **yes** |

## Operation primitives

`copy-path` · `merge-json` (deep, arrays replaced) · `flat-file` (flatten files, per-provider rename) · `scaffold` (generate a managed file) · `build-step` (invoke a provider build).

## Frontmatter field adaptation — "adaptar não é copiar"

A canonical agent/skill/command carries **Claude-shaped** YAML frontmatter (canonical == Claude shape). Each provider's real frontmatter schema differs, so projecting a model-facing `.md` into a non-Claude provider **adapts the frontmatter — it does not copy it**. Four verbs:

- **keep** — the field exists with the same shape on the target.
- **rewrite** — the field exists but its SHAPE differs; transform the value. *Deterministic — lives in the engine (`engine/frontmatter.js`).*
- **drop** — the field has no frontmatter slot on the target; remove it so the file validates. *Deterministic — engine.*
- **re-express** — the data belongs in a different NATIVE structure (not `.md` frontmatter). *Agentic — not mechanical; the `canonical-projector` does this, guided by this matrix. The engine only keep/rewrite/drops within frontmatter; it never invents the native structure.*

### Per-field matrix (cross-referenced against official docs, June 2026)

| Canonical field | Claude (`agents/*.md`, `skills/*/SKILL.md`) | OpenCode (`agents/*.md`) | Codex |
|---|---|---|---|
| `name` | keep | keep | keep (SKILL.md / `[agents.<name>]` key) |
| `description` | keep | keep | keep |
| `tools` (array of names) | **keep** (array or csv of tool names) | **rewrite** → OBJECT `{ read: true, … }` (name→bool; tool names lowercased) | **drop** → *re-express* as `dependencies.tools` (array of `{type,value,description}`) in a skill's `agents/openai.yaml` |
| `model` (alias e.g. `sonnet`) | **keep** (alias / full id / `inherit`) | **rewrite** → `provider/model` (e.g. `anthropic/claude-sonnet-4-5`); `inherit` → drop | **drop** (runtime/config concern; lives in `config.toml`, not frontmatter) |
| `color` (named: `cyan`…) | **keep** (named enum ONLY — red/blue/green/yellow/purple/orange/pink/cyan; **no hex**) | **rewrite/keep** → hex `#RRGGBB` or theme token (named tokens kept as-is) | **drop** per-agent → *re-express* as `interface.brand_color` (`#RRGGBB` hex) in a skill's `agents/openai.yaml` |
| `argument-hint` | keep (skill/command) | **drop** (commands use `template`/`agent`/`subtask`) | **drop** (Codex SKILL.md frontmatter is `name` + `description` ONLY) |
| `when_to_use` | keep (`when_to_use`, snake_case) | folded into `description` | drop (fold into `description`) |
| unknown / other | keep (Claude ignores unknown top-level keys) | keep (passed through to provider) | **drop** unless `name`/`description` |

### Casing landmines (exact, schema-breaking if wrong)

- **Claude subagents** use camelCase for multi-word keys (`disallowedTools`, `permissionMode`, `mcpServers`); **Claude skills** use kebab-case (`allowed-tools`, `argument-hint`, `disable-model-invocation`) and `when_to_use` is snake_case.
- **OpenCode** `tools` is an OBJECT (`{name: bool}`), NOT an array; `model` is `provider/model`; `mode` ∈ {`primary`,`subagent`,`all`}; dirs are PLURAL (`agents/`,`skills/`,`commands/`).
- **Codex** SKILL.md frontmatter is `name` + `description` ONLY. Agent metadata lives in `[agents.<name>]` config.toml tables (`config_file`,`description`,`nickname_candidates`) — no per-agent `color`/`tools`/`model`. UI/tool metadata lives in a skill's `agents/openai.yaml` (snake_case: `interface.{display_name,short_description,icon_small,icon_large,brand_color,default_prompt}`, `dependencies.tools[]`, `policy.allow_implicit_invocation`). There is **no `plugin.json` and no `hooks.json`** in native Codex skills (optional dirs are `scripts/`/`references/`/`assets/`).

### Determinism boundary

The engine applies **keep/rewrite/drop** mechanically for the fields above (`engine/frontmatter.js`, invoked by the executor via the `frontmatterTarget` op tag). Anything requiring judgement — choosing a `brand_color` hex from a named color, modeling `tools` as `dependencies.tools` objects with `type`/`value`, mapping a non-Anthropic model alias, or any field not in the table — is **agentic re-expression**: the projector decides per case, citing this matrix, and flags lossy choices for human review. Never silently copy a Claude field into a provider that has no slot for it.

## Foreign-path guard

`isForeignPlatformPath` blocks one provider's dotfolder shape from projecting into another's. Each dotfolder prefix is owned by exactly one target; `.claude` and `.claude-plugin` both belong to claude.

## Reverse transforms (adapt)

The capability-extractor inverts each transform back to canonical (Claude-shaped) frontmatter:

- **Codex** → canonical: read agent roles from `config.toml` `[agents.<name>]` tables + the `AGENTS.md` index (NOT from per-agent `.toml` files — those do not exist in real Codex); recover any `color`/`tools` from a skill's `agents/openai.yaml` (`interface.brand_color` → named color best-effort; `dependencies.tools[]` → tool-name array); split the consolidated `AGENTS.md` index back into discrete `agents/`/`skills/`/`commands/` sections; skill bodies come from `skills/<name>/SKILL.md`.
- **OpenCode** → canonical: `tools` object → array of names; `model` `provider/model` → alias where it maps; compiled `dist/` TypeScript cannot round-trip cleanly and is flagged for re-authoring.
- **All** → canonical: merged settings/`.mcp.json` → canonical `mcp/*.json`; flattened rules → `rules/`.

When lifting, re-canonicalize fields per the **Frontmatter field adaptation** matrix above, in reverse. Anything ambiguous (a hex `brand_color` with no exact named equivalent, a non-Anthropic model) is flagged, never guessed silently.

## Open registry

The registry is deliberately scoped to the three CLI providers. To extend it, append a real entry to `adapters/registry.json`, a contract to `adapters/providers/<id>.md`, a module to `engine/providers/<id>.js`, and a test. Never add placeholder entries for unbuilt providers.
