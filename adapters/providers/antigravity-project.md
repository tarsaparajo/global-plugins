# Provider Contract — antigravity-project

- **Target:** `antigravity`
- **Scope (kind):** `project` — IDE config inside the project (`<project>/.agent/`).
- **Root:** `.agent`
- **Module support:** `non-empty-paths` (a module is only applied if it still has a path after foreign-path filtering).
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `rules/**` | `.agent/rules/**` | flatten |
| `agents/**` | `.agent/skills/<name>` | flatten; vocabulary remap `agents → skills` |
| `commands/**` | `.agent/workflows/<name>` | flatten; vocabulary remap `commands → workflows` |
| `skills`/`mcp` | `.agent/**` | copy verbatim |

## Notes

- This target remaps canonical vocabulary to its native concepts (`skills`, `workflows`).
