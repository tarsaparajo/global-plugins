# Evolution Ledger

Append-only record of every mirrored evolution of this plugin. Newest first. Each entry links a version to its change set, its parity proof, and any migration.

## [0.5.0] - 2026-06-20 — Frontmatter adaptation across providers

- **Change set:** new `engine/frontmatter.js` (keep/rewrite/drop) wired into the executor via a `frontmatterTarget` op tag (`engine/providers/_base.js`); Codex agents re-expressed as `config.toml` `[agents.<name>]` tables instead of invalid `.codex/agents/*.toml` (`engine/providers/codex-home.js`, `engine/builder.js`); new "Frontmatter field adaptation" doctrine in `skills/_knowledge/provider-matrix.md`; corrected Codex/OpenCode harness + adapter docs and the `capability-extractor` reverse-transform; the child-generation agents (`canonical-projector`, `plugin-architect`) now consult the matrix so children adapt frontmatter too.
- **Parity proof:** `npm run validate` → `{ ok: true, findings: [] }`; `node tests/run-all.js` → 41/41 (incl. per-provider projection + parity + compliance audit). All three dotfolders re-projected; `.codex` verified free of `color`/`model`/`tools` frontmatter leakage; OpenCode agents carry `tools` objects + `provider/model`; Claude unchanged (byte-identical canonical shape).
- **Migration:** none — no breaking change to the canonical→provider contract; only the Codex output shape was corrected (it was invalid before).

<!-- Entries are appended above this line by the evolve pipeline. -->
