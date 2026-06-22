# Non-Standard Folder Namespacing — Reference

How a plugin keeps its **non-standard** folders from colliding with other plugins installed in the same provider home (`~/.config/opencode/`, `~/.codex/`). Standard capability dirs are already safe — their entries are owner-prefixed by name (`<slug>-<name>`), so they are self-identifying and merge cleanly. The risk is everything OUTSIDE those dirs: the runtime payload, the compiled plugin, the install-state file — and **any folder the plugin invents** (its own doctrine/protocols, schemas, templates, reference data, internal migrations) that no provider discovers natively. Without namespacing, installing plugin A then plugin B makes B's loose folders overwrite A's.

## The rule

Every plugin owns ONE private bundle dir at the provider root: **`_<slug>/`** — the leading underscore marks the *bundle* as infrastructure and groups every plugin's bundle together (`<slug>` is the plugin name from `.claude-plugin/plugin.json`/`package.json`). ALL of the plugin's non-standard infrastructure lives inside it — **generically**, not just the known infra artifacts. Any top-level folder the plugin authors that a provider does not read natively becomes a sibling `_<slug>/<folder>/`. Two plugins can never share a slug, so `_pluginA/` and `_pluginB/` never collide. The rule is uniform for both **generate** (creating a folder namespaced from birth) and **adapt** (re-homing a source plugin's pre-existing loose folders under `_<slug>/`, with a warning).

**Bundle members carry CLEAN names — no redundant underscore.** The bundle `_<slug>/` already signals "this is infrastructure", so its members are plain (`engine`, `dist`, `knowledge`, …), not `_engine`/`_knowledge`. The underscore lives on the bundle, not on what is inside it. (Reference doctrine — the plugin's `knowledge/` folder — is namespaced exactly like any other invented folder: it is NOT a capability and never sits loose inside the shared `skills/` dir, where it would collide with other plugins' doctrine.)

```
~/.config/opencode/
├── agents/<slug>-<name>.md        # STANDARD — stays at root, owner-prefixed name
├── skills/<slug>-<name>/          # STANDARD — stays at root
├── commands/<slug>-<name>.md      # STANDARD — stays at root
├── plugins/<slug>.js              # SHARED dir, per-slug loader file (discovery)
└── _<slug>/                       # PRIVATE bundle (this plugin only)
    ├── engine/                    # runtime payload
    ├── dist/                      # compiled OpenCode plugin (sibling of engine)
    ├── knowledge/                 # reference doctrine (a namespaced invented folder)
    ├── <invented-folder>/         # ANY other non-standard folder the plugin authored
    └── install-state.json
```

```
~/.codex/
├── config.toml  AGENTS.md  skills/  commands/   # STANDARD/SHARED — stay at root
└── _<slug>/
    ├── engine/
    ├── knowledge/
    └── install-state.json
```

## PRIVATE vs SHARED — the COMPUTED safety classification

The classification is **computed, not a fixed list**. For each TOP-LEVEL folder, the engine asks one question — *does this provider discover it natively (or is it shared by all plugins)?* — and routes accordingly (`engine/helpers.js` `classifyTopLevelDir`, the SINGLE source of truth shared by generate, adapt, and the migration runner):

- **SHARED / standard** (stays at the provider root, NEVER moved): a folder the provider reads natively OR that all installed plugins share. This is **per-provider** (see *Pinned-to-root*). Examples: `agents/`, `skills/`, `commands/` (capability dirs — owner-prefixed by name); `plugins/` (OpenCode's discovery dir — a plugin adds only its own `plugins/<slug>.js` loader, never replaces the dir); `opencode.json`; `AGENTS.md` / `CLAUDE.md`; `config.toml` (Codex). Relocating these breaks discovery or instruction loading.
- **PRIVATE** (goes into `_<slug>/<folder>/`, one bundle per plugin): **ANY** folder the plugin invents that no provider discovers natively. This is the **general rule** — not just the known infra artifacts (`engine/` runtime payload, `dist/` OpenCode compiled plugin, `install-state.json`) but also any folder a plugin authors for its own use: reference doctrine (`knowledge/`), protocols an agent reads at runtime, structured-output schemas, the plugin's own templates, reference data, internal migrations. Each lands as a **sibling** of `engine`/`dist` under `_<slug>/`, with a clean (un-prefixed) name.
- **SKIP** (dropped with a note, never silently): genuine non-runtime junk only — VCS/tooling metadata (`.git`, `node_modules`, `.github`, `.evolution`), OS junk (`.DS_Store`), provider dotfolders (projection OUTPUTS), and conventional dev-meta (`tests/`, `migrations/`, `assets/`) that a runtime install never reads. **An unrecognized folder is NEVER dropped — the safe default is PRIVATE (bundled).**

A folder declared by a manifest module (`manifests/modules.json` `paths[]`) is **known structure**: its placement is governed by that module's applicability (`targets[]`/`payloadTargets[]`), NOT by the generic scanner (R7 — applicability ≠ placement). Only a folder NO module declares is reachable by the classifier.

When in doubt: if the provider reads it natively, or more than one plugin must see it, it is SHARED and stays put; otherwise it is PRIVATE.

## Pinned-to-root — per-provider (R2)

What counts as "the provider reads it natively" is **relative to the provider**. Each provider auto-scans a FIXED set of root paths; a folder in that set must stay at the root **on that provider**, even though another provider bundles the same name. Moving a folder a provider auto-scans breaks discovery **silently** (no error). The allowlist lives per-provider in `adapters/registry.json` (`pinnedToRoot`), consulted by the classifier:

| Provider | Auto-scanned at fixed root (pinned, never bundled) | Whole-repo install? |
|---|---|---|
| claude | (n/a — whole-repo: EVERY folder keeps its repo-root path) | **yes** — classifier is a no-op |
| codex | `agents/`, `skills/`, `commands/`, `prompts/`, `rules/` (+ files `config.toml`, `AGENTS.md`) | no |
| opencode | `agents/`, `skills/`, `commands/`, `plugins/` (+ files `opencode.json`, `AGENTS.md`, `CLAUDE.md`) | no |

The asymmetry matters: Codex auto-scans `prompts/` and `rules/` at the root, **OpenCode does not** — so a plugin's own `prompts/` folder that no module claims stays at `.codex/prompts/` but is namespaced to `.opencode/_<slug>/prompts/`. Verify any new provider's auto-scan paths against its official docs before pinning.

## Internal references after namespacing (G5)

When a folder moves to `_<slug>/<folder>/`, a capability body that referenced its contents by a repo-root-relative path (e.g. "read `protocols/PLAYBOOK.md`") would break on the providers that moved it. The engine **rewrites** such references to the LITERAL namespaced relative path `_<slug>/<folder>/…` (`engine/executor.js` `rewriteNamespacedRefs`), per-provider:

- **Claude** keeps every folder at the repo root (whole-repo install), so `<folder>/…` already resolves — Claude bodies are **never** rewritten.
- **Codex / OpenCode** move the folder, so their bodies are rewritten to `_<slug>/<folder>/…`.

A LITERAL relative path is the portable choice: Claude has `${CLAUDE_PLUGIN_ROOT}` but Codex/OpenCode have **no equivalent native variable**, so a single token cannot work cross-provider — the engine materializes a concrete path per provider instead. The rewrite is idempotent (re-projection never produces `_<slug>/_<slug>/<folder>`). When authoring a capability that reads an invented folder, reference it by its plain repo-root-relative path (`<folder>/X.md`); the engine namespaces it for the providers that need it. (Example: a skill body that reads `knowledge/provider-matrix.md` is rewritten to `_<slug>/knowledge/provider-matrix.md` on Codex/OpenCode, and kept as `knowledge/provider-matrix.md` on Claude.)

## `engine` and `dist` are siblings (path-resolution invariant)

Inside `_<slug>/`, the compiled `dist/` and the `engine/` payload are **siblings** (clean names — the bundle already marks them as infra). The compiled plugin resolves the payload by a fixed RELATIVE offset (`dist/tools/index.js` → `../../engine`), so the compiled output carries no absolute path and no slug — it stays byte-identical across plugins and re-projections (the drift guard byte-checks it). Keep them siblings: do not nest `dist` under `engine` or vice-versa.

## OpenCode discovery contract

OpenCode auto-loads global plugins only from `~/.config/opencode/plugins/` (a directory) or the `plugin` array in `opencode.json`. A compiled plugin sitting at `_<slug>/dist/` is therefore NOT discovered by itself. Pair the namespacing with a discovery loader: a per-slug file `plugins/<slug>.js` (in the shared, documented discovery dir) that re-exports the bundle's entry (`require('../_<slug>/dist/index')`). One file per slug → no collision, and no shared file is rewritten. Tool NAMES are slug-prefixed too (`<slug>-generate`, `<slug>-evolve`, …) so two installed plugins never shadow each other by tool name.

## Codex

Codex reads only `config.toml`, `AGENTS.md`, `skills/`, `commands/` (and `prompts/`, `rules/`). It ignores an unknown top-level dir, so `_<slug>/` is invisible to it and needs no discovery file. The engine is invoked explicitly: `cd ~/.codex/_<slug>/engine && node scripts/evolve/project.mjs`.

## Reserved-name guard

A slug must not equal a reserved provider dir name (`agents`, `skills`, `commands`, `command`, `plugins`, `plugin`, `tool`, `tools`, `dist`, `rules`, `hooks`, `mcp`, `prompts`, `engine`); otherwise `_<slug>/` (or the `plugins/<slug>.js` loader) could shadow a standard surface, and a slug named `engine` would collide with the bundle's own `engine/` member. The engine guards this. A relocated non-standard folder is held to the same rule: it can never be named one of the bundle's infra siblings (`engine`/`dist`) — that would clobber the payload/compiled plugin and break the fixed `../../engine` offset; the scanner refuses such a folder with a warning rather than overwriting.

## Self-application & determinism

This is a deterministic projection rule, applied by the engine (`engine/helpers.js` `privateBundleDir`/`bundleSubPath`/`payloadBasePath`/`classifyTopLevelDir`, `engine/providers/_base.js` `payloadCopy`/`namespacePrivateFolders`, `engine/build-opencode.js`), not a runtime decision — every provider operator (Claude Code, OpenCode, Codex) producing a plugin gets the identical layout. global-plugins applies the rule to itself (`_global-plugins/`): most of its top-level folders are module-declared (engine/manifests/templates ship as payload; docs is claude-only) or dev-meta (`tests/`/`migrations/`/`assets/`), and its one invented folder — `knowledge/` (reference doctrine) — is namespaced by the generic scanner into `_global-plugins/knowledge/` on Codex/OpenCode (kept at the repo root on Claude via whole-repo install), exactly as a child's invented folder would be. Self-application means the **rule** holds for it. Every generated/adapted child inherits the same rule through its seeded engine, so a child that invents a folder (including its own `knowledge/`) is namespaced correctly from birth.
