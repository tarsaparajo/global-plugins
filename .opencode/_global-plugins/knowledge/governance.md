# Governance — Reference

## VERSION and SemVer

A single-line `VERSION` file at the plugin root is the SemVer source of truth. It fans out to **every** version marker — `plugin.json`, `marketplace.json`, `package.json`, every README version badge (root + locales), and the hero pill — via the SemVer sync + hero regeneration; the markers are derived and overwritten, never edited by hand. The complete bump-target list and the fan-out mechanism are in **`knowledge/bump-protocol.md`**. Any drift after sync is a compliance failure.

- **PATCH** — projection-only fixes, docs, i18n, non-behavioral.
- **MINOR** — new capability, new provider adapter, additive backward-compatible surface.
- **MAJOR** — breaking canonical schema, removed/renamed command, removed provider, or any change breaking for already-generated products (triggers a migration).
- **Pre-1.0** — MINOR may carry a breaking change only if a migration is generated and the CHANGELOG marks it under `### Breaking Changes`. This relaxation ends at 1.0.0.

## CHANGELOG (Keep a Changelog)

```
# Changelog

## [Unreleased]
### Added / ### Changed / ### Deprecated / ### Removed / ### Fixed / ### Security
### Breaking Changes   (only when a breaking change lands; links to migrations/<version>.md)
### Migrations         (only when a migration exists)

## [x.y.z] - YYYY-MM-DD
```

Breaking Changes and Migrations are mutually linked: one without the other is a compliance failure. Large releases may add `### Highlights` and `### Release Surface`. Every release moves `## [Unreleased]` into a dated block and recreates an empty Unreleased skeleton.

## Prompt Defense Baseline

Injected into every model-facing `.md` (agents, command shims, skills, context files) as a `## Prompt Defense Baseline` section, immediately after frontmatter (and after an H1 if present), six bullets verbatim. Idempotent. For codex, carried under a dedicated `[prompt_defense]` table in `config.toml` (`baseline = "…"`, append-safe — a bare root key would fall under a trailing table like `[desktop]` when merged into an existing config); for single-file providers, kept once in the consolidated file.

## Self-sufficiency

No shipped file may reference any external source, prior art, attribution, codename, or third-party tool. Every plugin stands alone. The compliance denylist scan is hard and non-suppressible.

## Author and license

Author and license live in `plugin.json`/`marketplace.json` and `LICENSE`. For a generated child plugin, the author defaults to the generating user (the plugin belongs to its creator), and the license defaults to MIT.

## Distribution manifest

A child that targets Claude Code MUST ship **two** `.claude-plugin/` manifests: `plugin.json` (the plugin manifest) AND `marketplace.json` (a self-listing marketplace catalog with `"source": "./"`). Claude Code's `/plugin marketplace add <repo>` looks for `marketplace.json`; a child that ships only `plugin.json` errors `Marketplace file not found` and cannot be installed. Both are authored together at generate/adapt time (`skills/generate` step 4, `skills/adapt` step 4) from `templates/governance/marketplace.json.tmpl`, the marketplace `name` and `plugins[0].name` both equal the plugin's `identifier`, and `engine/semver.js` keeps `plugins[0].version` in sync with `VERSION` on every `/evolve` (it fans into the file only when present — so authoring it once at creation is what activates the sync). Codex and OpenCode do not use `marketplace.json` (they install by copying the dotfolder); this manifest is Claude-Code-specific.
