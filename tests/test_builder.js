'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { listProviders, planScaffold } = require('../engine/registry');
const { makeCanonicalFixture, cleanup, fixtureModules } = require('./_fixture');

test('registry loads exactly fourteen adapters', () => {
  assert.strictEqual(listProviders().length, 14);
});

test('every adapter declares installStatePathSegments', () => {
  for (const a of listProviders()) {
    assert.ok(a.installStatePathSegments.length > 0, `${a.id} missing installStatePathSegments`);
  }
});

test('adapter kinds match the home/project contract', () => {
  const byTarget = Object.fromEntries(listProviders().map(a => [a.target, a.kind]));
  assert.strictEqual(byTarget.codex, 'home');
  assert.strictEqual(byTarget.qwen, 'home');
  assert.strictEqual(byTarget.opencode, 'home');
  assert.strictEqual(byTarget.cursor, 'project');
  assert.strictEqual(byTarget.zed, 'project');
  assert.strictEqual(byTarget.antigravity, 'project');
});

test('planScaffold produces operations for the fixture', () => {
  const root = makeCanonicalFixture();
  try {
    const plan = planScaffold({ target: 'claude', repoRoot: root, projectRoot: root, homeDir: root, modules: fixtureModules() });
    assert.ok(plan.operations.length > 0);
    assert.strictEqual(plan.adapter.target, 'claude');
  } finally {
    cleanup(root);
  }
});

test('opencode adapter carries a build step', () => {
  const a = listProviders().find(x => x.target === 'opencode');
  assert.ok(a.buildStep, 'opencode must declare a build step');
  assert.ok(a.buildStep.command.includes('build-opencode'));
});
