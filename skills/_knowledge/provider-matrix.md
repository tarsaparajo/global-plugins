# Provider Matrix — Reference

Twelve provider adapters. `kind` selects the install root: **home** = the user's global config directory (a CLI with per-user config); **project** = inside the current repository (an IDE/editor with per-workspace config). Getting `kind` wrong writes files to the wrong root.

| Adapter | Target | kind | Root | Key transform | Build? |
|---------|--------|------|------|---------------|--------|
| claude-home | claude | home | `.claude` | copy; MCP → `.mcp.json` | — |
| claude-project | claude-project | project | `.claude` | same, project-scoped | — |
| cursor-project | cursor | project | `.cursor` | rules `.md`→`.mdc` (drop README); agents flat; MCP merge→`mcp.json`; skip `AGENTS.md` | — |
| codex-home | codex | home | `.codex` | agents→`.toml`; emit `AGENTS.md` + `config.toml` | — |
| gemini-project | gemini | project | `.gemini` | single-file `GEMINI.md` | — |
| qwen-home | qwen | home | `.qwen` | single-file `QWEN.md` | — |
| opencode-home | opencode | home | `.opencode` | copy; compiled plugin → `dist/` | **yes** |
| zed-project | zed | project | `.zed` | rules flat; MCP merge→`settings.json` | — |
| kiro-project | kiro | project | `.kiro` | agents `.md`+`.json`; MCP merge→`settings/mcp.json`; rules flat | — |
| codebuddy-project | codebuddy | project | `.codebuddy` | rules flat; copy; emit install script | — |
| joycode-project | joycode | project | `.joycode` | rules flat; copy; emit install script | — |
| antigravity-project | antigravity | project | `.agent` | rules flat; remap `commands→workflows`, `agents→skills` | — |

## Operation primitives

`copy-path` · `merge-json` (deep, arrays replaced) · `flat-rule` (flatten rules dir, per-provider rename) · `flat-file` (flatten files, per-provider rename) · `scaffold` (generate a managed file) · `build-step` (invoke a provider build).

## Foreign-path guard

`isForeignPlatformPath` blocks one provider's dotfolder shape from projecting into another's. Each dotfolder prefix is owned by exactly one target; `.claude` and `.claude-plugin` both belong to claude.

## Reverse transforms (adapt)

The capability-extractor inverts each transform: `.mdc`→`.md`, de-mangle cursor agent names, `.toml`→canonical frontmatter, single-file split, merged settings→canonical MCP, flattened rules→`rules/`. Compiled OpenCode TypeScript cannot round-trip cleanly and is flagged for review.

## Open registry

To add a provider, append a real entry to `adapters/registry.json`, a contract to `adapters/providers/<id>.md`, a module to `engine/providers/<id>.js`, and a test. Never add placeholder entries for unbuilt providers.
