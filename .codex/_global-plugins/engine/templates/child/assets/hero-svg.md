# Hero SVG — line-by-line

A region-by-region reading of `hero.skeleton.svg`. It tells you, for every
element, **what it renders** and **which field or knob fills it**. Read it
alongside the skeleton; then use `hero-authoring.md` for the step-by-step
authoring flow. The standard is `knowledge/hero-skeleton.md`.

The hero is one banner, **2400 × 1350**, dark (charcoal) with a single accent
gradient (the *degradé*) that the whole composition is tuned around. Only two
things change per plugin: the **palette** (the three gradient stops) and the
**logo** glyph; everything else is fixed skeleton, with text fields swapped for
this plugin's copy.

---

## 1. Canvas

```
<svg ... width="2400" height="1350" viewBox="0 0 2400 1350" role="img" aria-labelledby="t">
<title id="t">[PLUGIN NAME] — [TAGLINE]</title>
```

- **`viewBox="0 0 2400 1350"`** — the coordinate space. 16:9; large enough to stay retina-crisp at full README width. **Keep it.** Every coordinate below is in this space.
- **`role="img"` + `<title>`** — accessibility. The `<title>` is the accessible name; it does not render visually. Fill it `<plugin name> — <tagline>`.

## 2. `<defs>` — the palette lives here

Every gradient/filter/pattern is defined once and referenced by `url(#id)`. **The palette is the only thing you change in this block** — replace the three example stops (`#3b82f6` / `#22d3ee` / `#34d399`) everywhere with your `C1` / `C2` / `C3`, keeping the structure.

| id | type | palette stops | renders |
| --- | --- | --- | --- |
| `accent` | linear, diagonal | C1 → C2 → C3 | card header dots/counts, row-0 dot — the "brand" gradient |
| `accentH` | linear, horizontal | C1 → C2 → C3 | the gradient headline line, eyebrow tick, footer numbers/words |
| `accentStroke` | linear, horizontal | C1 → C3 @ 0.6α | the stroke around active pills/rows |
| `iconGlow` | radial | C2 / C3 tint | the halo behind the logo mark |
| `heroGlow` | radial | C2 @ 0.07 | the faint glow ellipse over the left half |
| `neon` | filter (blur+merge) | — | glow on the logo glyph |
| `neonSoft` | filter (blur+merge) | — | softer glow on the logo frame |
| `markFrame` | linear (userSpace) | C1 → C3 | the logo's outer rounded frame stroke |
| `markNode` | linear (userSpace) | C2 → C3 | the logo glyph's connector strokes |
| `cardFade` | linear, vertical | charcoal 0→0.97 | the fade mask at the bottom of each card |
| `grid` | pattern | — | the 80px background grid lines |
| `gridMask` | linear, horizontal | charcoal | wipes the grid out toward the left (so it fades in from the right) |

The chrome colors are **fixed, not palette-derived**: background `#070b10`, top bar `#0b1118`, primary text `#eef2f6`, muted `#7c8a99`, dim `#566472`. Leave them.

## 3. Background

```
<rect width="2400" height="1350" fill="#070b10"/>             ← base charcoal
<rect ... y="115" ... fill="url(#grid)"/>                      ← grid, below the top bar
<rect ... y="115" ... fill="url(#gridMask)"/>                  ← fade the grid out to the left
<ellipse cx="520" cy="470" rx="760" ry="520" fill="url(#heroGlow)"/>  ← soft glow under the headline
```

Fixed skeleton — nothing to fill. The glow picks up the palette via `heroGlow`.

## 4. Top bar (y = 0…115)

```
<rect ... height="115" fill="#0b1118"/>            ← the bar
<line y1="115" .../>                                ← hairline under it
<circle cx="100" cy="58" r="62" fill="url(#iconGlow)"/>  ← halo behind the mark
```

### Logo mark (the "button") — the LOGO knob

Drawn in a **100 × 100 local space**, translated to `(54,12)` and scaled `0.88`, vertically centered in the bar:

```
<g filter="url(#neonSoft)"><rect ... rx="26" stroke="url(#markFrame)" .../></g>  ← outer neon frame  (FIXED)
<rect x="20" y="20" width="60" height="60" rx="19" fill="#070b12" .../>          ← dark inner panel  (FIXED)
<g filter="url(#neon)"> … glyph … </g>                                          ← the ICON           (THE KNOB)
```

The **frame + panel are fixed** — they are the "button." The **glyph inside is the knob.** The default is the *share* glyph (one left node connected by two strokes to two right nodes), colored C1/C2/C3:

```
<line x1="40" y1="50" x2="60" y2="38" stroke="url(#markNode)" .../>   connector
<line x1="40" y1="50" x2="60" y2="62" stroke="url(#markNode)" .../>   connector
<circle cx="38" cy="50" r="7" fill="#3b82f6"/>   left  node → C1
<circle cx="62" cy="36" r="7" fill="#22d3ee"/>   upper node → C2
<circle cx="62" cy="64" r="7" fill="#34d399"/>   lower node → C3
```

Swap this for another built-in glyph (`nodes` / `hexagon` / `spark`) or your own path/inline SVG — keep it inside the `<g filter="url(#neon)">` wrapper, inside the 100×100 space, and color it from the palette. See the **logo gallery** in `knowledge/hero-skeleton.md`.

### Wordmark, repo, version pill

```
<text x="162" y="68" ... fill="#eef2f6">[PLUGIN NAME]</text>        ← wordmark
<text x="410" y="68" ... fill="#4a5663">/</text>                    ← separator
<text x="438" y="68" ... fill="#8c97a3">[OWNER]/[PLUGIN-SLUG]</text> ← repo path
<rect x="1966.8" y="29" width="369.2" height="56" rx="28" .../>      ← version pill (right-anchored at 2336)
<circle cx="1996.8" cy="57" r="6" fill="#34d399"/>                  ← status dot → C3
<text x="2026.8" y="66" ... fill="#22d3ee">v[X.Y.Z]</text>           ← version → C2; MUST equal the VERSION file
```

Move the `/` and repo `x` to sit just after your wordmark (advance ≈ name length × 19px at 33pt). Resize/reposition the pill rect so the label fits with padding; the pill's right edge stays at **2336** (the content right edge).

## 5. Left column

```
<rect x="64" y="187" width="64" height="5" fill="url(#accentH)"/>   ← gradient tick
<text x="148" y="200" ... fill="#22d3ee">[EYEBROW · SHORT TAGLINE]</text>  ← eyebrow (mono, wide tracking)
```

**Headline** — up to three lines at 106pt; the **last line uses the gradient fill** (`url(#accentH)`), the others are `#eef2f6`:

```
<text x="62" y="330" ... fill="#eef2f6">[HEADLINE LINE 1]</text>
<text x="62" y="438" ... fill="#eef2f6">[HEADLINE LINE 2]</text>
<text x="62" y="546" ... fill="url(#accentH)">[HEADLINE LINE 3]</text>
```

If your headline is shorter, drop a line and move the rest down so the block stays vertically balanced (lines are 108px apart). **Subhead** — one or two muted lines; you may bold a key phrase with `<tspan fill="#eef2f6" font-weight="bold">…</tspan>`:

```
<text x="64" y="620" ... fill="#7c8a99">[ONE-LINE SUBHEAD …]</text>
<text x="64" y="666" ... fill="#7c8a99">[SUBHEAD CONTINUED …]</text>
```

**Provider pills** — a label then a row of pills. The **first pill is "active"** (palette tint + gradient stroke); the rest are neutral. Widen each rect to fit its label (≈ `28 + len×16.5` px):

```
<text x="64" y="755" ... fill="#6b7682">[RUNS ON / PROJECTS TO]</text>
<rect x="64"   y="783" ... fill="rgba(...,0.10)" stroke="url(#accentStroke)"/> <text ...>[PROVIDER 1]</text>  ← active
<rect x="291.5" y="783" ... neutral/>                                          <text ...>[PROVIDER 2]</text>
<rect x="420"  y="783" ... neutral/>                                           <text ...>[PROVIDER 3]</text>
```

## 6. The three cards (AGENTS · SKILLS · PROVIDERS)

Three identical shells at `x = 1064 / 1497 / 1930`, each `406 × 1010`, top `180`. The **titles are fixed** (`AGENTS`, `SKILLS`, `PROVIDERS`) — that is the canonical grouping. You fill the **count** and the **rows**. Per card:

```
<rect ... rx="18" .../>                                       ← shell
<circle cx="…" cy="222" r="7" fill="url(#accent)"/>           ← header dot → accent
<text  ... y="232" ...>AGENTS</text>                          ← title (fixed per card)
<text  ... y="236" text-anchor="end" fill="url(#accent)">[N]</text>  ← count → accent; MUST match item count
<line  ... y1="268" stroke-dasharray="2 8"/>                  ← dashed divider
```

**Rows** start at `y = 292`, each **68px** apart, up to **12** shown. **Row 0 is the active row** (palette tint fill + gradient stroke + accent dot + tinted text); the rest are neutral. The skeleton shows 4 solid rows + 1 faded; in a real hero you list the plugin's actual items and let the trailing ones fade via decreasing `opacity` (the renderer uses the ramp `1,1,1,1,1,1,1,1,1,0.65,0.4,0.22`).

```
<g opacity="1"><rect ... fill="rgba(...,0.08)" stroke="url(#accentStroke)"/><circle ... fill="url(#accent)"/><text ...>[AGENT 1]</text></g>  ← active
<g opacity="1"><rect ... neutral/><circle ... fill="#4a5663"/><text ...>[AGENT 2]</text></g>
…
```

**Bottom fade + trailer:**

```
<rect ... y="950" ... fill="url(#cardFade)"/>                 ← fades the last rows into the background
<text ... y="1148" text-anchor="middle" fill="#566472">[+[K] more / complete]</text>
```

Use `+K more` when the plugin has more than 12 of that kind (K = count − 12); otherwise `complete`.

## 7. Footer (y ≈ 1232…1296)

A hairline, then **justified metric groups** (space-between across `L=64 … R=2336`) with a vertical **separator** centered in each gap:

```
<line y1="1232" .../>                                          ← hairline
<text x="64"  ...>[N]</text> <text x="107" ...>[METRIC 1 LABEL]</text>      ← number + muted label
<line x1="327" .../>                                                       ← separator
<text x="451" ...>[N]</text> <text x="494" ...>[METRIC 2 LABEL]</text>
<line x1="933" .../>
<text x="1057" ... fill="url(#accentH)">[TAGLINE WORD]</text>               ← a single gradient word
<line x1="1506" .../>
<text x="1630" ... fill="url(#accentH)">[LICENSE]</text>
<line x1="1835" .../>
<text x="2336" text-anchor="end" ...>[OWNER]/[PLUGIN-SLUG]</text>           ← right-aligned repo
```

Three kinds of group: **number + label** (`[N] [LABEL]`), **single gradient word** (`SELF-EVOLVING`-style tagline or `MIT`-style license), and the **right-aligned repo**. Pick metrics that matter for the plugin; keep them justified and the separators centered in the gaps. If you change the number/width of groups, redistribute the `x` positions evenly.

## 8. Field → region cross-reference

| Field / knob | Region(s) |
| --- | --- |
| **palette** (degradé) | §2 defs — feeds the whole composition |
| **logo glyph** | §4 logo mark (inside the fixed frame/panel) |
| plugin name | §1 title, §4 wordmark |
| owner / slug (repo) | §4 repo path, §7 footer repo |
| version | §4 version pill (= VERSION file) |
| tagline / eyebrow / headline / subhead | §1 title, §5 |
| provider set | §5 pills, §6 PROVIDERS card |
| agents | §6 AGENTS card (count + rows) |
| skills / commands | §6 SKILLS card (count + rows) |
| footer metrics / license | §7 |

Everything not in this table is **fixed skeleton** — leave it. Next: `hero-authoring.md` for the authoring sequence, and `knowledge/hero-skeleton.md` for the logo gallery and the zero-dependency SVG→PNG conversion.
