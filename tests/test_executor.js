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
