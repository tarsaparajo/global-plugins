'use strict';

// Committed-projection drift guard. The OTHER projection tests (test_all_providers)
// project a synthetic FIXTURE into a TEMP dir and assert the transform there — they
// never look at the repo's OWN committed dotfolders. That blind spot is exactly how
// a stale projection shipped: the engine was fixed (model dropped, named color ->
// hex) but the committed `.claude`/`.opencode`/`.codex` files were never regenerated,
// so OpenCode rejected them on install ("got 'cyan'") and nothing caught it.
//
// This test closes the loop: it re-projects the REAL canonical source into a temp
// root and asserts every committed projection file is BYTE-IDENTICAL to a fresh
// projection. The general byte-equality check catches ANY future field drift; the
// two targeted checks below (no stale `model:`, no invalid OpenCode `color:`) give a
// precise, actionable failure message for the two symptoms that bit users.
//
// When this fails, the fix is always the same: regenerate the committed dotfolders.
//   node scripts/evolve/project.mjs --apply

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { resolve } = require('../engine/resolver');
const { planScaffold, getAdapter } = require('../engine/registry');
const executor = require('../engine/executor');
const { generators } = require('../engine/builder');
const { OPENCODE_THEME_TOKENS } = require('../engine/frontmatter');
const { pluginLabel, payloadBasePath, privateBundleDir } = require('../engine/helpers');
const { cleanup } = require('./_fixture');

const ROOT = path.join(__dirname, '..');
const FIX = 'node scripts/evolve/project.mjs --apply';
// The plugin's private bundle dir name inside a provider dotfolder (e.g.
// `_global-plugins`), holding the namespaced runtime payload + (opencode) dist.
const BUNDLE = privateBundleDir(ROOT);

// Project the real canonical source for one target into a fresh temp root and
// return the plan (so we can walk the planned destinations) plus that root.
function projectReal(target) {
  const { modules } = resolve(ROOT, { targets: ['all'] });
  const out = fs.mkdtempSync(path.join(os.tmpdir(), `gp-drift-${target}-`));
  // OpenCode validation requires its compiled payload to exist first — the real
  // projector runs the build step into the output root before projecting. Pass the
  // slug so the build lands in the namespaced private bundle (`_<slug>/dist/`) and
  // emits the discovery loader, matching the committed layout.
  if (target === 'opencode') {
    require('../engine/build-opencode').build(out, pluginLabel(ROOT));
  }
  const plan = planScaffold({ target, repoRoot: ROOT, projectRoot: out, homeDir: out, modules });
  const res = executor.applyPlan(plan, { repoRoot: ROOT, generators });
  assert.ok(res.ok, `fresh projection for ${target} failed: ${res.error}`);
  return { out, plan };
}

// List every committed file under a repo-relative dir (recursive).
function listCommitted(relDir) {
  const base = path.join(ROOT, relDir);
  if (!fs.existsSync(base)) {
    return [];
  }
  return fs.readdirSync(base, { withFileTypes: true }).flatMap(e => {
    const rel = path.posix.join(relDir, e.name);
    return e.isDirectory() ? listCommitted(rel) : [rel];
  });
}

// 1) General byte-equality: every committed projection file == a fresh projection.
const { targets } = resolve(ROOT, { targets: ['all'] });
for (const target of targets) {
  test(`projection drift: committed .${getAdapter(target).target} matches a fresh projection`, () => {
    const { out, plan } = projectReal(target);
    try {
      for (const op of plan.operations) {
        // Mirror parity's exclusions: links and build markers are not content
        // files; install-state is machine-written, not part of the projection.
        if (op.kind === 'symlink' || op.kind === 'build-step') {
          continue;
        }
        // Byte-check .md/.toml capability files AND every runtime-payload file
        // (under a `_engine/` segment, any extension — engine .js, manifests .json,
        // scripts .mjs, the delta baseline). The payload must be byte-identical to
        // a fresh projection too, or a Codex/OpenCode install would run a stale engine.
        const isPayload = !!op.destinationPath && /(^|\/)_engine\//.test(op.destinationPath);
        if (!op.destinationPath || (!isPayload && !/\.(md|toml)$/.test(op.destinationPath))) {
          continue;
        }
        const rel = path.relative(out, op.destinationPath);
        if (rel.endsWith('install-state.json') || rel.startsWith('..')) {
          continue;
        }
        const committedPath = path.join(ROOT, rel);
        assert.ok(
          fs.existsSync(committedPath),
          `MISSING committed projection: ${rel} is produced by a fresh projection but absent from the repo. Run: ${FIX}`,
        );
        const committed = fs.readFileSync(committedPath, 'utf8');
        const fresh = fs.readFileSync(op.destinationPath, 'utf8');
        assert.strictEqual(
          committed,
          fresh,
          `DRIFT: committed ${rel} differs from a fresh projection. Run: ${FIX}`,
        );
      }
    } finally {
      cleanup(out);
    }
  });
}

// 2) Targeted: no committed projected agent (any provider) may carry a `model:` —
// model is never preset; the user picks it in the CLI.
test('committed projections carry no stale model: field', () => {
  const files = [
    ...listCommitted('.claude/agents'),
    ...listCommitted('.opencode/agents'),
    ...listCommitted('.codex'), // codex agents fold into config.toml/AGENTS.md/skills
  ].filter(f => /\.(md|toml)$/.test(f));
  for (const rel of files) {
    const body = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.ok(
      !/^model:/m.test(body),
      `${rel}: stale "model:" leaked — model is never preset (a CLI/runtime choice). Run: ${FIX}`,
    );
  }
});

// 3) Targeted: every committed OpenCode agent `color:` must be valid for OpenCode —
// a hex #RRGGBB or one of the 7 theme tokens. A bare Claude name ("cyan") is rejected.
// A hex MUST be YAML-quoted ("#RRGGBB"): a bare # after ": " starts a comment, so
// `color: #06B6D4` parses empty and OpenCode rejects the agent.
test('committed OpenCode agents carry only valid colors (QUOTED hex or theme token)', () => {
  for (const rel of listCommitted('.opencode/agents').filter(f => f.endsWith('.md'))) {
    const body = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const m = body.match(/^color:\s*(.+?)\s*$/m);
    if (!m) {
      continue; // no color is fine (dropped/omitted)
    }
    const raw = m[1];
    const wasQuoted = /^".*"$/.test(raw);
    const value = raw.replace(/^"|"$/g, '');
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      assert.ok(wasQuoted, `${rel}: hex color "${value}" must be YAML-QUOTED ("${value}"), not bare. Run: ${FIX}`);
    } else {
      assert.ok(
        OPENCODE_THEME_TOKENS.includes(value),
        `${rel}: invalid OpenCode color "${value}" — must be hex #RRGGBB or a theme token. Run: ${FIX}`,
      );
    }
  }
});

// 4) Projection surface: infrastructure (engine/, adapters/, manifests/, config/,
// templates/, docs/) must NEVER appear at the TOP LEVEL of a provider dotfolder
// (that would be the 0.7.0 bloat regression). It is allowed ONLY inside the
// reserved `_engine/` runtime-payload subdir. This guards the 0.7.0 capability
// guard while permitting the additive payload channel.
test('no infrastructure dir leaks into the capability surface (only the private bundle may hold it)', () => {
  const FORBIDDEN = ['engine', 'adapters', 'manifests', 'config', 'templates', 'docs'];
  for (const dot of ['.claude', '.codex', '.opencode']) {
    const base = path.join(ROOT, dot);
    if (!fs.existsSync(base)) {
      continue;
    }
    const top = fs.readdirSync(base, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);
    for (const dir of FORBIDDEN) {
      assert.ok(
        !top.includes(dir),
        `${dot}/${dir}/ leaked into the capability surface — infrastructure belongs only under the private bundle ${dot}/${BUNDLE}/_engine/. Run: ${FIX}`,
      );
    }
    // No flat (un-namespaced) `_engine`/`dist` at the dotfolder root: they must
    // live inside the private bundle `_<slug>/` so installs never collide.
    if (dot !== '.claude') {
      assert.ok(!top.includes('_engine'),
        `${dot}/_engine/ is flat (un-namespaced) — it must live under ${dot}/${BUNDLE}/_engine/. Run: ${FIX}`);
      assert.ok(!top.includes('dist'),
        `${dot}/dist/ is flat (un-namespaced) — it must live under ${dot}/${BUNDLE}/dist/. Run: ${FIX}`);
    }
  }
});

// 5) Runtime payload: Codex and OpenCode installs MUST carry a complete engine
// under _engine/ so they can generate/adapt/evolve themselves (Claude carries it
// via the whole-repo install, so no _engine/ there). A partial payload would fail
// at re-projection time on the user's machine — catch it here instead.
test('codex and opencode ship a complete _engine runtime payload in the private bundle', () => {
  const REQUIRED = [
    'engine/resolver.js', 'engine/projector.js', 'engine/executor.js', 'engine/builder.js',
    'engine/frontmatter.js', 'engine/helpers.js', 'engine/registry.js',
    'scripts/evolve/project.mjs', 'manifests/modules.json', 'adapters/registry.json',
  ];
  for (const dot of ['.codex', '.opencode']) {
    const payload = payloadBasePath(path.join(ROOT, dot), ROOT);
    assert.ok(fs.existsSync(payload), `${dot}/${BUNDLE}/_engine/ missing — install cannot run the projection engine. Run: ${FIX}`);
    for (const rel of REQUIRED) {
      assert.ok(
        fs.existsSync(path.join(payload, rel)),
        `${dot}/${BUNDLE}/_engine/${rel} missing — incomplete runtime payload. Run: ${FIX}`,
      );
    }
  }
  // The OpenCode compiled plugin lives in the same private bundle, with a per-slug
  // discovery loader in the shared plugins/ dir.
  assert.ok(fs.existsSync(path.join(ROOT, '.opencode', BUNDLE, 'dist', 'index.js')),
    `.opencode/${BUNDLE}/dist/index.js missing — compiled plugin not in the private bundle. Run: ${FIX}`);
  assert.ok(fs.existsSync(path.join(ROOT, '.opencode', 'plugins', `${pluginLabel(ROOT)}.js`)),
    `.opencode/plugins/${pluginLabel(ROOT)}.js missing — OpenCode discovery loader absent. Run: ${FIX}`);
  // Claude carries the engine at the repo root (whole-repo install), NOT in a
  // dotfolder payload.
  assert.ok(!fs.existsSync(path.join(ROOT, '.claude', '_engine')),
    '.claude/_engine/ should not exist — Claude carries the engine via the whole-repo install');
  assert.ok(!fs.existsSync(path.join(ROOT, '.claude', BUNDLE)),
    `.claude/${BUNDLE}/ should not exist — Claude carries the engine via the whole-repo install`);
});

// 6) Hero doctrine: the hero-skeleton standard is shared reference doctrine, so it
// must project verbatim into EVERY provider's skills/_knowledge/ (the channel that
// also carries readme-skeleton.md / namespacing.md). If it is missing from any
// dotfolder, a Codex/OpenCode user (or a generated child seeded from one) would not
// carry the hero standard. The general byte-equality check (#1) covers its content;
// this gives a precise, actionable failure.
test('hero-skeleton doctrine projects into every provider skills/_knowledge/', () => {
  for (const dot of ['.claude', '.codex', '.opencode']) {
    const p = path.join(ROOT, dot, 'skills', '_knowledge', 'hero-skeleton.md');
    assert.ok(
      fs.existsSync(p),
      `${dot}/skills/_knowledge/hero-skeleton.md missing — the hero skeleton standard did not project to ${dot}. Run: ${FIX}`,
    );
  }
});

// 7) Hero skeleton payload: the neutral model + its two authoring guides ride the
// child-templates payload channel verbatim, so every Codex/OpenCode install (and
// every child seeded from one) carries them under the private bundle's _engine/.
test('hero skeleton + guides ride the _engine payload on codex and opencode', () => {
  const ASSETS = ['hero.skeleton.svg', 'hero-svg.md', 'hero-authoring.md'];
  for (const dot of ['.codex', '.opencode']) {
    const assetsBase = path.join(payloadBasePath(path.join(ROOT, dot), ROOT), 'templates', 'child', 'assets');
    for (const name of ASSETS) {
      assert.ok(
        fs.existsSync(path.join(assetsBase, name)),
        `${dot}/${BUNDLE}/_engine/templates/child/assets/${name} missing — the hero skeleton ecosystem did not ride the payload to ${dot}. Run: ${FIX}`,
      );
    }
  }
});

// 8) Neutrality + well-formedness of the canonical skeleton. It is a TEMPLATE every
// child starts from, so it must name no specific plugin (no "Global Plugins" /
// "tarsaparajo") and be a valid, self-contained 2400x1350 SVG.
test('hero.skeleton.svg is neutral and well-formed', () => {
  const svg = fs.readFileSync(path.join(ROOT, 'templates', 'child', 'assets', 'hero.skeleton.svg'), 'utf8');
  assert.ok(!/Global Plugins/.test(svg), 'hero.skeleton.svg must not name "Global Plugins" — it is a neutral model.');
  assert.ok(!/tarsaparajo/.test(svg), 'hero.skeleton.svg must not reference the parent owner — it is a neutral model.');
  assert.ok(/<svg\b[^>]*\bviewBox="0 0 2400 1350"/.test(svg), 'hero.skeleton.svg must declare viewBox="0 0 2400 1350".');
  assert.ok(/<\/svg>\s*$/.test(svg), 'hero.skeleton.svg must end with a closing </svg>.');
  assert.ok(/\[PLUGIN NAME\]/.test(svg) && /\[OWNER\]/.test(svg), 'hero.skeleton.svg must keep its placeholder fields.');
});
