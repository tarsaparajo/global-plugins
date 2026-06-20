'use strict';

// End-to-end: project the fixture canonical to every provider, then prove
// parity (coverage, determinism, containment) for each target.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { listProviders, planScaffold } = require('../../engine/registry');
const executor = require('../../engine/executor');
const projector = require('../../engine/projector');
const parity = require('../../engine/parity');
const { generators } = require('../../engine/builder');
const { makeCanonicalFixture, cleanup, fixtureModules } = require('../_fixture');

test('every provider projects and passes parity', () => {
  const root = makeCanonicalFixture();
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-e2e-'));
  try {
    for (const adapter of listProviders()) {
      const target = adapter.target;
      // OpenCode needs its compiled payload before validation; build it first.
      if (target === 'opencode') {
        require('../../engine/build-opencode').build(out);
      }
      const opts = { repoRoot: root, projectRoot: out, homeDir: out, modules: fixtureModules() };
      const plan = planScaffold({ target, ...opts });
      const res = executor.applyPlan(plan, { repoRoot: root, generators });
      assert.ok(res.ok, `${target} projection failed: ${res.error}`);

      const planForParity = projector.planForTarget(target, opts);
      const planFn = () => projector.planForTarget(target, opts).operations;
      const report = parity.checkTarget(planForParity, planFn);
      assert.ok(report.checks.determinism, `${target} non-deterministic`);
      assert.ok(report.checks.coverage, `${target} coverage gap`);
      assert.ok(report.checks.containment, `${target} containment breach`);
    }
  } finally {
    cleanup(root); cleanup(out);
  }
});

test('opencode build step produces the required dist artefacts', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-oc-'));
  try {
    const { build } = require('../../engine/build-opencode');
    const res = build(out);
    assert.ok(res.ok);
    assert.ok(fs.existsSync(path.join(out, '.opencode', 'dist', 'index.js')));
    assert.ok(fs.existsSync(path.join(out, '.opencode', 'dist', 'plugins')));
    assert.ok(fs.existsSync(path.join(out, '.opencode', 'dist', 'tools')));
  } finally {
    cleanup(out);
  }
});
