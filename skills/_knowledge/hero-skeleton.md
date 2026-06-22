# Hero Skeleton — Reference

The standard for a plugin's README hero banner. Every generated and adapted
plugin ships a **hero skeleton** — a neutral, self-contained SVG model — plus
the docs to author its own hero from it and the zero-dependency method to
convert that SVG to a PNG. The hero is a presentation artifact (authored by the
`generate`/`adapt` doctrine, kept out of the provider capability surface by the
anti-bloat guard); this doctrine is its single source of truth. It complements
`readme-skeleton.md`, which places the hero in every locale README.

## 1. One shared model, authored — not rendered — per plugin

The hero has **one skeleton**: `assets/hero.skeleton.svg`, a valid 2400×1350 SVG
whose every plugin-specific value is a bracketed placeholder (`[PLUGIN NAME]`,
`[OWNER]/[PLUGIN-SLUG]`, `[AGENT 1]`, …) and which names no specific plugin. It
ships verbatim to every child (it rides the `_engine/` payload under
`templates/child/assets/`), so each plugin starts from the **same** model — the
way this plugin is itself a model for its children.

The skeleton is a **reference the provider agent reads and imitates**, not a
template a script consumes. At generate or adapt time the agent (Claude, Codex,
or OpenCode) reads the skeleton plus its two guides and **authors a brand-new
SVG** for the plugin — filling the placeholders with the plugin's real data and
choosing its own palette and logo. A plugin adapted from a source that has **no
hero gains one** this way. Two guides ship beside the skeleton:

- `assets/hero-svg.md` — a **line-by-line** annotation: what each element renders and which field/knob fills it.
- `assets/hero-authoring.md` — the **fill-in** sequence: gather data → choose palette → choose logo → fill fields (with the card grouping rules) → write the SVG → convert to PNG.

A deterministic generator, `assets/build-hero.js`, also ships: it renders a hero
straight from metadata (deriving a palette from the plugin name) and is the
reference implementation of the conversion chain in §4. It is a convenience and
the conversion engine; the **authored-from-skeleton** path is the standard for a
bespoke hero, and either way the conversion method is the same.

## 2. What varies per plugin (and ONLY this)

Everything else — the layout skeleton, the chrome, the conversion engine — is
fixed. Three things are the plugin's own:

1. **Palette (the degradé).** Three gradient stops `C1`→`C2`→`C3` (start→mid→end).
   They feed every `<defs>` gradient and accent (header dots, counts, the
   gradient headline line, the eyebrow, the version pill, active row/pill tints,
   the logo). Pick a coherent, distinct three-stop gradient legible on the
   `#070b10` charcoal; replace the example stops consistently everywhere. The
   chrome stays fixed: bg `#070b10`, bar `#0b1118`, text `#eef2f6`, muted
   `#7c8a99`, dim `#566472`.
2. **Logo glyph** (the icon in the top-bar "button"). See §3.
3. **Field copy** — name, repo, version, tagline, eyebrow, headline, subhead,
   card items, footer metrics. Filled from the plugin's own files (the version
   pill **must** equal the `VERSION` file).

## 3. Logo gallery (the icon in the button)

The mark is a fixed outer neon frame + dark inner panel (the "button"); only the
**glyph inside** the `<g filter="url(#neon)">` wrapper varies. All glyphs are
drawn in the **100 × 100** mark space and colored from the palette
(`url(#markNode)` strokes; `C1`/`C2`/`C3` node fills). Default is `share`. To
use one, drop its markup into the wrapper; to invent one, draw a simple 2–4
primitive mark in the same space (the **escape hatch** — a custom `svgPath` or
inline SVG fragment).

**`share`** (default) — one left node connected to two right nodes:

```svg
<line x1="40" y1="50" x2="60" y2="38" stroke="url(#markNode)" stroke-width="4.5" stroke-linecap="round"/>
<line x1="40" y1="50" x2="60" y2="62" stroke="url(#markNode)" stroke-width="4.5" stroke-linecap="round"/>
<circle cx="38" cy="50" r="7" fill="C1"/>
<circle cx="62" cy="36" r="7" fill="C2"/>
<circle cx="62" cy="64" r="7" fill="C3"/>
```

**`nodes`** — a four-node mesh (two left, two right, cross-connected):

```svg
<line x1="38" y1="38" x2="62" y2="62" stroke="url(#markNode)" stroke-width="4" stroke-linecap="round"/>
<line x1="38" y1="62" x2="62" y2="38" stroke="url(#markNode)" stroke-width="4" stroke-linecap="round"/>
<circle cx="38" cy="38" r="6.5" fill="C1"/>
<circle cx="62" cy="38" r="6.5" fill="C2"/>
<circle cx="38" cy="62" r="6.5" fill="C2"/>
<circle cx="62" cy="62" r="6.5" fill="C3"/>
```

**`hexagon`** — a stroked hexagon with a center dot:

```svg
<path d="M50 30 L67 40 L67 60 L50 70 L33 60 L33 40 Z" fill="none" stroke="url(#markFrame)" stroke-width="4.5" stroke-linejoin="round"/>
<circle cx="50" cy="50" r="7" fill="C2"/>
```

**`spark`** — a four-point star / asterisk:

```svg
<line x1="50" y1="30" x2="50" y2="70" stroke="url(#markNode)" stroke-width="4.5" stroke-linecap="round"/>
<line x1="30" y1="50" x2="70" y2="50" stroke="url(#markNode)" stroke-width="4.5" stroke-linecap="round"/>
<line x1="36" y1="36" x2="64" y2="64" stroke="url(#markNode)" stroke-width="3.5" stroke-linecap="round"/>
<line x1="64" y1="36" x2="36" y2="64" stroke="url(#markNode)" stroke-width="3.5" stroke-linecap="round"/>
<circle cx="50" cy="50" r="6" fill="C2"/>
```

Replace `C1`/`C2`/`C3` with the plugin's palette hexes. The escape hatch
(a custom path/fragment) is the author's responsibility — keep it inside the
100×100 space and the `neon` wrapper so it inherits the glow.

## 4. Zero-dependency SVG → PNG methodology

The conversion **downloads nothing** and **never hard-fails**. Always write the
SVG first; then rasterize via a tiered fallback, taking the first that works:

1. **`sharp`** if already installed — `sharp(Buffer.from(svg)).resize(2400,1350).png().toFile(out)`.
2. else **`@resvg/resvg-js`** if installed — `new Resvg(svg,{fitTo:{mode:'width',value:2400}}).render().asPng()`.
3. else a **headless browser already on the machine** — Chrome / Chromium / Edge
   via `child_process.execFileSync(bin, ['--headless=new','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--default-background-color=00000000','--window-size=2400,1350',\`--screenshot=\${out}\`,\`file://\${html}\`])`, where `html` is a temp file wrapping the SVG as an `<img>` at 2400×1350.
4. else **print the manual step** and exit successfully: open `hero.svg` in a
   browser or vector editor and export `hero.png` at 2400×1350.

Both `require`s (`sharp`, `@resvg/resvg-js`) are **guarded** in `try/catch`, so
the plugin declares **no hard dependency** on either; the browser path uses only
what is present. `assets/build-hero.js` is the reference implementation of this
exact chain — the simplest way to convert an authored `hero.svg` is to let that
script's rasterizer run on it, or to run the same chain by hand.

## 5. Invariants

The canvas is **2400 × 1350**. The hero is **regenerable** — re-authoring (or
re-running `build-hero.js`) refreshes the image without touching prose. The hero
appears in **every** README, English and localized alike (`readme-skeleton.md`
§2); locales reference it as `../../assets/hero.png`. The **version pill string
equals the `VERSION` file** — drift is a defect. The authored SVG names no other
plugin and leaves no `[PLACEHOLDER]` behind. Card counts match the listed items
(`+N more` past 12, else `complete`).
