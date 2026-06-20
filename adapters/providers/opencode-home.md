# Provider Contract — opencode-home

- **Target:** `opencode`
- **Scope (kind):** `home` — CLI global config. The repo folder is `.opencode/`, but opencode reads its global config from `~/.config/opencode/` (XDG), so installation copies `.opencode/.` into `~/.config/opencode/`.
- **Root:** `.opencode` (repo folder / projection source)
- **Build step:** `node engine/build-opencode.js` — REQUIRED before validation.

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `agents/*.md` | `.opencode/agents/*.md` | frontmatter rewrite: `tools` array → object map, `model` alias → `provider/model`, add `mode: subagent`, drop `color` |
| `skills`/`commands`/`hooks`/`rules`/`mcp` | `.opencode/**` | copy verbatim |
| (compiled) | `.opencode/dist/{index.js,plugins/,tools/}` | produced by the build step |

## Notes

- OpenCode's agent schema requires `tools` to be an object (`{ read: true, ... }`), a `provider/model` model id, and a `mode`. It rejects the Claude-native array `tools`, the keyword `color`, and a bare `model` alias — so agents are rewritten, not copied. The agent name is derived from the file name.
- The build step MUST run before `validate()`; otherwise validation hard-fails with `opencode-plugin-not-built`.
- Adapting an existing OpenCode plugin is lossy for compiled TS; `dist/` is re-derived from the lifted source.
