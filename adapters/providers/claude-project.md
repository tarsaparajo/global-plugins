# Provider Contract — claude-project

- **Target:** `claude-project`
- **Scope (kind):** `project` — installs into the current project (`<project>/.claude/`).
- **Root:** `.claude`
- **Native root marker:** `.claude-plugin`
- **Build step:** none

## Transforms

Identical transform shape to `claude-home`, but rooted at the consuming project's `.claude/` instead of the user home directory.

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `agents/**` | `.claude/agents/**` | copy verbatim |
| `skills/**` | `.claude/skills/**` | copy verbatim |
| `commands/**` | `.claude/commands/**` | copy verbatim |
| `hooks/**` | `.claude/hooks/**` | copy verbatim |
| `rules/**` | `.claude/rules/**` | copy verbatim |
| `mcp/*.json` | `.claude/.mcp.json` | deep merge-json |

## Notes

- Same scope concept as `claude-home`, project-local instead of global.
