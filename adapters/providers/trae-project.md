# Provider Contract — trae-project

- **Target:** `trae`
- **Scope (kind):** `project` — IDE config inside the project (`<project>/.trae/`).
- **Root:** `.trae`
- **Build step:** none

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `rules/**` | `.trae/rules/**` | flatten |
| `agents`/`skills`/`commands`/`mcp` | `.trae/**` | copy verbatim |
| (generated) | `.trae/install.sh` | scaffolded install helper |

## Notes

- Trae is installed into the project via a script helper, mirroring the other script-installed editors.
