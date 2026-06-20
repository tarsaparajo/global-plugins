# Provider Contract — opencode-home

- **Target:** `opencode`
- **Scope (kind):** `home` — CLI global config (`~/.opencode/`).
- **Root:** `.opencode`
- **Build step:** `node engine/build-opencode.js` — REQUIRED before validation.

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `agents`/`skills`/`commands`/`hooks`/`rules`/`mcp` | `.opencode/**` | copy verbatim |
| (compiled) | `.opencode/dist/{index.js,plugins/,tools/}` | produced by the build step |

## Notes

- The build step MUST run before `validate()`; otherwise validation hard-fails with `opencode-plugin-not-built`.
- Adapting an existing OpenCode plugin is lossy for compiled TS; `dist/` is re-derived from the lifted source.
