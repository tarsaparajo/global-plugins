'use strict';

// Generates assets/hero.svg for THIS plugin, then best-effort rasterizes assets/hero.png.
// Run: node assets/build-hero.js   (writes assets/hero.svg, and assets/hero.png when a rasterizer is present)
//
// Zero hard dependencies. Inputs are auto-derived from this plugin's own repo:
//   name / tagline / version <- .claude-plugin/plugin.json (fallback package.json), VERSION
//   owner                    <- marketplace.json owner / plugin.json author (fallback "")
//   counts + items           <- this repo's agents/, skills/, and resolved provider set
//   palette (the degrade)    <- derived DETERMINISTICALLY from the plugin name, so every
//                               plugin gets its own color identity and the same plugin always
//                               regenerates the same one. Override with assets/hero.config.json.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const W = 2400;
const H = 1350;

// --- Read the plugin's own metadata --------------------------------------
function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}
function firstString(...vals) {
  for (const v of vals) { if (typeof v === 'string' && v.trim()) return v.trim(); }
  return '';
}
function listNames(dir) {
  // Top-level capability names: *.md files (commands/agents) or subdir names (skills).
  const base = path.join(ROOT, dir);
  let out = [];
  try {
    for (const e of fs.readdirSync(base, { withFileTypes: true })) {
      if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
      if (e.isDirectory()) out.push(e.name);
      else if (e.name.endsWith('.md')) out.push(e.name.replace(/\.md$/, ''));
    }
  } catch { /* dir absent */ }
  return out.sort();
}

const pluginJson = readJSON(path.join(ROOT, '.claude-plugin', 'plugin.json'));
const pkgJson = readJSON(path.join(ROOT, 'package.json'));
const marketJson = readJSON(path.join(ROOT, '.claude-plugin', 'marketplace.json')) || readJSON(path.join(ROOT, 'marketplace.json'));
const heroConfig = readJSON(path.join(__dirname, 'hero.config.json')) || {};

const NAME = firstString(pluginJson && pluginJson.name, pkgJson && pkgJson.name, 'plugin');
const TAGLINE = firstString(pluginJson && pluginJson.description, pkgJson && pkgJson.description, '');
const VERSION = firstString(
  (() => { try { return fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8'); } catch { return ''; } })(),
  pkgJson && pkgJson.version, '0.1.0',
);
const OWNER = firstString(
  marketJson && marketJson.owner && (marketJson.owner.name || marketJson.owner),
  pluginJson && pluginJson.author && (pluginJson.author.name || pluginJson.author),
  pkgJson && pkgJson.author && (pkgJson.author.name || pkgJson.author),
  '',
);
const REPO = OWNER ? `${OWNER}/${NAME}` : NAME;

const AGENTS = listNames('agents');
const SKILLS = listNames('skills');
// Providers this plugin ships, inferred from the committed projection dotfolders.
const PROVIDER_MAP = [['.claude', 'claude code'], ['.codex', 'codex'], ['.opencode', 'opencode']];
const PROVIDERS = PROVIDER_MAP.filter(([d]) => fs.existsSync(path.join(ROOT, d))).map(([, label]) => label);

// --- Palette: a per-plugin color identity --------------------------------
// Curated three-stop gradients. The plugin name picks one deterministically, so
// heroes are distinct across plugins but stable across regenerations of one plugin.
const PALETTES = [
  ['#3b82f6', '#22d3ee', '#34d399'], // blue -> cyan -> emerald
  ['#8b5cf6', '#d946ef', '#f59e0b'], // violet -> fuchsia -> amber
  ['#6366f1', '#ec4899', '#f97316'], // indigo -> pink -> coral
  ['#14b8a6', '#22c55e', '#a3e635'], // teal -> green -> lime
  ['#0ea5e9', '#6366f1', '#a855f7'], // sky -> indigo -> purple
  ['#f43f5e', '#fb7185', '#fbbf24'], // rose -> salmon -> gold
  ['#06b6d4', '#3b82f6', '#8b5cf6'], // cyan -> blue -> violet
  ['#10b981', '#06b6d4', '#6366f1'], // emerald -> cyan -> indigo
  ['#ef4444', '#f97316', '#eab308'], // red -> orange -> yellow
  ['#a855f7', '#ec4899', '#f43f5e'], // purple -> pink -> rose
  ['#22c55e', '#84cc16', '#facc15'], // green -> lime -> amber
  ['#0891b2', '#2563eb', '#7c3aed'], // teal-blue -> blue -> violet
];
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pickPalette() {
  if (Array.isArray(heroConfig.palette) && heroConfig.palette.length === 3) return heroConfig.palette;
  return PALETTES[hashString(NAME) % PALETTES.length];
}
const [C1, C2, C3] = pickPalette();          // gradient stops (start -> mid -> end)
const ACCENT_HEX = C2;                        // single-color accent (dots/numbers)
const ACTIVE_TINT = C3;                       // active-row tint base

// Palette-derived rgba helper (the active row uses a translucent end-stop tint).
function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [52, 211, 153];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

// Palette (chrome stays neutral; only the accents follow the plugin identity)
const BG = '#070b10';
const BG_BAR = '#0b1118';
const TEXT = '#eef2f6';
const MUTED = '#7c8a99';
const DIM = '#566472';
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "Menlo, 'Andale Mono', monospace";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// --- Card model -----------------------------------------------------------
function card(x, title, count, items) {
  const cardW = 406;
  const top = 180;
  const cardH = 1010;
  const innerX = x + 24;
  const rowW = 358;
  let s = '';

  s += `<rect x="${x}" y="${top}" width="${cardW}" height="${cardH}" rx="18" fill="rgba(238,242,246,0.025)" stroke="rgba(238,242,246,0.10)" stroke-width="1.5"/>`;
  s += `<circle cx="${innerX + 22}" cy="222" r="7" fill="url(#accent)"/>`;
  s += `<text x="${innerX + 44}" y="232" font-family="${MONO}" font-size="27" font-weight="bold" letter-spacing="3" fill="${TEXT}">${esc(title)}</text>`;
  s += `<text x="${x + cardW - 34}" y="236" text-anchor="end" font-family="${MONO}" font-size="42" fill="url(#accent)">${esc(String(count))}</text>`;
  s += `<line x1="${innerX + 16}" y1="268" x2="${x + cardW - 34}" y2="268" stroke="rgba(238,242,246,0.18)" stroke-width="2" stroke-dasharray="2 8"/>`;

  const fades = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.65, 0.4, 0.22];
  items.slice(0, 12).forEach((it, i) => {
    const ry = 292 + i * 68;
    const op = fades[i] != null ? fades[i] : 0.18;
    const active = i === 0;
    const rowFill = active ? rgba(ACTIVE_TINT, 0.08) : 'rgba(238,242,246,0.035)';
    const rowStroke = active ? 'url(#accentStroke)' : 'rgba(238,242,246,0.05)';
    const dot = active ? 'url(#accent)' : '#4a5663';
    const txt = active ? rgba(ACTIVE_TINT, 0.95) : '#c4ccd6';
    s += `<g opacity="${op}">`;
    s += `<rect x="${innerX}" y="${ry}" width="${rowW}" height="54" rx="10" fill="${rowFill}" stroke="${rowStroke}" stroke-width="1.5"/>`;
    s += `<circle cx="${innerX + 24}" cy="${ry + 27}" r="5" fill="${dot}"/>`;
    s += `<text x="${innerX + 42}" y="${ry + 35}" font-family="${MONO}" font-size="24" fill="${txt}">${esc(it)}</text>`;
    s += `</g>`;
  });

  s += `<rect x="${x + 2}" y="950" width="${cardW - 4}" height="238" rx="16" fill="url(#cardFade)"/>`;
  const more = count > 12 ? count - 12 : 0;
  if (more > 0) {
    s += `<text x="${x + cardW / 2}" y="1148" text-anchor="middle" font-family="${MONO}" font-size="26" fill="${DIM}">+ ${more} more</text>`;
  } else {
    s += `<text x="${x + cardW / 2}" y="1148" text-anchor="middle" font-family="${MONO}" font-size="26" fill="${DIM}">complete</text>`;
  }
  return s;
}

// --- Provider pill --------------------------------------------------------
function pill(x, y, label, active) {
  const w = 28 + label.length * 16.5;
  const fill = active ? rgba(ACTIVE_TINT, 0.10) : 'rgba(238,242,246,0.03)';
  const stroke = active ? 'url(#accentStroke)' : 'rgba(238,242,246,0.14)';
  const txt = active ? rgba(ACTIVE_TINT, 0.92) : '#9aa6b2';
  let s = `<rect x="${x}" y="${y}" width="${w}" height="52" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  s += `<text x="${x + w / 2}" y="${y + 34}" text-anchor="middle" font-family="${MONO}" font-size="26" fill="${txt}">${esc(label)}</text>`;
  return { svg: s, next: x + w + 18 };
}

function pillRow(startX, y, labels, activeFirst) {
  let s = '';
  let cx = startX;
  labels.forEach((l, i) => {
    const p = pill(cx, y, l, activeFirst && i === 0);
    s += p.svg;
    cx = p.next;
  });
  return s;
}

// --- Footer metric --------------------------------------------------------
function metric(x, big, label, kind) {
  let s = '';
  let end;
  if (kind === 'grad') {
    s += `<text x="${x}" y="1290" font-family="${MONO}" font-size="40" font-weight="bold" fill="url(#accentH)">${esc(big)}</text>`;
    end = x + big.length * 25;
  } else {
    s += `<text x="${x}" y="1290" font-family="${MONO}" font-size="44" font-weight="bold" fill="url(#accentH)">${esc(big)}</text>`;
    const bigW = big.length * 27 + 16;
    if (label) {
      s += `<text x="${x + bigW}" y="1290" font-family="${MONO}" font-size="21" letter-spacing="2" fill="${MUTED}">${esc(label)}</text>`;
    }
    end = x + bigW + (label ? label.length * 12.5 : 0);
  }
  return { svg: s, next: end };
}

function separator(x) {
  return `<line x1="${x}" y1="1262" x2="${x}" y2="1296" stroke="rgba(238,242,246,0.14)" stroke-width="1.5"/>`;
}

// --- Headline wrapping ----------------------------------------------------
// Wrap the tagline (or a default) into up to three lines for the hero copy.
function wrapHeadline(text, perLine, maxLines) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > perLine && cur) { lines.push(cur); cur = w; }
    else { cur = (cur ? cur + ' ' : '') + w; }
    if (lines.length === maxLines - 1 && (cur + ' ').length > perLine) break;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

// --- Assemble -------------------------------------------------------------
let svg = '';
svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t">`;
svg += `<title id="t">${esc(NAME)}${TAGLINE ? ' — ' + esc(TAGLINE) : ''}</title>`;

// Defs (gradients are the plugin's palette)
svg += `<defs>`;
svg += `<linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C1}"/><stop offset="0.5" stop-color="${C2}"/><stop offset="1" stop-color="${C3}"/></linearGradient>`;
svg += `<linearGradient id="accentH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C1}"/><stop offset="0.5" stop-color="${C2}"/><stop offset="1" stop-color="${C3}"/></linearGradient>`;
svg += `<linearGradient id="accentStroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${rgba(C1, 0.6)}"/><stop offset="1" stop-color="${rgba(C3, 0.6)}"/></linearGradient>`;
svg += `<radialGradient id="iconGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${rgba(C2, 0.40)}"/><stop offset="0.6" stop-color="${rgba(C3, 0.16)}"/><stop offset="1" stop-color="${rgba(C2, 0)}"/></radialGradient>`;
svg += `<filter id="neon" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
svg += `<filter id="neonSoft" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
svg += `<radialGradient id="heroGlow" cx="0.3" cy="0.35" r="0.6"><stop offset="0" stop-color="${rgba(C2, 0.07)}"/><stop offset="1" stop-color="${rgba(C2, 0)}"/></radialGradient>`;
svg += `<linearGradient id="markFrame" x1="18" y1="14" x2="82" y2="86" gradientUnits="userSpaceOnUse"><stop stop-color="${C1}"/><stop offset="1" stop-color="${C3}"/></linearGradient>`;
svg += `<linearGradient id="markNode" x1="24" y1="24" x2="72" y2="72" gradientUnits="userSpaceOnUse"><stop stop-color="${C2}"/><stop offset="1" stop-color="${C3}"/></linearGradient>`;
svg += `<linearGradient id="cardFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(7,11,16,0)"/><stop offset="0.55" stop-color="rgba(7,11,16,0.82)"/><stop offset="1" stop-color="rgba(7,11,16,0.97)"/></linearGradient>`;
svg += `<pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(238,242,246,0.03)" stroke-width="1"/></pattern>`;
svg += `<linearGradient id="gridMask" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgba(7,11,16,1)"/><stop offset="0.42" stop-color="rgba(7,11,16,0)"/></linearGradient>`;
svg += `</defs>`;

// Background
svg += `<rect width="${W}" height="${H}" fill="${BG}"/>`;
svg += `<rect x="0" y="115" width="${W}" height="${H - 115}" fill="url(#grid)"/>`;
svg += `<rect x="0" y="115" width="${W}" height="${H - 115}" fill="url(#gridMask)"/>`;
svg += `<ellipse cx="520" cy="470" rx="760" ry="520" fill="url(#heroGlow)"/>`;

// Top bar
svg += `<rect x="0" y="0" width="${W}" height="115" fill="${BG_BAR}"/>`;
svg += `<line x1="0" y1="115" x2="${W}" y2="115" stroke="rgba(238,242,246,0.07)" stroke-width="1.5"/>`;
svg += `<circle cx="100" cy="58" r="62" fill="url(#iconGlow)"/>`;
// Logo mark: glowing rounded frame + dark inner panel + share glyph.
svg += `<g transform="translate(54,12) scale(0.88)">`;
svg += `<g filter="url(#neonSoft)">`;
svg += `<rect x="10" y="10" width="80" height="80" rx="26" fill="rgba(8,12,20,0.7)" stroke="url(#markFrame)" stroke-width="4"/>`;
svg += `</g>`;
svg += `<rect x="20" y="20" width="60" height="60" rx="19" fill="#070b12" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
svg += `<g filter="url(#neon)">`;
svg += `<line x1="40" y1="50" x2="60" y2="38" stroke="url(#markNode)" stroke-width="4.5" stroke-linecap="round"/>`;
svg += `<line x1="40" y1="50" x2="60" y2="62" stroke="url(#markNode)" stroke-width="4.5" stroke-linecap="round"/>`;
svg += `<circle cx="38" cy="50" r="7" fill="${C1}"/>`;
svg += `<circle cx="62" cy="36" r="7" fill="${C2}"/>`;
svg += `<circle cx="62" cy="64" r="7" fill="${C3}"/>`;
svg += `</g>`;
svg += `</g>`;
const wordmark = NAME;
svg += `<text x="162" y="68" font-family="${SANS}" font-size="33" font-weight="bold" letter-spacing="0.3" fill="${TEXT}">${esc(wordmark)}</text>`;
const wmW = 162 + wordmark.length * 19 + 28;
svg += `<text x="${wmW}" y="68" font-family="${SANS}" font-size="29" fill="#4a5663">/</text>`;
svg += `<text x="${wmW + 28}" y="68" font-family="${SANS}" font-size="29" fill="#8c97a3">${esc(REPO)}</text>`;
// Version pill — right edge anchored at the content edge (2336).
(function versionPill() {
  const label = `v${VERSION}`;
  const fontSize = 26;
  const letterSpacing = 1;
  const textW = label.length * (fontSize * 0.6) + (label.length - 1) * letterSpacing;
  const dotPad = 30;
  const dotGap = 18;
  const rightPad = 28;
  const pillRight = 2336;
  const pillW = dotPad + 12 + dotGap + textW + rightPad;
  const pillX = pillRight - pillW;
  svg += `<rect x="${pillX}" y="29" width="${pillW}" height="56" rx="28" fill="#10171f" stroke="${rgba(C1, 0.35)}" stroke-width="1.5"/>`;
  svg += `<circle cx="${pillX + dotPad}" cy="57" r="6" fill="${C3}"/>`;
  svg += `<text x="${pillX + dotPad + 12 + dotGap}" y="66" font-family="${MONO}" font-size="${fontSize}" letter-spacing="${letterSpacing}" fill="${C2}">${esc(label)}</text>`;
})();

// Left column — eyebrow + headline derived from the plugin's name + tagline.
const eyebrow = (NAME + '').toUpperCase();
svg += `<rect x="64" y="187" width="64" height="5" rx="2.5" fill="url(#accentH)"/>`;
svg += `<text x="148" y="200" font-family="${MONO}" font-size="24" letter-spacing="6" fill="${C2}" opacity="0.92">${esc(eyebrow.slice(0, 40))}</text>`;
const headline = wrapHeadline(TAGLINE || NAME, 22, 3);
const baseY = 330 - (3 - headline.length) * 54;
headline.forEach((line, i) => {
  const last = i === headline.length - 1;
  const fill = last ? 'url(#accentH)' : TEXT;
  svg += `<text x="62" y="${baseY + i * 108}" font-family="${SANS}" font-size="106" font-weight="bold" letter-spacing="-2" fill="${fill}">${esc(line)}</text>`;
});
const subY = baseY + headline.length * 108 - 8;
if (TAGLINE && TAGLINE !== headline.join(' ')) {
  svg += `<text x="64" y="${subY + 40}" font-family="${SANS}" font-size="33" fill="${MUTED}">${esc(TAGLINE.slice(0, 64))}</text>`;
}
if (PROVIDERS.length) {
  svg += `<text x="64" y="755" font-family="${MONO}" font-size="22" letter-spacing="5" fill="#6b7682">RUNS ON</text>`;
  svg += pillRow(64, 783, PROVIDERS.map((p) => p.replace(/\b\w/g, (c) => c.toUpperCase())), true);
}

// Cards — this plugin's own AGENTS, SKILLS, and PROVIDERS.
svg += card(1064, 'AGENTS', AGENTS.length, AGENTS.length ? AGENTS : ['—']);
svg += card(1497, 'SKILLS', SKILLS.length, SKILLS.length ? SKILLS : ['—']);
svg += card(1930, 'PROVIDERS', PROVIDERS.length, PROVIDERS.length ? PROVIDERS : ['—']);

// Footer
svg += `<line x1="64" y1="1232" x2="2336" y2="1232" stroke="rgba(238,242,246,0.08)" stroke-width="1.5"/>`;
(function footer() {
  const L = 64;
  const R = 2336;
  const groups = [
    { kind: 'num', big: String(PROVIDERS.length || 0), label: 'PROVIDERS', w: 1 * 28 + 9 * 9 + 30 },
    { kind: 'num', big: String(SKILLS.length || 0), label: 'SKILLS', w: 1 * 28 + 6 * 12.5 + 30 },
    { kind: 'num', big: String(AGENTS.length || 0), label: 'AGENTS', w: 1 * 28 + 6 * 12.5 + 30 },
    { kind: 'grad', big: 'SELF-EVOLVING', w: 13 * 25 },
    { kind: 'repo', big: REPO, w: REPO.length * 14.5 },
  ];
  const totalW = groups.reduce((a, g) => a + g.w, 0);
  const gap = (R - L - totalW) / (groups.length - 1);
  let x = L;
  groups.forEach((g, i) => {
    if (g.kind === 'repo') {
      svg += `<text x="${R}" y="1290" text-anchor="end" font-family="${MONO}" font-size="25" letter-spacing="1" fill="#8c97a3">${esc(g.big)}</text>`;
    } else {
      const mm = metric(x, g.big, g.label || '', g.kind);
      svg += mm.svg;
    }
    if (i < groups.length - 1) {
      const sepX = x + g.w + gap / 2;
      svg += separator(sepX);
    }
    x += g.w + gap;
  });
})();

svg += `</svg>`;

// --- Write SVG ------------------------------------------------------------
const svgOut = path.join(__dirname, 'hero.svg');
fs.writeFileSync(svgOut, svg);
console.log('wrote', svgOut, '(' + svg.length + ' bytes, palette', [C1, C2, C3].join(' '), ')');

// --- Best-effort PNG. Never hard-fail: a missing rasterizer must not break the build.
(async () => {
  const pngOut = path.join(__dirname, 'hero.png');
  try {
    const sharp = require('sharp');
    await sharp(Buffer.from(svg)).resize(W, H).png().toFile(pngOut);
    return console.log('wrote', pngOut, '(sharp)');
  } catch { /* sharp not installed */ }
  try {
    const { Resvg } = require('@resvg/resvg-js');
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
    fs.writeFileSync(pngOut, png);
    return console.log('wrote', pngOut, '(@resvg/resvg-js)');
  } catch { /* resvg not installed */ }
  try {
    const { execFileSync } = require('child_process');
    const os = require('os');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hero-'));
    const htmlPath = path.join(tmp, 'p.html');
    fs.writeFileSync(path.join(tmp, 'hero.svg'), svg);
    fs.writeFileSync(htmlPath, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}img{display:block;width:${W}px;height:${H}px}</style><img src="hero.svg">`);
    const candidates = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      'google-chrome', 'chromium', 'chromium-browser', 'msedge',
    ];
    for (const bin of candidates) {
      try {
        execFileSync(bin, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
          '--force-device-scale-factor=1', '--default-background-color=00000000',
          `--window-size=${W},${H}`, `--screenshot=${pngOut}`, `file://${htmlPath}`],
          { stdio: 'ignore' });
        if (fs.existsSync(pngOut)) return console.log('wrote', pngOut, '(headless chrome:', bin + ')');
      } catch { /* try next browser */ }
    }
  } catch { /* no browser available */ }
  console.log('hero.svg written; no SVG rasterizer found (sharp / @resvg/resvg-js / headless Chrome).');
  console.log(`To produce hero.png: install one (npm i -D sharp) and re-run, or open hero.svg in a`);
  console.log(`browser or vector editor and export hero.png at ${W}x${H}.`);
})();
