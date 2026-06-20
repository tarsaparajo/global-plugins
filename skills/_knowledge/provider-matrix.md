# Provider Matrix — Reference

Three CLI provider adapters, chosen for their superior harness capability and high-functionality compatibility. All are **home**-scoped — they install into the user's global CLI config directory (`~/`). Getting the root wrong writes files to the wrong place.

| Adapter | Target | kind | Root | Key transform | Build? |
|---------|--------|------|------|---------------|--------|
| claude-home | claude | home | `.claude` | copy; MCP → `.mcp.json` | — |
| codex-home | codex | home | `.codex` | agents→`.toml`; skills/commands as sibling files; emit `AGENTS.md` index + `config.toml` | — |
| opencode-home | opencode | home | `.opencode` | copy; compiled plugin → `dist/` | **yes** |

## Operation primitives

`copy-path` · `merge-json` (deep, arrays replaced) · `flat-file` (flatten files, per-provider rename) · `scaffold` (generate a managed file) · `build-step` (invoke a provider build).

## Foreign-path guard

`isForeignPlatformPath` blocks one provider's dotfolder shape from projecting into another's. Each dotfolder prefix is owned by exactly one target; `.claude` and `.claude-plugin` both belong to claude.

## Reverse transforms (adapt)

The capability-extractor inverts each transform: `.toml`→canonical frontmatter, codex single-file index split back into discrete components, merged settings→canonical MCP. Compiled OpenCode TypeScript cannot round-trip cleanly and is flagged for review.

## Open registry

The registry is deliberately scoped to the three CLI providers. To extend it, append a real entry to `adapters/registry.json`, a contract to `adapters/providers/<id>.md`, a module to `engine/providers/<id>.js`, and a test. Never add placeholder entries for unbuilt providers.
