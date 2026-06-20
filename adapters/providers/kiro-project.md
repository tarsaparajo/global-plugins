# Provider Contract — kiro-project

- **Target:** `kiro`
- **Scope (kind):** `project` — IDE config inside the project (`<project>/.kiro/`).
- **Root:** `.kiro`
- **Stability:** beta
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `agents/**` | `.kiro/agents/<name>.md` AND `.kiro/agents/<name>.json` | flatten; emit markdown plus a JSON sidecar |
| `rules/**` | `.kiro/rules/**` | flatten |
| `skills`/`commands` | `.kiro/**` | copy verbatim |
| `mcp/*.json` | `.kiro/settings/mcp.json` | deep merge-json |

## Notes

- Beta until broader verification; covered by `tests/providers/test_kiro_provider`.
