# Provider Contract — opencode-home

- **Target:** `opencode`
- **Scope (kind):** `home` — CLI global config. The repo folder is `.opencode/`, but opencode reads its global config from `~/.config/opencode/` (XDG), so installation copies `.opencode/.` into `~/.config/opencode/`.
- **Root:** `.opencode` (repo folder / projection source)
- **Build step:** `node engine/build-opencode.js` — REQUIRED before validation.

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `agents`/`skills`/`commands` | `.opencode/**` | copy bodies; frontmatter rewritten for OpenCode (see Notes) |
| `hooks`/`rules`/`mcp` | `.opencode/**` | copy verbatim |
| (compiled) | `.opencode/dist/{index.js,plugins/,tools/}` | produced by the build step |

## Notes

- The build step MUST run before `validate()`; otherwise validation hard-fails with `opencode-plugin-not-built`.
- Adapting an existing OpenCode plugin is lossy for compiled TS; `dist/` is re-derived from the lifted source.
- On projection, the frontmatter of model-facing `.md` files (agents/skills/commands) is rewritten for OpenCode by `engine/frontmatter.js` (applied via the executor): `tools` array → object (`{ name: true }`), `model` alias → `provider/model` (e.g. `sonnet` → `anthropic/claude-sonnet-4-5`; `inherit` → dropped), `color` kept, `argument-hint` dropped. The body is untouched.
