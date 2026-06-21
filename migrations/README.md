# Migrations

This directory holds one `<version>.md` per breaking release. Each migration is independently runnable and reversible (dry-run, apply, rollback). The chain is monotonic and gapless.

Each migration's `steps[]` are **structured** (a `kind` the runner in `scripts/evolve/migrate-apply.mjs` interprets), never a shell string — so execution is deterministic and injection-free. Supported kinds:

- `relocate-nonstandard-dirs { scope:[codex,opencode] }` — move every PRIVATE top-level dir in the installed dotfolder into the plugin's bundle `_<slug>/<dir>/`, classified by the SAME `engine/helpers` `classifyTopLevelDir` + `pinnedToRoot` the projector uses (so the migration never diverges from a fresh projection). No hand-listed dirs.
- `remove-path { paths:[...], scope:[...], onlyWhen?:"bundleExists" }` — delete provider-root-relative paths if present (idempotent); `onlyWhen:bundleExists` defers removal until the new bundle is in place.

| Version | From | Risk | Reversible |
|---------|------|------|------------|
| 1.0.0 | >=0.7.0 <1.0.0 | medium | yes |
| 1.1.0 | >=1.0.0 <1.1.0 | low | yes |
