# Version Bump Protocol — Reference

Every version bump must fan `VERSION` out to **every** version marker in the plugin, in one release. A bump that updates `plugin.json` but leaves a README badge, the hero pill, or `package.json` behind ships a plugin whose surfaces disagree about what version it is. The `VERSION` file is the single SemVer source of truth; every other marker is **derived** and must equal it. Any drift after sync is a compliance failure (`engine/compliance.js` `version-drift`, the CI version-sync gate, and `/validate` / `/audit`).

## The complete bump-target list

`VERSION` (root, single line) is written first; it fans out to all of these:

**A. Version-string markers (must equal VERSION exactly):**
1. `.claude-plugin/plugin.json` `version` — synced by `engine/semver.js` `sync()`.
2. `.claude-plugin/marketplace.json` `plugins[0].version` — synced by `sync()`.
3. `package.json` `version` (root) — synced by `sync()`.
4. `README.md` version badge (`version-X.Y.Z-green.svg`) — rewritten by `sync()`.
5. `docs/<locale>/README.md` version badges — one per locale; all rewritten by `sync()`.

**B. Visual surface (regenerated, not string-patched):**
6. `assets/hero.svg` version pill (`vX.Y.Z · Mon YYYY`) + `assets/hero.png` — the pill is **derived from `VERSION`** inside `assets/build-hero.js`; run `node assets/build-hero.js` to regenerate the SVG + raster. Never hand-edit the pill.

**C. Narrative governance:**
7. `CHANGELOG.md` — a dated `## [X.Y.Z]` block (Keep a Changelog), never `[Unreleased]`.
8. `EVOLUTION.md` — one append-only ledger row for the version.

## How it runs

`scripts/evolve/bump-version.mjs <level>` (driven by the **evolution-propagator** evolve pipeline, stage 6) does the whole fan-out: it bumps `VERSION`, runs `semver.sync()` (which rewrites the three JSON manifests **and** every README badge), then regenerates the hero (`assets/build-hero.js`, guarded — skipped when absent). The propagator writes the CHANGELOG and appends to EVOLUTION.md atomically with the bump. Re-projection (`scripts/evolve/project.mjs --apply`) then refreshes the provider dotfolders.

README/docs/hero are **canonical-tree** markers — they are NOT projected into provider dotfolders (`assets` is skipped; `docs` rides Claude's whole-repo install only). The propagator edits them in the canonical root, then re-projects the capability surfaces normally.

## The guard

`engine/semver.js` `checkSync(root)` verifies every marker above (the three manifests, every README badge, the hero pill) against `VERSION` and reports per-file drift. It is wired into `engine/compliance.js` (`version-drift` finding), `/validate`, `/audit`, and the CI version-sync gate. A marker out of sync fails the build — this is what catches a forgotten badge or a stale `package.json`. The remedy is always: bump `VERSION` and re-run the fan-out (or `node assets/build-hero.js` for the pill).

## Inheritance

Generated and adapted child plugins inherit this protocol automatically:
- The **engine** (`engine/semver.js`, `scripts/evolve/bump-version.mjs`) is seeded into every child's canonical root and carried as the child's `_<slug>/engine/` payload — so a child's own `/evolve` fans VERSION across **its** manifests, badges, and hero with the same logic.
- This doc (`knowledge/bump-protocol.md`) is a non-standard folder member, namespaced into the child's `_<slug>/knowledge/` bundle (Codex/OpenCode) or kept at the repo root (Claude whole-repo) — so the doctrine ships with the child.
- The child's `templates/child/assets/build-hero.js` already derives its pill from its own `VERSION`, so children stamp the correct version on every hero re-author.

The rule for a child is identical: every version marker equals `VERSION`, fanned out on `/evolve`, guarded by `checkSync`.
