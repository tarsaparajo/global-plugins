# Provider Contract — claude-home

- **Target:** `claude`
- **Scope (kind):** `home` — installs into the user's global config directory (`~/.claude/`).
- **Root:** `.claude`
- **Native root marker:** `.claude-plugin`
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `agents/**` | `.claude/agents/**` | copy verbatim |
| `skills/**` | `.claude/skills/**` | copy verbatim |
| `commands/**` | `.claude/commands/**` | copy verbatim |
| `hooks/**` | `.claude/hooks/**` | copy verbatim; `${CLAUDE_PLUGIN_ROOT}` preserved |
| `rules/**` | `.claude/rules/**` | copy verbatim |
| `mcp/*.json` | `.claude/.mcp.json` | deep merge-json |

## Notes

- The Prompt Defense Baseline is injected into every model-facing `.md`.
- Foreign provider dotfolders are never projected here.
