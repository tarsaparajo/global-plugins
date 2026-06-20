# Provider Contract — gemini-project

- **Target:** `gemini`
- **Scope (kind):** `project` — config inside the project (`<project>/.gemini/`).
- **Root:** `.gemini`
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `rules`/`agents`/`skills`/`commands` | `.gemini/GEMINI.md` | consolidated into one single context file (one section per source dir) |

## Notes

- Single-file provider: all instruction context lives in `GEMINI.md`.
- One copy of the Prompt Defense Baseline is kept in the consolidated file.
