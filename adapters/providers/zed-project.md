# Provider Contract — zed-project

- **Target:** `zed`
- **Scope (kind):** `project` — editor config inside the project (`<project>/.zed/`).
- **Root:** `.zed`
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `rules/**` | `.zed/rules/**` | flatten |
| `agents`/`skills`/`commands` | `.zed/**` | copy verbatim |
| `mcp/*.json` | `.zed/settings.json` | deep merge-json |
