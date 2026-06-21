# Provider Contract — opencode-home

- **Target:** `opencode`
- **Scope (kind):** `home` — CLI global config. The repo folder is `.opencode/`, but opencode reads its global config from `~/.config/opencode/` (XDG), so installation copies `.opencode/.` into `~/.config/opencode/`.
- **Root:** `.opencode` (repo folder / projection source)
- **Build step:** `node engine/build-opencode.js` — REQUIRED before validation.

## Transforms

| Canonical | Destination | Rule |
|-----------|-------------|------|
| `agents`/`skills`/`commands` | `.opencode/**` | copy bodies; frontmatter rewritten for OpenCode (see Notes); the capability NAME is owner-prefixed `<plugin>-<name>` (file/skill-dir + `name:`) |
| `hooks`/`rules`/`mcp` | `.opencode/**` | copy verbatim (not invocable capabilities — no owner prefix) |
| (compiled) | `.opencode/dist/{index.js,plugins/,tools/}` | produced by the build step |

## Notes

- The build step MUST run before `validate()`; otherwise validation hard-fails with `opencode-plugin-not-built`.
- Adapting an existing OpenCode plugin is lossy for compiled TS; `dist/` is re-derived from the lifted source.
- On projection, the frontmatter of model-facing `.md` files (agents/skills/commands) is rewritten for OpenCode by `engine/frontmatter.js` (applied via the executor): `tools` array → object (`{ name: true }`), `color` named Claude color → **YAML-quoted** hex `"#RRGGBB"` (an already-hex value or a valid theme token is kept; an unrecognized name is dropped), `model` dropped (never preset — the user chooses the model in the CLI), `argument-hint` dropped. The body is untouched. **Quoting the hex is required**: a bare `#` after `: ` starts a YAML comment, so `color: #06B6D4` parses empty and OpenCode rejects the agent.
- **Owner identity (OpenCode has no native namespacing like Claude's `/plugin:cmd`).** The `description` is prefixed `[<plugin>] …` (shown in the `/` palette) and the invocable NAME is prefixed `<plugin>-<name>`: command/agent filenames are renamed (`/<plugin>-adapt`), and a skill's directory AND its `name:` frontmatter are renamed to match. The slug `<plugin>` comes from `.claude-plugin/plugin.json` (fallback `package.json`) `name`. Idempotent (never double-prefixes). On adapt (reverse), both markers are stripped so the canonical source stays clean.
