# Provider Contract — vscode-project

- **Target:** `vscode`
- **Scope (kind):** `project` — config inside the project (`<project>/.github/` and `<project>/.vscode/`).
- **Root:** `.github`
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `rules`/`agents`/`skills`/`commands` | `.github/copilot-instructions.md` | consolidated into one instruction file Copilot reads |
| (generated) | `.vscode/settings.json` | wires Copilot code/test generation to the instructions file |

## Notes

- VS Code has no native agent format; it integrates through GitHub Copilot.
- All instruction context is consolidated into a single `copilot-instructions.md`, with the Prompt Defense Baseline kept once.
