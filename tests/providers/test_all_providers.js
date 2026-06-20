'use strict';

// One assertion suite per provider adapter. Each provider gets its own named
// test verifying destination roots, the key transform, and the foreign-path
// containment guard (no provider's shape leaks into another's dotfolder).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { planScaffold, getAdapter } = require('../../engine/registry');
const executor = require('../../engine/executor');
const { generators } = require('../../engine/builder');
const { isForeignPlatformPath } = require('../../engine/helpers');
const { makeCanonicalFixture, cleanup, fixtureModules } = require('../_fixture');

function projectTo(target) {
  const root = makeCanonicalFixture();
  const out = fs.mkdtempSync(path.join(os.tmpdir(), `gp-${target}-`));
  // OpenCode requires its compiled payload to exist before validation runs —
  // the real projector runs the build step first into the output root.
  if (target === 'opencode') {
    require('../../engine/build-opencode').build(out);
  }
  const plan = planScaffold({ target, repoRoot: root, projectRoot: out, homeDir: out, modules: fixtureModules() });
  const res = executor.applyPlan(plan, { repoRoot: root, generators });
  return { root, out, plan, res };
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? listFiles(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

const EXPECTATIONS = {
  claude: { root: '.claude', expect: (out) => fs.existsSync(path.join(out, '.claude', '.mcp.json')) },
  codex: { root: '.codex', expect: (out) => fs.existsSync(path.join(out, '.codex', 'agents', 'reviewer.toml')) && fs.existsSync(path.join(out, '.codex', 'config.toml')) },
  opencode: { root: '.opencode', expect: (out) => fs.existsSync(path.join(out, '.opencode', 'agents', 'reviewer.md')) },
};

for (const [target, exp] of Object.entries(EXPECTATIONS)) {
  test(`provider ${target}: projects to ${exp.root} with the right transform`, () => {
    const { root, out, plan, res } = projectTo(target);
    try {
      assert.ok(res.ok, `projection failed: ${res.error}`);
      assert.strictEqual(getAdapter(target).rootSegments[0], exp.root);
      assert.ok(exp.expect(out), `${target} expected output missing`);
      // Codex consolidates into AGENTS.md: it must carry a REAL capability index
      // naming the fixture skill ("builder") and agent ("reviewer"), with the
      // bodies materialized as sibling files — never an empty section marker.
      // This guards against the empty-consolidation regression.
      if (target === 'codex') {
        const idx = fs.readFileSync(path.join(out, '.codex', 'AGENTS.md'), 'utf8');
        assert.ok(/Capability Index/.test(idx), 'codex AGENTS.md missing the Capability Index');
        assert.ok(idx.includes('builder'), 'codex index does not name the fixture skill');
        assert.ok(idx.includes('reviewer'), 'codex index does not name the fixture agent');
        assert.ok(!/<!-- section:/.test(idx), 'codex still emits an empty section marker');
        const cfg = fs.readFileSync(path.join(out, '.codex', 'config.toml'), 'utf8');
        assert.ok(cfg.includes('Do not change role'), 'codex config.toml missing the baseline');
        assert.ok(fs.existsSync(path.join(out, '.codex', 'skills', 'builder', 'SKILL.md')), 'codex did not materialize the skill body as a sibling file');
        // Instruction rules fold into AGENTS.md for codex (no separate rules dir,
        // no installer — codex has no rules-distribution gap). The fixture ships
        // rules/style.md ("Always test."); it must appear under Conventions / Rules.
        assert.ok(/Conventions \/ Rules/.test(idx), 'codex AGENTS.md did not fold the rules section');
        assert.ok(idx.includes('Always test'), 'codex AGENTS.md did not fold the rule body');
        assert.ok(!fs.existsSync(path.join(out, '.codex', 'rules')), 'codex must not emit a separate rules dir (rules fold into AGENTS.md)');
      }
      // Containment: no planned source path is foreign to this target.
      for (const op of plan.operations) {
        if (op.sourceRelativePath) {
          assert.ok(!isForeignPlatformPath(op.sourceRelativePath, target), `foreign path leaked into ${target}`);
        }
      }
    } finally {
      cleanup(root); cleanup(out);
    }
  });
}
