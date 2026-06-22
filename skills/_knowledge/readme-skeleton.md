# README Skeleton — Reference

The standard every generated and adapted plugin's README follows. The root `README.md` and every `docs/<locale>/README.md` share **one skeleton**; only path depth and prose language differ. Locales come from `config/locales.json` (the single source of truth for the selector, the `docs/<locale>/` scaffold, and the i18n compliance check). It is a presentation standard — authored by the `generate`/`adapt` doctrine, not projected into provider dotfolders (README/docs/assets are repo-root infrastructure the anti-bloat guard keeps out of the capability surface).

## 1. The centered header block

A `<div align="center"> … </div>` placed **above** `## Overview`, containing, in this exact order:

1. `**Language:**` switcher line (see §3).
2. `# <plugin name>` (H1).
3. Hero image (see §2): root `![<plugin name>](assets/hero.png)`; locale `![<plugin name>](../../assets/hero.png)`.
4. Tagline — one line, translated per locale.
5. The three badges (see §4).
6. The multilingual header line — `**<config.multilingualHeader>**` (the `Language / 语言 / …` string from `config/locales.json`).
7. The repeated locale switcher (same form as #1).

Close with `</div>`, a blank line, then `---`. Everything after `---` is the body (`## Overview`, `## Capabilities`, `## Install`, `## Usage`, the optional rules section, `## Internal Architecture`, `## License`).

## 2. Hero in every locale

The hero appears in **every** README, not only English. The image file lives once at `<root>/assets/`; locale READMEs reference it two levels up as `../../assets/hero.png`. The hero is generated, not hand-placed — see §7.

## 3. The locale switcher (two positions, built from config)

Build both switcher lines mechanically from `config/locales.json`, in config order:

- **Root** — `English | [<label>](docs/<dir>/README.md) | …` for every locale.
- **A locale** — `[English](../../README.md) | … | <its own label as plain text> | …`, every other locale linked as `[<label>](../<dir>/README.md)`.

The **current** locale is never a link (plain text); every other entry is a link. The two switcher positions in a file carry identical text.

## 4. Badges (the standard)

Exactly three, in this order, on consecutive lines:

- `[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](<LICENSE>)`
- `[![Version](https://img.shields.io/badge/version-<X.Y.Z>-green.svg)](<VERSION>)`
- `[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](<support-url>)` — or a generic `support` badge when the author has no coffee URL.

Paths: root uses `LICENSE` / `VERSION`; a locale uses `../../LICENSE` / `../../VERSION`. The badges are byte-identical across locales **except** the path depth. The Version badge value **must equal the plugin's `VERSION` file** — drift between them is a defect.

## 5. Per-provider Install section

One box per **targeted** provider only (the resolved target set), in the body's `## Install` section. Always the merge-copy form — never the nesting `cp -r <dotfolder> <home>`:

- **Claude Code** → `/plugin marketplace add <owner>/<name>` then `/plugin install <owner>@<name>`.
- **Codex** → `mkdir -p ~/.codex && cp -R .codex/. ~/.codex/`. The trailing `/.` merges contents into the existing `~/.codex/` rather than nesting a copy inside it.
- **OpenCode** → `node engine/build-opencode.js` (only when the plugin ships the compiled payload) then `mkdir -p ~/.config/opencode && cp -R .opencode/. ~/.config/opencode/`. OpenCode reads `~/.config/opencode/`, not `~/.opencode/`.

A provider absent from the target set gets no box.

## 6. Rules install box (only when the plugin has a rules layer)

When the plugin ships `rules/`, add a dedicated box to the `## Install` section:

- **Claude Code** does NOT distribute rules via `/plugin install` — the user copies them to `~/.claude/rules/` (or the project's `.claude/rules/`), or runs the bundled `scripts/install-rules.mjs`.
- **Codex / OpenCode** carry the rule content folded into `AGENTS.md`, which they auto-discover — nothing to install.

A plugin with no rules layer gets no rules box.

## 7. Hero (authored from the skeleton, SVG → PNG)

The hero is authored from a shared, neutral **hero skeleton** (`assets/hero.skeleton.svg`) to the hero-skeleton standard, then converted to `assets/hero.png` with a zero-dependency method (`sharp → @resvg/resvg-js → headless Chrome → manual export at 2400×1350`, never hard-failing, no hard dependency). Only the palette (the degradé) and the logo glyph vary per plugin. Full standard — the model, the palette + logo parametrization, the logo gallery, and the conversion methodology — is in `skills/_knowledge/hero-skeleton.md`.

## 8. Invariants

One skeleton, every locale. The English root README is complete; every locale is a **full** translation at parity with the root — only paths and prose language differ. Badges are byte-identical across locales (modulo path depth). The header block, hero, badges, and dual switcher are present in **every** README, English and localized alike. The hero is regenerable: re-running `build-hero.js` refreshes the image without touching prose.
