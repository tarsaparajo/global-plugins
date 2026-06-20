# Claude Code Harness — Reference

**Source of truth (check here FIRST, including for updates):** the official repo https://github.com/anthropics/claude-code. Secondary: https://code.claude.com/docs (plugins, skills, sub-agents, hooks-guide, mcp, plugin-marketplaces). Verify field names and hook events against the repo before relying on them — the surface evolves and some fields are version-gated; the repo is where new hooks/fields land first.

Claude Code is the **richest instruction-and-tool harness** of the three CLI providers: directory-based plugins with progressive-disclosure skills, custom subagents, the broadest hook event set, and native MCP. A generated plugin's Claude projection should use these where the briefing calls for them.

## Plugin structure

```
my-plugin/
├── .claude-plugin/plugin.json      # manifest (optional with auto-discovery)
├── agents/<name>.md                # subagents
├── skills/<name>/SKILL.md          # skills (+ supporting files)
├── commands/<name>.md              # legacy flat commands (prefer skills/)
├── hooks/hooks.json                # hook config
└── .mcp.json                       # MCP servers
```

`${CLAUDE_PLUGIN_ROOT}` resolves to the plugin root in scripts/hooks/MCP configs.

**Manifest (`plugin.json`):** required `name` (kebab-case, becomes the `/<name>:skill` namespace) + `description`; optional `version`, `author`, `homepage`, `repository`, `license`, component path overrides (`commands`/`agents`/`skills`/`hooks`/`mcpServers`), `settings`, `defaultEnabled`.

## Components

- **Skills** (`skills/<name>/SKILL.md`) — the distinctive Claude surface. Frontmatter (all optional): `name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`/`disallowed-tools`, `model`, `effort`, `context: fork` (+ `agent`), `hooks`, `paths`, `shell`. **Progressive disclosure:** descriptions are always in context; full body loads only on invocation; supporting files (`reference.md`, `scripts/`) load on demand. Dynamic injection via `` !`command` ``. Substitutions: `$ARGUMENTS`, `$N`, `$name`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_SESSION_ID}`.
- **Subagents** (`agents/<name>.md`) — frontmatter: `name`, `description`, `model`, `tools` (whitelist), `skills` (preloaded), `rules`, `hooks`, `color`, `permissions`, `isolation: worktree`. Body = system prompt. Built-ins: `Explore`, `Plan`, `general-purpose`.
- **Commands** — legacy flat `.md` in `commands/`; same shape as skills. Prefer skills.
- **MCP servers** (`.mcp.json`) — stdio/SSE/HTTP/WebSocket; tools namespaced `mcp__<server>__<tool>`; use `${CLAUDE_PLUGIN_ROOT}` for bundled servers.

## Hooks — the broadest event set

Configured in `hooks/hooks.json` (or settings). Events include lifecycle (`SessionStart`, `SessionEnd`, `Setup`), tool (`PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `PostToolBatch`), user (`UserPromptSubmit`, `UserPromptExpansion`, `Notification`), context (`PreCompact`, `PostCompact`), subagent (`SubagentStart`, `SubagentStop`), and more (`ConfigChange`, `FileChanged`, `Stop`, `StopFailure`). **Hook types:** `command` (stdin JSON, exit 2 blocks), `prompt` and `agent` (model-judged, return `{ok, reason}`), `http`, `mcp_tool`. Matchers filter by tool name (with an `if` permission-rule predicate) or by event-specific values.

## Distribution

`.claude-plugin/marketplace.json` lists plugins from sources: relative path, `github`, git `url`, `git-subdir`, or `npm`. Install: `/plugin marketplace add <owner/repo|url|path>` then `/plugin install <plugin>@<marketplace>`. `strict` mode controls whether the marketplace entry supplements or replaces `plugin.json`.

## Rules distribution gap — validated (official)

Claude Code's plugin system distributes commands, agents, skills, hooks, MCP servers, output styles, and LSP servers — **but NOT rules** (`.claude/rules/` always-apply instruction files). This is an official, acknowledged limitation (anthropics/claude-code Issue #21163, "Support rules field in plugin.json for distributing rules via plugins" — pending). The workaround: users must **manually copy rule files** into `~/.claude/rules/` (user) or `.claude/rules/` (project). So when a generated child plugin ships instruction rules for Claude Code, it must also ship an installer/instructions to copy them — `/plugin install` will not. (Codex and OpenCode do not have this exact gap — see their harness refs: both carry instructions via `AGENTS.md`, which IS distributed normally.)

## How global-plugins uses this

The Claude projection copies agents/skills/commands verbatim and deep-merges MCP into `.claude/.mcp.json`. When enriching a child's Claude version (opt-in), reach for progressive-disclosure skills, custom subagents, and the rich hook events — capabilities Codex and OpenCode express differently or not at all. Keep provider-specific richness behind an opt-in; the baseline projection stays clean.
