# Provider Contract — joycode-project

- **Target:** `joycode`
- **Scope (kind):** `project` — config inside the project (`<project>/.joycode/`).
- **Root:** `.joycode`
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `rules/**` | `.joycode/rules/**` | flatten |
| `agents`/`skills`/`commands`/`mcp` | `.joycode/**` | copy verbatim |
| (generated) | `.joycode/install.sh` | scaffolded install helper |
