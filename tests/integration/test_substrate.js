'use strict';

// Opt-in universal substrate: when enabled, every AGENTS.md the child already
// has (any depth) gets a sibling CLAUDE.md symlinked to it, so the instruction
// substrate is shared across Claude Code, Codex, and OpenCode. It imposes no
// structure — it only links instruction files that already exist, and only when
// opted in.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const projector = require('../../engine/projector');
const executor = require('../../engine/executor');
const { generators } = require('../../engine/builder');

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gp-substrate-'));
}

function substratePlan(root) {
  return projector
    .planAll(['claude'], { repoRoot: root, projectRoot: root, homeDir: root, modules: [], universalSubstrate: true })
    .find(p => p.adapter.target === 'substrate');
}

test('universal substrate is off by default (no substrate plan)', () => {
  const root = tmp();
  try {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# x\n');
    const plans = projector.planAll(['claude'], { repoRoot: root, projectRoot: root, homeDir: root, modules: [] });
    assert.ok(!plans.some(p => p.adapter.target === 'substrate'), 'substrate must not appear unless opted in');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('universal substrate links every AGENTS.md at every level', () => {
  const root = tmp();
  try {
    fs.mkdirSync(path.join(root, 'memory'), { recursive: true });
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# root substrate\nbase\n');
    fs.writeFileSync(path.join(root, 'memory', 'AGENTS.md'), '# memory substrate\nnested\n');

    const plan = substratePlan(root);
    assert.strictEqual(plan.operations.length, 2, 'one link per AGENTS.md');
    assert.ok(plan.operations.every(op => op.kind === 'symlink'), 'all ops are symlinks (no scaffold imposed)');

    const res = executor.applyPlan(plan, { repoRoot: root, generators });
    assert.ok(res.ok);

    for (const dir of ['', 'memory']) {
      const link = path.join(root, dir, 'CLAUDE.md');
      assert.ok(fs.lstatSync(link).isSymbolicLink(), `${dir || '<root>'}/CLAUDE.md is a symlink`);
      assert.strictEqual(fs.readlinkSync(link), 'AGENTS.md', 'link points at sibling AGENTS.md');
    }
    // Each link resolves to its own level's substrate.
    assert.ok(fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8').includes('base'));
    assert.ok(fs.readFileSync(path.join(root, 'memory', 'CLAUDE.md'), 'utf8').includes('nested'));
    // Existing AGENTS.md were not modified or duplicated.
    assert.strictEqual(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), '# root substrate\nbase\n');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('universal substrate imposes nothing when the child has no instruction files', () => {
  const root = tmp();
  try {
    fs.writeFileSync(path.join(root, 'notes.md'), 'not an instruction file\n');
    const plan = substratePlan(root);
    assert.strictEqual(plan.operations.length, 0, 'nothing to universalize, nothing created');
    executor.applyPlan(plan, { repoRoot: root, generators });
    assert.ok(!fs.existsSync(path.join(root, 'AGENTS.md')), 'no AGENTS.md invented');
    assert.ok(!fs.existsSync(path.join(root, 'CLAUDE.md')), 'no CLAUDE.md invented');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('universal substrate is idempotent on re-projection', () => {
  const root = tmp();
  try {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# x\n');
    const first = executor.applyPlan(substratePlan(root), { repoRoot: root, generators });
    assert.ok(first.ok);
    const second = executor.applyPlan(substratePlan(root), { repoRoot: root, generators });
    assert.ok(second.ok);
    assert.ok(fs.lstatSync(path.join(root, 'CLAUDE.md')).isSymbolicLink(), 'still a symlink after re-projection');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
