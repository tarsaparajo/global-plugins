# Evolution Ledger

Append-only record of every mirrored evolution of this plugin. Newest first. Each entry links a version to its change set, its parity proof, and any migration.

## 0.4.2 — 2026-06-20

- **Change set:** Added `engine/frontmatter.js` and a `transform-agent` operation; wired the OpenCode adapter (`engine/providers/opencode-home.js`) to rewrite agent frontmatter into OpenCode's schema (object `tools`, `mode: subagent`, provider-prefixed `model`, dropped `color`), and the Codex adapter (`engine/providers/codex-home.js`) to emit valid TOML per-agent files (skills/commands siblings + AGENTS.md index unchanged). Updated `adapters/registry.json` transform metadata, the adapter contracts, the provider matrix, and the canonical-projector doctrine. Hardened the child `templates/child/scripts/evolve/project.mjs` engine-completeness guard to require `frontmatter.js`.
- **Trigger:** OpenCode install failed with `Configuration is invalid` on projected `.opencode/agents/*.md` — Claude-native frontmatter was copied verbatim into providers whose schemas reject it. Codex agents had the same class of defect (markdown copied into `.toml`).
- **Parity proof:** `node tests/run-all.js` — 42/42 passing, including the all-provider projection + parity suite and new frontmatter/schema-validity tests; `engine/compliance.audit` reports `{ ok: true }`.
- **Migration:** None required. Affects only generated/adapted output; re-running the projector regenerates schema-valid agent files. Generated children inherit the fix by bundling the engine whole.

<!-- Entries are appended above this line by the evolve pipeline. -->
