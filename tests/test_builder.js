'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { listProviders, planScaffold } = require('../engine/registry');
const { makeCanonicalFixture, cleanup, fixtureModules } = require('./_fixture');

test('registry loads exactly three adapters', () => {
  assert.strictEqual(listProviders().length, 3);
});

test('every adapter declares installStatePathSegments', () => {
  for (const a of listProviders()) {
    assert.ok(a.installStatePathSegments.length > 0, `${a.id} missing installStatePathSegments`);
  }
});

test('adapter kinds match the home contract', () => {
  const byTarget = Object.fromEntries(listProviders().map(a => [a.target, a.kind]));
  assert.strictEqual(byTarget.claude, 'home');
  assert.strictEqual(byTarget.codex, 'home');
  assert.strictEqual(byTarget.opencode, 'home');
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
