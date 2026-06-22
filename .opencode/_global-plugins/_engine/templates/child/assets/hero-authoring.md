# Authoring a hero from the skeleton

How to turn `hero.skeleton.svg` into **this plugin's** hero. You (an agent —
Claude, Codex, or OpenCode — at generate or adapt time) **read** the skeleton
and **author a new SVG**, filling its placeholders with the plugin's real data
and choosing its own palette and logo. The skeleton is a reference model, not a
script input: there is no deterministic renderer to run over it. When the SVG
is written, convert it to a PNG with the zero-dependency method below.

Reference: `hero-svg.md` (what each region is) and
`skills/_knowledge/hero-skeleton.md` (the standard + the logo gallery).

---

## Step 1 — Gather the plugin's data

Read it from the plugin's own files (do not invent):

- **name** ← `.claude-plugin/plugin.json` `name` (fallback `package.json` `name`).
- **slug** ← the kebab-case package/marketplace slug.
- **owner** ← `marketplace.json` owner, or `plugin.json` / `package.json` author. `repo = owner/slug` (just `slug` if no owner).
- **tagline** ← `plugin.json` `description`.
- **version** ← the `VERSION` file (fallback `package.json` `version`). The version pill **must** equal this.
- **agents** ← top-level names under `agents/` (`*.md` files or subdirectories).
- **skills** ← top-level names under `skills/` (and commands, if you fold them in). Skip `_*`/`.` entries.
- **providers** ← the resolved target set (which of `.claude` / `.codex` / `.opencode` the plugin ships).
- **license** ← `LICENSE` (e.g. `MIT`).

## Step 2 — Choose the palette (the degradé)

Pick **three** colors — `C1` (start), `C2` (mid), `C3` (end) — that fit the
plugin's identity. They flow left→right and feed the whole composition (see
`hero-svg.md` §2). Guidance:

- Use a coherent three-stop gradient (adjacent or harmonious hues), bright
  enough to read on the `#070b10` charcoal. The reference palette is
  blue→cyan→emerald (`#3b82f6` / `#22d3ee` / `#34d399`); pick something
  **distinct** so the plugin has its own look.
- Replace the three example stops in **every** `<defs>` entry consistently:
  `accent`, `accentH` (C1→C2→C3), `accentStroke` (C1→C3 @0.6α), `iconGlow`
  (C2/C3 tint), `heroGlow` (C2 @0.07), `markFrame` (C1→C3), `markNode`
  (C2→C3), and the inline node fills in the logo. Also update the active-row
  and active-pill tints (translucent C3) and the eyebrow/version colors (C2).
- Keep the **chrome** fixed: background `#070b10`, bar `#0b1118`, text
  `#eef2f6`, muted `#7c8a99`, dim `#566472`.
- A curated starting set (each is `C1 / C2 / C3`):
  `#3b82f6 #22d3ee #34d399` · `#8b5cf6 #d946ef #f59e0b` · `#6366f1 #ec4899 #f97316` ·
  `#14b8a6 #22c55e #a3e635` · `#0ea5e9 #6366f1 #a855f7` · `#f43f5e #fb7185 #fbbf24` ·
  `#06b6d4 #3b82f6 #8b5cf6` · `#10b981 #06b6d4 #6366f1` · `#ef4444 #f97316 #eab308` ·
  `#a855f7 #ec4899 #f43f5e` · `#22c55e #84cc16 #facc15` · `#0891b2 #2563eb #7c3aed`.

## Step 3 — Choose the logo glyph (the icon in the button)

The mark's outer frame + dark panel are fixed; only the **glyph** inside the
`<g filter="url(#neon)">` wrapper changes. Pick one of the built-in glyphs —
`share` (default), `nodes`, `hexagon`, `spark` — or draw your own. All glyphs
live in the **100 × 100** mark space and are colored from the palette. The full
markup for each built-in is in `skills/_knowledge/hero-skeleton.md` (the logo
gallery); copy the one you want into the wrapper. For a custom icon, draw a
simple 2–4 primitive mark in that space (strokes via `url(#markNode)`, accents
in C1/C2/C3) — keep it legible at small size.

## Step 4 — Fill the text fields

Replace every `[PLACEHOLDER]`:

- **title** → `<plugin name> — <tagline>`.
- **wordmark / repo / version** → name, `owner/slug`, `v<version>`. Nudge the `/`
  and repo `x` to follow the wordmark; resize the version pill so the label fits
  (right edge stays at 2336).
- **eyebrow** → a short, uppercase, wide-tracked tagline (≤ ~40 chars).
- **headline** → up to 3 lines distilled from the tagline; the **last line** keeps
  the gradient fill. Shorten to 1–2 lines if that reads better — drop a `<text>`
  line and shift the rest (108px apart) to stay balanced.
- **subhead** → one or two muted lines; bold a key phrase with `<tspan ...>`.
- **provider pills** → the providers; first one active. Widen each rect to its label.

### Grouping rule for the three cards

- **AGENTS card** → the plugin's agents. List up to **12**; if there are more,
  show 12 and set the trailer to `+K more` (K = count − 12). The **count** in the
  header and any footer count **must equal the real number**.
- **SKILLS card** → the plugin's skills (and commands, if you include them).
- **PROVIDERS card** → the resolved target set (e.g. `claude code` / `codex` / `opencode`).
- In each card, **row 0 is the highlighted/active row** (palette tint). Let the
  last visible rows fade (decreasing `opacity`, ramp `…,0.65,0.4,0.22`) so the
  list dissolves into the `cardFade` mask. If a kind has ≤ 12 items and you list
  them all, set the trailer to `complete`.

### Footer

Pick metrics that matter (provider count, skill/agent counts, a one-word
tagline, the license, the repo). Keep groups **justified** across `L=64…R=2336`
with a separator centered in each gap; redistribute the `x` positions evenly if
you change the number of groups. The repo is right-aligned at 2336.

## Step 5 — Write the SVG, then convert to PNG (zero dependencies)

1. Write the authored SVG to **`assets/hero.svg`** (canvas stays 2400 × 1350).
2. Rasterize to **`assets/hero.png`** with the documented, no-download method —
   the same tiered fallback `assets/build-hero.js` implements, in order:
   - `require('sharp')` → `sharp(Buffer.from(svg)).resize(2400,1350).png().toFile('assets/hero.png')`
   - else `require('@resvg/resvg-js')` → `new Resvg(svg,{fitTo:{mode:'width',value:2400}}).render().asPng()`
   - else **headless browser** (Chrome / Chromium / Edge) via `execFileSync` with
     `--headless=new --screenshot=assets/hero.png` against a temp HTML that wraps
     the SVG as an `<img>` at 2400×1350.
   - else **print the manual step** and exit successfully (never hard-fail):
     "open `assets/hero.svg` in a browser or vector editor and export
     `assets/hero.png` at 2400×1350."

   **Never add a hard npm dependency** — both `require`s are guarded; the
   browser path uses only what's already on the machine. The simplest way to do
   the conversion is to let the seeded `assets/build-hero.js` rasterizer run on
   your `hero.svg` (its renderer is unchanged and implements exactly this chain);
   or run the same chain yourself. See `assets/README.md` and
   `skills/_knowledge/hero-skeleton.md` for the full methodology.

## Invariants (check before you finish)

- Canvas is **2400 × 1350**; the file is valid, self-contained SVG.
- The hero is referenced in **every** README — root `assets/hero.png`, each
  `docs/<locale>/README.md` as `../../assets/hero.png`.
- The **version pill string equals the `VERSION` file**.
- No leftover `[PLACEHOLDER]` tokens; no reference to any other plugin.
- Card counts match the listed items; trailers are `+K more` or `complete`.
