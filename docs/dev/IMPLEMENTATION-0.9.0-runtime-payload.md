# Implementation Plan — 0.9.0: Runtime-Payload Projection + Native OpenCode Tools

> Internal engineering plan. Makes an installed `global-plugins` able to **create/adapt/evolve multi-provider
> child plugins from any provider** (Claude, Codex, OpenCode) — not only Claude — by shipping the deterministic
> projection engine as a runtime payload alongside the model-facing capability surface.

## Problem statement

Generation is a deterministic Node program (the projection engine: `engine/` resolver→projector→executor, plus
`manifests/`, `adapters/`, `templates/`). It must be **present on the host** to run. The three install models
deliver it unevenly:

| Provider | Install carries | Engine on disk? | Can generate today? |
|----------|-----------------|-----------------|---------------------|
| Claude | whole repo (`plugin.json` `source:"./"`) | yes (`${CLAUDE_PLUGIN_ROOT}/engine`) | yes |
| Codex | only `.codex/` capability surface | no | no |
| OpenCode | only `.opencode/` capability surface + empty `dist/` stub | no | no |

Two consequences:
1. Codex/OpenCode installs are usage interfaces without the machinery that performs generation.
2. **Latent bug:** generated children's `templates/child/scripts/evolve/*.mjs` require `./engine` + `./manifests`
   and hard-fail without them, but nothing copies the engine into a child. Children cannot self-evolve.

The 0.7.0 anti-bloat guard (`engine/providers/_base.js` skips dirs without a capability handler; `engine-core`/
`manifests-core`/`child-templates` gated to `targets:["claude"]`) is correct for the **capability surface** and must
NOT be weakened. The fix is an **additive, separately-typed runtime-payload channel**, not a guard change.

## Design — the runtime-payload channel

Ship the full self-evolution payload into a reserved, **non-capability** subdir of each non-Claude install and into
generated children:

```
payload = engine/ + scripts/evolve/ + manifests/ + adapters/ + templates/child/ + .evolution/baseline/
```

Reserved subdir: `<dotfolder>/engine/` (i.e. `.codex/engine/`, `.opencode/engine/`). It is never scanned as a
capability, never owner-prefixed, never frontmatter-adapted; it is copied verbatim and byte-checked by the drift
guard exactly like the capability dotfolders.

Resulting installs:
```
~/.codex/                                  ~/.config/opencode/
  AGENTS.md  config.toml                     <plugin>-*.md (agents)  commands/
  skills/  commands/                         skills/  _knowledge/
  engine/                                   engine/        (same payload)
    engine/ scripts/ manifests/              dist/           (native plugin tools)
    adapters/ templates/ .evolution/
```

## Phase 1 — Runtime-payload projection channel

Files: `manifests/modules.json`, `engine/providers/_base.js`, `engine/providers/codex-home.js`,
`engine/providers/opencode-home.js`.

1. **Manifests.** Give `engine-core`, `manifests-core`, `child-templates` a payload target set covering
   `codex` + `opencode` (keep their existing `targets:["claude"]`). Add `scripts/` and `.evolution/baseline/` to the
   payload path set so the re-projection wrappers + the delta baseline travel.
2. **`_base.js` payload handler.** Add `payloadCopy(ctx, subdir = "engine")` that walks the payload dirs with
   `listRelativeFiles` and emits `opCopyPath` ops to `<targetRoot>/engine/<dir>/<rel>` verbatim — no frontmatter
   adapt, no owner prefix, no prompt-defense injection. Keep it OUT of the capability handler map so the line-122
   guard still drops these dirs from the capability surface.
3. **Fix the stale comment** at `_base.js` lines 103-105 — it claims "Unknown dirs fall back to a verbatim copy" but
   the code does `continue` (skip). Rewrite to describe the real behavior + the new payload channel.
4. **Provider opt-in.** `codex-home.js` and `opencode-home.js` `planOperations` call the payload handler;
   `claude-home.js` does not (whole-repo already carries it).

Acceptance: re-project → `.codex/engine/` and `.opencode/engine/` contain the full payload; the capability surface
(agents/skills/commands) is byte-identical to before; drift guard green; idempotent re-apply = no new diff.

## Phase 2 — Seed the payload into generated children (fixes the latent bug)

Files: `skills/generate/SKILL.md`, `skills/adapt/SKILL.md`, `agents/canonical-projector.md`,
`agents/plugin-architect.md`, `agents/evolution-propagator.md`, `templates/child/`.

The child authoring step must copy `engine/ + scripts/evolve/ + manifests/ + adapters/ + templates/child/ +
.evolution/baseline/` into the child's canonical root (this is exactly what the child's `project.mjs` expects at
`./engine`, `./manifests`). Document it explicitly in the generate/adapt doctrine (today only an unimplemented
comment). The child then re-projects/self-evolves on any host with Node — uniform with the parent installs.

Acceptance: a generated child contains `engine/` + `manifests/` and `node scripts/evolve/project.mjs --dry-run`
succeeds (no "bundled engine incomplete" failure).

## Phase 3 — OpenCode native `dist/` tools

Files: `engine/build-opencode.js` (replace the stub), `adapters/registry.json` (buildStep already wired).

Replace the empty-barrel build with a real OpenCode `Plugin` that registers in-process tools via
`tool({ description, args: tool.schema.*, execute })`:
`generate(briefing, targets)`, `adapt(path)`, `evolve(change)`, `validate(path)`, `migrate(path)`.

Implementation (lowest-risk for this phase): each tool's `execute` shells out via the Bun `$` to
`node engine/scripts/evolve/…` (reuses the payload that already ships; no bundler/toolchain needed; keeps `dist/`
small). The engine writes to a resolved target root; surface write intent through the plugin's permission model.
`dist/` stays re-derived / non-round-trippable — build output, regenerated by the build step, never hand-edited;
the drift guard treats it as generated.

Acceptance: build `dist/`; loading it in Node yields a Plugin whose tool registry is **non-empty** (not `{}`) and
exposes the five tools.

## Phase 4 — Tests + drift + compliance

Files: `tests/test_projection_drift.js`, `tests/providers/test_all_providers.js`, `engine/compliance.js`,
`tests/_fixture.js` (if needed).

- Drift: byte-check the `engine/` payload AND assert no payload file leaks into the capability surface
  (agents/skills/commands). Closes the 0.7.0 committed-bytes root cause for the new channel.
- Compliance: payload-completeness check — if a codex/opencode projection ships `engine/scripts/evolve/project.mjs`
  it must also ship the required `engine/*` modules (mirror the child `REQUIRED_ENGINE` presence check); fail loud on
  a partial payload.
- Provider tests: assert `engine/` payload present for codex/opencode, absent for claude; assert the OpenCode
  `dist/` tool registry is non-empty.

Acceptance: `npm test` green (existing 59 + new); `npm run validate` `ok:true`.

## Phase 5 — Doctrine + README + locales

Files: `knowledge/{codex,opencode,claude-code}-harness.md`, `knowledge/provider-matrix.md`,
`adapters/providers/{codex,opencode}-home.md`, `README.md` + `docs/<13 locales>/README.md`.

Document the runtime-payload channel, the per-provider engine run path (Codex: `cd ~/.codex/engine && node
scripts/evolve/project.mjs …`, with the one-time approval prompt note), and the OpenCode native tools — so generated
children inherit the same doctrine. Add a short "generating from Codex/OpenCode" usage note to the README + locales.

## Phase 6 — Version bump 0.9.0 + hero banner + governance

- Bump VERSION + `package.json` + `.claude-plugin/{plugin,marketplace}.json` to `0.9.0`.
- Hero: set the pill in `assets/build-hero.js` to `v0.9.0 · Jun 2026`; regenerate `assets/hero.svg`
  (`node assets/build-hero.js`); rasterize to `assets/hero.png` at exactly 2400×1350 (serve `assets/` via
  `python3 -m http.server`, render the exact-size HTML wrapper in Playwright at viewport 2400×1350, screenshot;
  no `rsvg/resvg/sharp` available and `file:` is blocked). **Do NOT use `git stash`.**
- CHANGELOG `## [0.9.0]` (Added: runtime-payload channel making Codex/OpenCode installs self-generating; native
  OpenCode tools; Fixed: children now bundle the engine they need to self-evolve). EVOLUTION ledger entry with
  parity proof.

## Phase 7 — Commit + push

- Re-project once more so committed output == engine; full `npm test` + `npm run validate` final gate.
- Commit in the plugin repo as **Tarsa Parajo `<eitarcisio@live.com>`**, sole committer, **no `Co-Authored-By:
  Claude` trailer**. Then `git push origin main`.

## Invariants (must not break)

- 0.7.0 capability guard intact (payload is a separate channel into `engine/`, never the capability surface).
- Drift guard byte-equality extended to `engine/`.
- Self-sufficiency denylist, prompt-defense baseline, no-model-preset, OpenCode quoted-hex color + owner-prefix,
  Codex `[prompt_defense]` table + `[agents.<name>]` tables, install merge-copy (`cp -R .codex/. ~/.codex/`).
- Canonical source is the only source of truth; `engine/` and `dist/` are projected/generated, never hand-edited.
