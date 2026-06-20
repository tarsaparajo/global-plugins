# Provider Contract — cursor-project

- **Target:** `cursor`
- **Scope (kind):** `project` — IDE config lives inside the project (`<project>/.cursor/`).
- **Root:** `.cursor`
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `rules/**` | `.cursor/rules/<name>.mdc` | flatten; `.md` → `.mdc`; drop `README.md` |
| `agents/**` | `.cursor/agents/<name>.md` | flatten (agent files kept as `.md`) |
| `mcp/*.json` | `.cursor/mcp.json` | deep merge-json |
| `AGENTS.md` | — | skipped (Cursor treats nested `AGENTS.md` as directory context) |

## Notes

- Destination deduplication prevents collisions across modules.
- Prompt Defense Baseline injected into every model-facing `.md`/`.mdc`.
