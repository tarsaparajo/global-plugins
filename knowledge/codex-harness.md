# Codex Harness — Reference

**Source of truth (check here FIRST, including for updates):** the official repo https://github.com/openai/codex (`docs/`: `config.md`, `agents_md.md`, `execpolicy.md`, `skills.md`, `slash_commands.md`, `sandbox.md`, `exec.md`). Secondary: https://developers.openai.com/codex (cli/features, subagents, guides/agents-md, exec-policy). Verify against the repo before relying on exact keys — Codex's plugin/hook surface is less fully documented than Claude Code's or OpenCode's. Where the official docs are silent, the **fallback is the established pattern in ECC's `.codex/` projection plus Anthropic's plugin conventions** — flagged inline below as `[fallback]`, not presented as official Codex API.

Codex is **instruction-and-TOML driven** — conceptually close to Claude Code (a base instruction file + agents + MCP), but expressed in TOML rather than markdown/JSON, and with a thinner documented hook surface. It is one of the three CLI providers global-plugins targets.

## Plugin structure (as global-plugins projects it)

```
.codex/
├── AGENTS.md           # base instructions + capability index
├── config.toml         # runtime config; MCP; [agents.<name>] TABLES (role defs); Prompt Defense baseline ([prompt_defense] table)
├── skills/<name>/SKILL.md   # skill bodies (sibling dirs, indexed from AGENTS.md); frontmatter = name + description ONLY
│   └── agents/openai.yaml   # OPTIONAL per-skill UI/tool metadata (brand_color hex, dependencies.tools, policy)
└── commands/<name>.md       # command bodies (sibling files)
```

`config.toml` and `AGENTS.md` live at the home root `~/.codex/`. `AGENTS.md` is Codex's base instruction file (its CLAUDE.md analogue); fallback filenames `TEAM_GUIDE.md` / `.agents.md` are configurable via `project_doc_fallback_filenames`. Note there are **no standalone `agents/<name>.toml` files** in real Codex — agents are tables inside `config.toml` (see below). The canonical field reference for what survives projection is **`knowledge/provider-matrix.md` → "Frontmatter field adaptation"**.

## Custom agents (subagents) — official

- **Definition:** custom agents are **`[agents.<name>]` TABLES inside `config.toml`** — NOT standalone `agents/<name>.toml` files (that earlier model was wrong). The table key is the agent name.
- **Fields on the table:** `config_file` (points at the agent's instruction/config file), `description`, `nickname_candidates`. There is **no per-agent `color`/`tools`/`model` frontmatter slot** on a Codex agent.
- **Global `[agents]` config in `config.toml`:** `max_threads` (default 6), `max_depth` (default 1), `job_max_runtime_seconds`.
- **Built-in agents:** `default`, `worker`, `explorer`.
- **Invocation:** `/agent` in the CLI switches/inspects agent threads; Codex orchestrates spawning and result collection.

### SKILL.md frontmatter is `name` + `description` ONLY

A native Codex skill's `SKILL.md` frontmatter carries **only** `name` and `description`. There is no `color`, no `tools` array, and no `model` in that markdown frontmatter. Anything richer lives in the skill's optional `agents/openai.yaml` (below), not in the markdown.

### `agents/openai.yaml` — where UI + tool metadata lives

A Codex skill directory may carry an **optional `agents/openai.yaml`** (snake_case schema) for everything the SKILL.md frontmatter cannot hold:

- `interface.{display_name, short_description, icon_small, icon_large, brand_color, default_prompt}` — `brand_color` is a `#RRGGBB` **hex** value (this is where a UI color lives).
- `dependencies.tools` — an **ARRAY of objects** `{type, value, description, transport, url}` declaring the skill's tool requirements.
- `policy.allow_implicit_invocation` — boolean.

### Claude fields with no Codex frontmatter slot

Claude's `color` (named enum), `tools` (array of names), and `model` (alias) have **no Codex frontmatter equivalent** and must be **dropped from frontmatter**. Where a real native equivalent exists, they are **re-expressed** in the skill's `agents/openai.yaml`: `color` → `interface.brand_color` (hex); `tools` array → `dependencies.tools` objects. `model` is a runtime/config concern (it lives in `config.toml`, not frontmatter) and has no `openai.yaml` slot.

### No `plugin.json`, no `hooks.json`

A native Codex skill has **no `plugin.json`** (that is a Claude Code artifact) and **no `hooks.json`**. Its only optional dirs are `scripts/`, `references/`, and `assets/`.

## MCP — official

Configure servers in `~/.codex/config.toml` (STDIO or streaming HTTP), or manage with `codex mcp` CLI commands. Codex launches MCP servers automatically on session start. ECC's canonical section name is `[mcp_servers.<name>]`.

## Prompts / slash commands — official

Custom prompts live in `~/.codex/prompts/`; each becomes an invocable slash command. `[fallback]` global-plugins transpiles each canonical `commands/<name>.md` into a Codex prompt and indexes it from `AGENTS.md`.

## Feature flags — official

`codex features list|enable|disable <feature>` persists to `$CODEX_HOME/config.toml` (e.g. `unified_exec`, `shell_snapshot`, `multi_agent`).

## Execution policy (Exec Policy) — official, validated

Codex governs which commands run outside the sandbox via **rules written in Starlark** (a safe, side-effect-free Python-like language). Rule files use the `.rules` format with `prefix_rule(pattern=, decision=, justification=, match=, not_match=)`; `decision` is `allow` (run without prompting), `prompt` (ask first), or `forbidden` (block). Locations: user `~/.codex/rules/default.rules`; project `<repo>/.codex/rules/` (trusted layer); team layers. Codex applies the **most restrictive** matching rule. This is Codex's permission-as-code surface (analogous in spirit to OpenCode's `permission.ask`, but declarative/Starlark rather than in-process JS). Sources: `docs/execpolicy.md`, https://developers.openai.com/codex/exec-policy.

## Skills, slash commands & hooks

- **Skills:** documented in `docs/skills.md`. A skill dir is `skills/<id>/SKILL.md` (frontmatter `name` + `description` only) plus optional `scripts/`/`references/`/`assets/` and an optional `agents/openai.yaml` (UI/tool metadata; see "Custom agents" above). There is **no `plugin.json` and no `hooks.json`** in a native Codex skill. `[fallback]` global-plugins ships skill bodies this way and lists them in the AGENTS.md capability index.
- **Slash commands:** `docs/slash_commands.md`; custom prompts live in `~/.codex/prompts/`.
- **Hooks:** Codex has a **managed hooks** layer — `allow_managed_hooks_only` in `requirements.toml` ignores user/project/session hook configs while still allowing managed hooks (it does NOT take effect in `config.toml`). The full per-event hook API is not published the way Claude Code's is. `[fallback]` express automation as `developer_instructions` in AGENTS.md / agent TOML plus out-of-band shell — do NOT assume Claude-Code-style hook events on Codex. Confirm against `docs/config.md` before generating hook-dependent Codex behavior.

## Coupling model & interoperability — validated

- **Coupling:** like Claude Code, Codex is **out-of-process** — extension is declarative (TOML/markdown) with shell/subprocess automation, not in-process code. This is the key contrast with OpenCode's in-process TS/JS plugins (see `opencode-harness.md`). Codex and Claude Code are the closer pair.
- **Interop (validated, June 2026):** the documented interoperability runs **Claude Code → Codex**: an official plugin (`codex@openai-codex`) lets Claude Code delegate tasks to the local Codex CLI/app server, reusing your existing Codex auth/config/MCP. `[unverified]` The reverse claim — that Codex natively reuses Claude Code's plugin format via `CLAUDE_PLUGIN_ROOT` — was NOT confirmed; `CLAUDE_PLUGIN_ROOT` is a Claude Code variable. Do not assert Codex↔Claude plugin-format compatibility without checking the official docs.
- **Permission-as-code:** Codex DOES have one — the Starlark Exec Policy (see above), validated against `docs/execpolicy.md`. Declarative, not in-process.

## Rules / instructions distribution — validated

Codex instructions live in `AGENTS.md` (its CLAUDE.md analogue), committed to the repo and discovered automatically — so there is **no Claude-Code-style "rules not distributable" gap** for instruction content. Note the two distinct "rules" senses: `AGENTS.md` = instruction rules (distributed normally); the Starlark `.rules` files = the Exec Policy permission system (above). The cross-provider convergence on `AGENTS.md` (Codex native; OpenCode reads it; Claude Code uses `CLAUDE.md`) is the anchor for the opt-in universal-substrate capability.

## How global-plugins uses this

The Codex projection: agents are re-expressed as **`[agents.<name>]` tables in `config.toml`** (each with `config_file`/`description`/`nickname_candidates`) plus an entry in the `AGENTS.md` capability index — **NOT** as `agents/*.toml` files. Skill `SKILL.md` frontmatter is reduced to **`name` + `description`** only; Claude's `color`/`tools`-array/`model`-alias are dropped from frontmatter and, where a native target exists, re-expressed in the skill's `agents/openai.yaml` (`interface.brand_color` hex, `dependencies.tools` objects). Commands → sibling files indexed in `AGENTS.md`; the Prompt Defense Baseline carried under a dedicated `[prompt_defense]` table in `config.toml` (`baseline = "…"`) — append-safe, unlike a bare root key which would bind to a trailing table such as `[desktop]` when merged into an existing config. **Owner identity:** since Codex has no native namespacing, every `description` is prefixed `[<plugin>] …` (SKILL.md/command frontmatter, `[agents.<name>]` tables, and the `AGENTS.md` index), and the `AGENTS.md` index is grouped under a `### <plugin>` heading — `<plugin>` is the slug from `.claude-plugin/plugin.json`/`package.json`. The canonical field-by-field reference is **`knowledge/provider-matrix.md` → "Frontmatter field adaptation"**. When enriching a child's Codex version, prefer the documented surfaces (`[agents.*]` tables, MCP, prompts, skills) and treat undocumented areas (full hook API, plugin marketplace mechanics) as fallback/uncertain — verify against https://developers.openai.com/codex.

**Runtime payload — generating from Codex.** A Codex install carries the projection engine inside the plugin's PRIVATE bundle `~/.codex/_<slug>/engine/` (engine + scripts/evolve + manifests + adapters + templates + .evolution/baseline, copied verbatim, outside the capability surface). Namespacing under `_<slug>/` lets many plugins install side-by-side without overwriting each other's payload; Codex ignores the unknown `_<slug>/` top-level dir (it reads only `config.toml`/`AGENTS.md`/`skills/`/`commands/`), so it needs no discovery file. Because Codex runs Node in-workspace (`sandbox_mode = "workspace-write"`, `approval_policy = "on-request"`), the `generate`/`adapt`/`evolve` skills run the bundled engine deterministically: `cd ~/.codex/_<slug>/engine && node scripts/evolve/project.mjs --apply <child-root>` (one approval prompt per run). This is what makes a Codex install able to CREATE multi-provider child plugins itself — not only consume them. The payload is drift-guarded (byte-identical to canonical) and never scanned as a capability; it is the additive counterpart to the anti-bloat guard that keeps infrastructure OUT of the capability dirs. Full namespacing protocol: `knowledge/namespacing.md`.
