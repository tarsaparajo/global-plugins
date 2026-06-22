'use strict';

// Generates assets/hero.svg — the Global Plugins dashboard hero banner.
// 2400x1350, deep charcoal background, blue -> cyan -> emerald gradient identity.
// Run: node assets/build-hero.js   (writes assets/hero.svg)

const fs = require('fs');
const path = require('path');

const W = 2400;
const H = 1350;

// The version pill string MUST equal VERSION (knowledge/bump-protocol.md). Derive
// it from the VERSION file (the SemVer source of truth) instead of hardcoding —
// mirrors the child twin (templates/child/assets/build-hero.js). The month suffix
// is stamped from the build clock so re-running within a release month is idempotent.
const VERSION = (() => {
  try {
    return fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim();
  } catch {
    return '0.0.0';
  }
})();
const MONTH_YEAR = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

// Palette
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

  // Card shell
  s += `<rect x="${x}" y="${top}" width="${cardW}" height="${cardH}" rx="18" fill="rgba(238,242,246,0.025)" stroke="rgba(238,242,246,0.10)" stroke-width="1.5"/>`;
  // Header: dot + label + count
  s += `<circle cx="${innerX + 22}" cy="222" r="7" fill="url(#accent)"/>`;
  s += `<text x="${innerX + 44}" y="232" font-family="${MONO}" font-size="27" font-weight="bold" letter-spacing="3" fill="${TEXT}">${esc(title)}</text>`;
  s += `<text x="${x + cardW - 34}" y="236" text-anchor="end" font-family="${MONO}" font-size="42" fill="url(#accent)">${esc(String(count))}</text>`;
  // Dashed divider
  s += `<line x1="${innerX + 16}" y1="268" x2="${x + cardW - 34}" y2="268" stroke="rgba(238,242,246,0.18)" stroke-width="2" stroke-dasharray="2 8"/>`;

  // Rows: opacity fades for the trailing items
  const fades = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.65, 0.4, 0.22];
  items.slice(0, 12).forEach((it, i) => {
    const ry = 292 + i * 68;
    const op = fades[i] != null ? fades[i] : 0.18;
    const active = i === 0;
    const rowFill = active ? 'rgba(52,211,153,0.08)' : 'rgba(238,242,246,0.035)';
    const rowStroke = active ? 'url(#accentStroke)' : 'rgba(238,242,246,0.05)';
    const dot = active ? 'url(#accent)' : '#4a5663';
    const txt = active ? '#a7f3d8' : '#c4ccd6';
    s += `<g opacity="${op}">`;
    s += `<rect x="${innerX}" y="${ry}" width="${rowW}" height="54" rx="10" fill="${rowFill}" stroke="${rowStroke}" stroke-width="1.5"/>`;
    s += `<circle cx="${innerX + 24}" cy="${ry + 27}" r="5" fill="${dot}"/>`;
    s += `<text x="${innerX + 42}" y="${ry + 35}" font-family="${MONO}" font-size="24" fill="${txt}">${esc(it)}</text>`;
    s += `</g>`;
  });

  // Bottom fade mask + "+N more"
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
  const fill = active ? 'rgba(52,211,153,0.10)' : 'rgba(238,242,246,0.03)';
  const stroke = active ? 'url(#accentStroke)' : 'rgba(238,242,246,0.14)';
  const txt = active ? '#7fe7d0' : '#9aa6b2';
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
// kind: 'num' = big colored number + muted label; 'grad' = single gradient word.
function metric(x, big, label, kind) {
  let s = '';
  let end;
  if (kind === 'grad') {
    s += `<text x="${x}" y="1290" font-family="${MONO}" font-size="40" font-weight="bold" fill="url(#accentH)">${esc(big)}</text>`;
    end = x + big.length * 25;
  } else {
    const bigFill = big === 'MIT' ? 'url(#accentH)' : 'url(#accentH)';
    s += `<text x="${x}" y="1290" font-family="${MONO}" font-size="44" font-weight="bold" fill="${bigFill}">${esc(big)}</text>`;
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

// --- Assemble -------------------------------------------------------------
let svg = '';
svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t">`;
svg += `<title id="t">Global Plugins — one source, every provider</title>`;

// Defs
svg += `<defs>`;
svg += `<linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="0.5" stop-color="#22d3ee"/><stop offset="1" stop-color="#34d399"/></linearGradient>`;
svg += `<linearGradient id="accentH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b82f6"/><stop offset="0.5" stop-color="#22d3ee"/><stop offset="1" stop-color="#34d399"/></linearGradient>`;
svg += `<linearGradient id="accentStroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgba(59,130,246,0.6)"/><stop offset="1" stop-color="rgba(52,211,153,0.6)"/></linearGradient>`;
svg += `<radialGradient id="iconGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="rgba(34,211,238,0.40)"/><stop offset="0.6" stop-color="rgba(52,211,153,0.16)"/><stop offset="1" stop-color="rgba(34,211,238,0)"/></radialGradient>`;
// Neon glow filter for the logo mark frame and glyph.
svg += `<filter id="neon" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
svg += `<filter id="neonSoft" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
svg += `<radialGradient id="heroGlow" cx="0.3" cy="0.35" r="0.6"><stop offset="0" stop-color="rgba(34,211,238,0.07)"/><stop offset="1" stop-color="rgba(34,211,238,0)"/></radialGradient>`;
svg += `<linearGradient id="markFrame" x1="18" y1="14" x2="82" y2="86" gradientUnits="userSpaceOnUse"><stop stop-color="#3b82f6"/><stop offset="1" stop-color="#34d399"/></linearGradient>`;
svg += `<linearGradient id="markNode" x1="24" y1="24" x2="72" y2="72" gradientUnits="userSpaceOnUse"><stop stop-color="#22d3ee"/><stop offset="1" stop-color="#34d399"/></linearGradient>`;
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
// Strong neon halo behind the mark.
svg += `<circle cx="100" cy="58" r="62" fill="url(#iconGlow)"/>`;
// Logo mark: glowing rounded frame + dark inner panel + share glyph (one node -> two).
// Drawn in a 100x100 local space, scaled to ~88px, vertically centered in the 115px bar.
svg += `<g transform="translate(54,12) scale(0.88)">`;
// Outer glowing gradient frame (thick, neon).
svg += `<g filter="url(#neonSoft)">`;
svg += `<rect x="10" y="10" width="80" height="80" rx="26" fill="rgba(8,12,20,0.7)" stroke="url(#markFrame)" stroke-width="4"/>`;
svg += `</g>`;
// Dark inner panel.
svg += `<rect x="20" y="20" width="60" height="60" rx="19" fill="#070b12" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
// Share glyph with its own glow: left node connects to top-right and bottom-right nodes.
svg += `<g filter="url(#neon)">`;
svg += `<line x1="40" y1="50" x2="60" y2="38" stroke="url(#markNode)" stroke-width="4.5" stroke-linecap="round"/>`;
svg += `<line x1="40" y1="50" x2="60" y2="62" stroke="url(#markNode)" stroke-width="4.5" stroke-linecap="round"/>`;
svg += `<circle cx="38" cy="50" r="7" fill="#3b82f6"/>`;
svg += `<circle cx="62" cy="36" r="7" fill="#22d3ee"/>`;
svg += `<circle cx="62" cy="64" r="7" fill="#34d399"/>`;
svg += `</g>`;
svg += `</g>`;
svg += `<text x="162" y="68" font-family="${SANS}" font-size="33" font-weight="bold" letter-spacing="0.3" fill="${TEXT}">Global Plugins</text>`;
svg += `<text x="410" y="68" font-family="${SANS}" font-size="29" fill="#4a5663">/</text>`;
svg += `<text x="438" y="68" font-family="${SANS}" font-size="29" fill="#8c97a3">tarsaparajo/global-plugins</text>`;
// Version pill — right edge anchored at the content edge (2336), sized to fit
// the text with comfortable padding on both sides.
(function versionPill() {
  const label = `v${VERSION} · ${MONTH_YEAR}`;
  const fontSize = 26;
  const letterSpacing = 1;
  // mono glyph advance ~0.6em; add letter-spacing per gap.
  const textW = label.length * (fontSize * 0.6) + (label.length - 1) * letterSpacing;
  const dotPad = 30;   // left padding to the status dot
  const dotGap = 18;   // dot -> text
  const rightPad = 28; // text -> right edge
  const pillRight = 2336;
  const pillW = dotPad + 12 + dotGap + textW + rightPad;
  const pillX = pillRight - pillW;
  svg += `<rect x="${pillX}" y="29" width="${pillW}" height="56" rx="28" fill="#10171f" stroke="rgba(59,130,246,0.35)" stroke-width="1.5"/>`;
  svg += `<circle cx="${pillX + dotPad}" cy="57" r="6" fill="#34d399"/>`;
  svg += `<text x="${pillX + dotPad + 12 + dotGap}" y="66" font-family="${MONO}" font-size="${fontSize}" letter-spacing="${letterSpacing}" fill="#22d3ee">${esc(label)}</text>`;
})();

// Left column — eyebrow with a gradient tick to its left
svg += `<rect x="64" y="187" width="64" height="5" rx="2.5" fill="url(#accentH)"/>`;
svg += `<text x="148" y="200" font-family="${MONO}" font-size="24" letter-spacing="6" fill="#22d3ee" opacity="0.92">ONE SOURCE · EVERY PROVIDER</text>`;
svg += `<text x="62" y="330" font-family="${SANS}" font-size="106" font-weight="bold" letter-spacing="-2" fill="${TEXT}">Generate, adapt &amp;</text>`;
svg += `<text x="62" y="438" font-family="${SANS}" font-size="106" font-weight="bold" letter-spacing="-2" fill="${TEXT}">evolve plugins for</text>`;
svg += `<text x="62" y="546" font-family="${SANS}" font-size="106" font-weight="bold" letter-spacing="-2" fill="url(#accentH)">every provider.</text>`;
svg += `<text x="64" y="620" font-family="${SANS}" font-size="33" fill="${MUTED}">Author once in a canonical source. Project it everywhere —</text>`;
svg += `<text x="64" y="666" font-family="${SANS}" font-size="33" fill="${MUTED}">with self-evolution built in, <tspan fill="${TEXT}" font-weight="bold">not a copy per tool</tspan>.</text>`;
svg += `<text x="64" y="755" font-family="${MONO}" font-size="22" letter-spacing="5" fill="#6b7682">PROJECTS TO</text>`;
// Provider pills — the three CLI providers, all active.
svg += pillRow(64, 783, ['Claude Code', 'Codex', 'OpenCode'], true);

// Cards (SKILLS shows the 5 surface skills; evolve/migrate are child-injected)
svg += card(1064, 'AGENTS', 7, ['plugin-architect', 'provider-detector', 'capability-extractor', 'canonical-projector', 'compliance-validator', 'evolution-propagator', 'migration-analyzer']);
svg += card(1497, 'SKILLS', 7, ['generate', 'adapt', 'audit', 'validate', 'harness-lens', 'evolve', 'migrate']);
svg += card(1930, 'PROVIDERS', 3, ['claude code', 'codex', 'opencode']);

// Footer: five groups justified (space-between) across the full content width,
// with vertical separators centered in each gap.
svg += `<line x1="64" y1="1232" x2="2336" y2="1232" stroke="rgba(238,242,246,0.08)" stroke-width="1.5"/>`;
(function footer() {
  const L = 64;
  const R = 2336;
  // Each group: estimated rendered width (for gap distribution).
  const groups = [
    { kind: 'num', big: '3', label: 'PROVIDERS', w: 1 * 28 + 9 * 9 + 30 },
    { kind: 'num', big: '2', label: 'MODES (Generate · Adapt)', w: 1 * 28 + 24 * 12.5 + 30 },
    { kind: 'grad', big: 'SELF-EVOLVING', w: 13 * 25 },
    { kind: 'grad', big: 'MIT', w: 3 * 27 },
    { kind: 'repo', big: 'tarsaparajo/global-plugins', w: 26 * 14.5 },
  ];
  const totalW = groups.reduce((a, g) => a + g.w, 0);
  const gap = (R - L - totalW) / (groups.length - 1); // space-between
  let x = L;
  groups.forEach((g, i) => {
    if (g.kind === 'repo') {
      // right-align the repo to the content right edge
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

const out = path.join(__dirname, 'hero.svg');
fs.writeFileSync(out, svg);
console.log('wrote', out, '(' + svg.length + ' bytes)');

// Best-effort PNG so hero.png never drifts from hero.svg. Never hard-fail:
// try sharp, then @resvg/resvg-js, then headless Chrome; else print the manual step.
(async () => {
  const png = path.join(__dirname, 'hero.png');
  try {
    const sharp = require('sharp');
    await sharp(Buffer.from(svg)).resize(W, H).png().toFile(png);
    return console.log('wrote', png, '(sharp)');
  } catch { /* not installed */ }
  try {
    const { Resvg } = require('@resvg/resvg-js');
    fs.writeFileSync(png, new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng());
    return console.log('wrote', png, '(@resvg/resvg-js)');
  } catch { /* not installed */ }
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
          `--window-size=${W},${H}`, `--screenshot=${png}`, `file://${htmlPath}`],
          { stdio: 'ignore' });
        if (fs.existsSync(png)) return console.log('wrote', png, '(headless chrome:', bin + ')');
      } catch { /* try next browser */ }
    }
  } catch { /* no browser available */ }
  console.log('hero.svg written; no SVG rasterizer found (sharp / @resvg/resvg-js / headless Chrome).');
  console.log(`To produce hero.png: install one (npm i -D sharp) and re-run, or open hero.svg in a browser or vector editor and export hero.png at ${W}x${H}.`);
})();
