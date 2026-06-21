# Assets

- `hero.svg` — the source vector for the README hero banner (2400×1350). Regenerate it with `build-hero.js`.
- `hero.png` — the rendered banner referenced at the top of the root `README.md` and every `docs/<locale>/README.md` (the locales reference it as `../../assets/hero.png`).
- `build-hero.js` — regenerates `hero.svg` and best-effort rasterizes `hero.png`. Run `node assets/build-hero.js`.
- `hero.config.json` — optional. Pin the gradient palette with `{ "palette": ["#3b82f6", "#22d3ee", "#34d399"] }` to override the per-plugin color derived from the plugin name.

## Regenerating

```
node assets/build-hero.js
```

It always writes `hero.svg`. For `hero.png` it tries `sharp`, then `@resvg/resvg-js`, then headless Chrome (Chrome/Chromium/Edge if present); if none is available it writes only the SVG and prints the manual step. To get the PNG automatically, install one rasterizer:

```
npm i -D sharp        # or: npm i -D @resvg/resvg-js
node assets/build-hero.js
```

Otherwise open `hero.svg` in a browser or vector editor and export `hero.png` at 2400×1350.

## Color identity

The hero's gradient (the degradé) is derived **deterministically from the plugin name**, so each plugin has its own color identity and regenerating the same plugin always yields the same palette. Override it with `hero.config.json` as shown above.
