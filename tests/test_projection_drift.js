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
const { cleanup } = require('./_fixture');

const ROOT = path.join(__dirname, '..');
const FIX = 'node scripts/evolve/project.mjs --apply';

// Project the real canonical source for one target into a fresh temp root and
// return the plan (so we can walk the planned destinations) plus that root.
function projectReal(target) {
  const { modules } = resolve(ROOT, { targets: ['all'] });
  const out = fs.mkdtempSync(path.join(os.tmpdir(), `gp-drift-${target}-`));
  // OpenCode validation requires its compiled payload to exist first — the real
  // projector runs the build step into the output root before projecting.
  if (target === 'opencode') {
    require('../engine/build-opencode').build(out);
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
        if (!op.destinationPath || !/\.(md|toml)$/.test(op.destinationPath)) {
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
test('committed OpenCode agents carry only valid colors (hex or theme token)', () => {
  for (const rel of listCommitted('.opencode/agents').filter(f => f.endsWith('.md'))) {
    const body = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const m = body.match(/^color:\s*(.+?)\s*$/m);
    if (!m) {
      continue; // no color is fine (dropped/omitted)
    }
    const value = m[1];
    assert.ok(
      /^#[0-9a-fA-F]{6}$/.test(value) || OPENCODE_THEME_TOKENS.includes(value),
      `${rel}: invalid OpenCode color "${value}" — must be hex #RRGGBB or a theme token. Run: ${FIX}`,
    );
  }
});

// 4) Projection surface: only model-facing component dirs (agents/skills/commands,
// + opencode's compiled dist/) belong in a provider dotfolder. Infrastructure
// (engine/, adapters/, manifests/, config/, templates/, docs/) lives at the repo
// root and must NEVER be projected — copying it bloated every install with the
// engine source. Guards the planFromModules handler-gating + module.targets fix.
test('no infrastructure dir leaks into a provider dotfolder', () => {
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
        `${dot}/${dir}/ leaked — infrastructure must stay at the repo root, not in a dotfolder. Run: ${FIX}`,
      );
    }
  }
});
