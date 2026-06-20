# Provider Contract — codebuddy-project

- **Target:** `codebuddy`
- **Scope (kind):** `project` — config inside the project (`<project>/.codebuddy/`).
- **Root:** `.codebuddy`
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `rules/**` | `.codebuddy/rules/**` | flatten |
| `agents`/`skills`/`commands`/`mcp` | `.codebuddy/**` | copy verbatim |
| (generated) | `.codebuddy/install.sh` | scaffolded install helper |
