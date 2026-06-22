# Assets

This plugin's own README hero banner and the tools to (re)create it. This
`assets/` folder is local-only — it is never projected into any provider
dotfolder (the anti-bloat guard keeps `assets/`, like `docs/`, out of the
capability surface). It is this plugin's own copy of the **shared hero skeleton
model** every child inherits. The standard is
`skills/_knowledge/hero-skeleton.md`; the neutral model and its guides ship to
children from `templates/child/assets/`.

## Files

- `hero.svg` — this plugin's authored source vector for the README hero banner (2400×1350).
- `hero.png` — the rendered banner referenced at the top of the root `README.md` and every `docs/<locale>/README.md` (locales reference it as `../../assets/hero.png`).
- `build-hero.js` — a deterministic generator that renders this plugin's hero from its metadata **and** the reference implementation of the SVG→PNG conversion. Run `node assets/build-hero.js`.

## The shared skeleton model

The hero is one **skeleton** every plugin starts from. The neutral model
(`hero.skeleton.svg`), its line-by-line annotation (`hero-svg.md`), and its
fill-in guide (`hero-authoring.md`) live under `templates/child/assets/` and
ship to every child. A plugin authors its own banner from the skeleton —
choosing its own palette and logo glyph — or renders one deterministically with
`build-hero.js`. Only two design knobs vary per plugin:

- **Palette (the degradé).** Three gradient stops `C1`→`C2`→`C3` feeding every accent; the chrome (charcoal bg, neutral text) stays fixed.
- **Logo glyph** (the icon in the top-bar button) — `share` (default), `nodes`, `hexagon`, `spark`, or a custom path/inline SVG, colored from the palette. Markup in `skills/_knowledge/hero-skeleton.md` (the logo gallery).

## Converting SVG → PNG (zero dependencies, never hard-fails)

The conversion **downloads nothing**. It always writes the SVG first, then
rasterizes via the first method that works:

```
sharp  →  @resvg/resvg-js  →  headless Chrome/Chromium/Edge  →  manual export
```

```
node assets/build-hero.js
```

If a rasterizer is present it writes `hero.png`; otherwise it writes only the
SVG and prints the manual step (open `hero.svg` in a browser or vector editor
and export `hero.png` at 2400×1350). To get the PNG automatically you may
install one rasterizer (optional, never required):

```
npm i -D sharp        # or: npm i -D @resvg/resvg-js
node assets/build-hero.js
```

Both `require`s are guarded, so this plugin adds **no hard dependency**. Full
methodology: `skills/_knowledge/hero-skeleton.md` §4.
