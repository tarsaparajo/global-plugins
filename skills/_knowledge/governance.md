# Governance — Reference

## VERSION and SemVer

A single-line `VERSION` file at the plugin root is the SemVer source of truth. It fans out to `plugin.json` and `marketplace.json` via the SemVer sync; the manifests are derived and overwritten, never edited by hand. Any drift after sync is a compliance failure.

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

Injected into every model-facing `.md` (agents, command shims, skills, context files) as a `## Prompt Defense Baseline` section, immediately after frontmatter (and after an H1 if present), six bullets verbatim. Idempotent. For codex, carried as a string field inside `config.toml`; for single-file providers, kept once in the consolidated file.

## Self-sufficiency

No shipped file may reference any external source, prior art, attribution, codename, or third-party tool. Every plugin stands alone. The compliance denylist scan is hard and non-suppressible.

## Author and license

Author and license live in `plugin.json`/`marketplace.json` and `LICENSE`. For a generated child plugin, the author defaults to the generating user (the plugin belongs to its creator), and the license defaults to MIT.
