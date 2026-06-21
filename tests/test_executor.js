'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { planScaffold } = require('../engine/registry');
const executor = require('../engine/executor');
const { generators } = require('../engine/builder');
const { makeCanonicalFixture, cleanup, fixtureModules } = require('./_fixture');

function project(target) {
  const root = makeCanonicalFixture();
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-out-'));
  const plan = planScaffold({ target, repoRoot: root, projectRoot: out, homeDir: out, modules: fixtureModules() });
  const res = executor.applyPlan(plan, { repoRoot: root, generators });
  return { root, out, plan, res };
}

test('executor applies a claude projection and merges MCP', () => {
  const { root, out, res } = project('claude');
  try {
    assert.ok(res.ok, res.error);
    const mcp = JSON.parse(fs.readFileSync(path.join(out, '.claude', '.mcp.json'), 'utf8'));
    assert.ok(mcp.mcpServers.demo, 'MCP server merged');
  } finally {
    cleanup(root); cleanup(out);
  }
});

test('executor injects the Prompt Defense Baseline into model-facing markdown', () => {
  const { root, out, res } = project('claude');
  try {
    assert.ok(res.ok);
    const agent = fs.readFileSync(path.join(out, '.claude', 'agents', 'reviewer.md'), 'utf8');
    assert.ok(agent.includes('## Prompt Defense Baseline'));
  } finally {
    cleanup(root); cleanup(out);
  }
});

test('executor is idempotent — re-applying yields identical bytes', () => {
  const root = makeCanonicalFixture();
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-out-'));
  try {
    const plan = planScaffold({ target: 'claude', repoRoot: root, projectRoot: out, homeDir: out, modules: fixtureModules() });
    executor.applyPlan(plan, { repoRoot: root, generators });
    const ruleFirst = fs.readFileSync(path.join(out, '.claude', 'agents', 'reviewer.md'), 'utf8');
    executor.applyPlan(plan, { repoRoot: root, generators });
    const ruleSecond = fs.readFileSync(path.join(out, '.claude', 'agents', 'reviewer.md'), 'utf8');
    assert.strictEqual(ruleFirst, ruleSecond);
  } finally {
    cleanup(root); cleanup(out);
  }
});

// G5 reference rewrite — pure unit: boundary-aware, per-provider, idempotent.
test('rewriteNamespacedRefs namespaces folder refs at path boundaries only', () => {
  const B = '_demo';
  const out = executor.rewriteNamespacedRefs('read `policies/X.md` and (policies/Y.md)', ['policies'], B);
  assert.ok(out.includes('`_demo/policies/X.md`'), 'rewrites a backtick-delimited ref');
  assert.ok(out.includes('(_demo/policies/Y.md)'), 'rewrites a paren-delimited ref');
});

test('rewriteNamespacedRefs leaves mid-word matches and bare names untouched', () => {
  const B = '_demo';
  const out = executor.rewriteNamespacedRefs('mypolicies/keep and word-policies/keep and policies alone', ['policies'], B);
  assert.strictEqual(out, 'mypolicies/keep and word-policies/keep and policies alone',
    'no rewrite when not at a path boundary or when no trailing slash');
});

test('rewriteNamespacedRefs is idempotent (no double prefix on re-run) — R4', () => {
  const B = '_demo';
  const once = executor.rewriteNamespacedRefs('see protocols/A.md and data/B.md', ['protocols', 'data'], B);
  const twice = executor.rewriteNamespacedRefs(once, ['protocols', 'data'], B);
  assert.strictEqual(once, twice, 're-running must not produce _demo/_demo/...');
  assert.ok(!twice.includes('_demo/_demo/'), 'no doubled bundle prefix');
});

test('rewriteNamespacedRefs is a no-op with no bundle or no folders', () => {
  assert.strictEqual(executor.rewriteNamespacedRefs('policies/X.md', ['policies'], ''), 'policies/X.md');
  assert.strictEqual(executor.rewriteNamespacedRefs('policies/X.md', [], '_demo'), 'policies/X.md');
});

// Round-trip + idempotence on a provider that ACTUALLY namespaces (opencode):
// re-projecting the same canonical source yields byte-identical output, including
// the rewritten reviewer body and the bundled policies/ folder.
test('opencode re-projection is byte-identical incl. namespaced folder + rewritten ref (R4/R5)', () => {
  const root = makeCanonicalFixture();
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-out-'));
  try {
    require('../engine/build-opencode').build(out, 'fixture-plugin');
    const plan = planScaffold({ target: 'opencode', repoRoot: root, projectRoot: out, homeDir: out, modules: fixtureModules() });
    assert.ok(executor.applyPlan(plan, { repoRoot: root, generators }).ok);
    const agPath = path.join(out, '.opencode', 'agents', 'fixture-plugin-reviewer.md');
    const policyPath = path.join(out, '.opencode', '_fixture-plugin', 'policies', 'STYLE.md');
    const ag1 = fs.readFileSync(agPath, 'utf8');
    const pol1 = fs.readFileSync(policyPath, 'utf8');
    assert.ok(ag1.includes('_fixture-plugin/policies/STYLE.md'), 'ref rewritten on first projection');
    // Re-apply: byte-identical.
    assert.ok(executor.applyPlan(plan, { repoRoot: root, generators }).ok);
    assert.strictEqual(fs.readFileSync(agPath, 'utf8'), ag1, 'agent body byte-stable across re-projection');
    assert.strictEqual(fs.readFileSync(policyPath, 'utf8'), pol1, 'bundled policy byte-stable');
    assert.ok(!fs.readFileSync(agPath, 'utf8').includes('_fixture-plugin/_fixture-plugin/'),
      're-projection must not double-namespace the reference');
  } finally {
    cleanup(root); cleanup(out);
  }
});
