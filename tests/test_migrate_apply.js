'use strict';

// Migration runner (G4): real forward / verify / rollback execution with dry-run
// and idempotence, exercised against a synthetic installed copy. The runner is an
// executable .mjs; we spawn it like the migrate skill would and assert the result
// JSON + the on-disk effect. A loose non-standard folder at an installed dotfolder
// root must be relocated into `_<slug>/<folder>/`, classified by the SAME engine
// classifier the projector uses (so the migration can never diverge).

const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.join(__dirname, '..');
const RUNNER = path.join(REPO, 'scripts', 'evolve', 'migrate-apply.mjs');
const SLUG = 'demo-plugin';
const BUNDLE = `_${SLUG}`;

// Build a synthetic installed copy: the bundled engine (so the runner can import
// the classifier + registry), the 1.1.0 migration, a manifest, and dotfolders with
// a loose non-standard folder (`policies/`) plus a pinned one (`prompts/`).
function makeInstall() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-mig-'));
  const w = (rel, content) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };
  const cp = (rel) => {
    const dest = path.join(root, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(REPO, rel), dest);
  };
  for (const f of ['engine/helpers.js', 'engine/registry.js', 'engine/resolver.js', 'engine/semver.js',
    'engine/providers/_base.js', 'engine/providers/claude-home.js', 'engine/providers/codex-home.js',
    'engine/providers/opencode-home.js', 'adapters/registry.json', 'migrations/1.1.0.md']) {
    cp(f);
  }
  w('.claude-plugin/plugin.json', JSON.stringify({ name: SLUG }, null, 2));
  // Loose non-standard folder + a codex-pinned folder, on both providers, with an
  // existing bundle (so relocation has a destination parent).
  for (const dot of ['.codex', '.opencode']) {
    w(`${dot}/policies/STYLE.md`, 'policy');
    w(`${dot}/prompts/p.md`, 'prompt');
    fs.mkdirSync(path.join(root, dot, BUNDLE, 'engine'), { recursive: true });
  }
  // A capability dir that must NOT move.
  w('.codex/skills/keep.md', 'skill');
  return root;
}

function runMigrate(mode, root) {
  const res = spawnSync(process.execPath, [RUNNER, `--${mode}`, root], { encoding: 'utf8' });
  return { code: res.status, out: JSON.parse(res.stdout) };
}

test('migration dry-run lists the relocation plan and writes nothing', () => {
  const root = makeInstall();
  try {
    const { out } = runMigrate('dry-run', root);
    const planned = out.steps.flatMap(s => s.planned);
    const moves = planned.filter(p => p.move).map(p => p.move.to);
    // policies/ moves on BOTH providers; prompts/ moves on opencode only (codex pins it).
    assert.ok(moves.some(t => t === `.codex/${BUNDLE}/policies`), 'codex policies/ planned to move');
    assert.ok(moves.some(t => t === `.opencode/${BUNDLE}/policies`), 'opencode policies/ planned to move');
    assert.ok(moves.some(t => t === `.opencode/${BUNDLE}/prompts`), 'opencode prompts/ planned to move (not pinned)');
    assert.ok(!moves.some(t => t === `.codex/${BUNDLE}/prompts`), 'codex prompts/ must NOT move (pinned-to-root)');
    // No writes.
    assert.ok(fs.existsSync(path.join(root, '.codex', 'policies', 'STYLE.md')), 'dry-run must not move anything');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('migration apply relocates loose folders; pinned stays; capability dir untouched', () => {
  const root = makeInstall();
  try {
    const { code, out } = runMigrate('apply', root);
    assert.strictEqual(code, 0, 'apply exits 0');
    assert.ok(out.ok, 'apply ok');
    // policies/ relocated on both providers.
    assert.ok(fs.existsSync(path.join(root, '.codex', BUNDLE, 'policies', 'STYLE.md')), 'codex policies/ relocated');
    assert.ok(!fs.existsSync(path.join(root, '.codex', 'policies')), 'codex policies/ gone from root');
    assert.ok(fs.existsSync(path.join(root, '.opencode', BUNDLE, 'policies', 'STYLE.md')), 'opencode policies/ relocated');
    // prompts/ pinned on codex (stays), bundled on opencode (moves).
    assert.ok(fs.existsSync(path.join(root, '.codex', 'prompts', 'p.md')), 'codex prompts/ stays at root (pinned)');
    assert.ok(fs.existsSync(path.join(root, '.opencode', BUNDLE, 'prompts', 'p.md')), 'opencode prompts/ relocated');
    // capability dir untouched.
    assert.ok(fs.existsSync(path.join(root, '.codex', 'skills', 'keep.md')), 'codex skills/ kept at root');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('migration second apply is a no-op (idempotence — R4)', () => {
  const root = makeInstall();
  try {
    runMigrate('apply', root);
    const { out } = runMigrate('apply', root);
    const planned = out.steps.flatMap(s => s.planned);
    assert.strictEqual(planned.length, 0, 'second apply plans nothing');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('migration rollback moves relocated folders back to the root', () => {
  const root = makeInstall();
  try {
    runMigrate('apply', root);
    const { out } = runMigrate('rollback', root);
    assert.ok(out.steps.some(s => s.status === 'rolled-back'), 'rollback ran');
    assert.ok(fs.existsSync(path.join(root, '.codex', 'policies', 'STYLE.md')), 'codex policies/ back at root');
    assert.ok(fs.existsSync(path.join(root, '.opencode', 'prompts', 'p.md')), 'opencode prompts/ back at root');
    assert.ok(!fs.existsSync(path.join(root, '.codex', BUNDLE, 'policies')), 'codex bundle policies/ removed on rollback');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
