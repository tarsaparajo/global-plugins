# Provider Contract — qwen-home

- **Target:** `qwen`
- **Scope (kind):** `home` — CLI global config (`~/.qwen/`).
- **Root:** `.qwen`
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `rules`/`agents`/`skills`/`commands` | `.qwen/QWEN.md` | consolidated into one single context file |

## Notes

- Single-file provider, same shape as `gemini-project` but home-scoped into `QWEN.md`.
