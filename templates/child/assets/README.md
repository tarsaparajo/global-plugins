# Assets

The README hero banner and the tools to (re)create it. The hero is a **shared
skeleton model**: you author this plugin's own banner from a neutral template,
choosing your own colors and logo, then convert it to a PNG with zero
downloaded dependencies. The full standard is
`skills/_knowledge/hero-skeleton.md`.

## Files

- `hero.skeleton.svg` — the **neutral model**: a valid 2400×1350 SVG whose every plugin-specific value is a `[PLACEHOLDER]` and which names no specific plugin. The starting point for a bespoke hero. Renderable as-is so you can eyeball it.
- `hero-svg.md` — a **line-by-line** annotation of the skeleton: what each element renders and which field/knob fills it.
- `hero-authoring.md` — the **fill-in guide**: gather data → choose palette → choose logo → fill fields → write the SVG → convert to PNG.
- `hero.svg` — this plugin's authored source vector (2400×1350), once created.
- `hero.png` — the rendered banner referenced at the top of the root `README.md` and every `docs/<locale>/README.md` (locales reference it as `../../assets/hero.png`).
- `build-hero.js` — a deterministic generator that renders a hero straight from this plugin's metadata (deriving a palette from the plugin name) **and** the reference implementation of the SVG→PNG conversion. Run `node assets/build-hero.js`.
- `hero.config.json` — optional. Pin the gradient palette with `{ "palette": ["#3b82f6", "#22d3ee", "#34d399"] }` to override the per-plugin color the generator derives from the plugin name.

## Two ways to get a hero

1. **Author from the skeleton (the standard for a bespoke banner).** An agent
   reads `hero.skeleton.svg` + `hero-svg.md` + `hero-authoring.md` and writes a
   new `hero.svg` for this plugin — its own palette, its own logo glyph, fields
   filled in — then converts it to `hero.png` (below). This is how generate/adapt
   create the hero.
2. **Generate deterministically (convenience).** `node assets/build-hero.js`
   writes `hero.svg` from metadata and best-effort `hero.png`. Use it for a quick
   refresh, or as the conversion engine for an SVG you authored by hand.

## What varies per plugin

Only two design knobs — everything else is the fixed skeleton:

- **Palette (the degradé).** Three gradient stops `C1`→`C2`→`C3` that feed every
  accent. Either pick them by hand when authoring, or pin them via
  `hero.config.json` for the deterministic generator. Pick something distinct and
  legible on the charcoal background.
- **Logo glyph** (the icon in the top-bar button). Choose a built-in —
  `share` (default), `nodes`, `hexagon`, `spark` — or draw your own path/inline
  SVG. All glyphs sit in the 100×100 mark space and are colored from the palette.
  The full markup is in `skills/_knowledge/hero-skeleton.md` (the logo gallery).

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
SVG and prints the manual step. To get the PNG automatically you may install one
rasterizer (optional, never required):

```
npm i -D sharp        # or: npm i -D @resvg/resvg-js
node assets/build-hero.js
```

Otherwise open `hero.svg` in a browser or vector editor and export `hero.png` at
2400×1350. Both `require`s are guarded, so the plugin adds **no hard
dependency**. Full methodology: `skills/_knowledge/hero-skeleton.md` §4.
