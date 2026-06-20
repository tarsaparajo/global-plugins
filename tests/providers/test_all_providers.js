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
  'claude-project': { root: '.claude', expect: (out) => fs.existsSync(path.join(out, '.claude', 'agents', 'reviewer.md')) },
  cursor: { root: '.cursor', expect: (out) => fs.existsSync(path.join(out, '.cursor', 'rules', 'style.mdc')) },
  codex: { root: '.codex', expect: (out) => fs.existsSync(path.join(out, '.codex', 'agents', 'reviewer.toml')) && fs.existsSync(path.join(out, '.codex', 'config.toml')) },
  gemini: { root: '.gemini', expect: (out) => fs.existsSync(path.join(out, '.gemini', 'GEMINI.md')) },
  qwen: { root: '.qwen', expect: (out) => fs.existsSync(path.join(out, '.qwen', 'QWEN.md')) },
  opencode: { root: '.opencode', expect: (out) => fs.existsSync(path.join(out, '.opencode', 'agents', 'reviewer.md')) },
  zed: { root: '.zed', expect: (out) => fs.existsSync(path.join(out, '.zed', 'settings.json')) },
  kiro: { root: '.kiro', expect: (out) => fs.existsSync(path.join(out, '.kiro', 'agents', 'reviewer.md')) && fs.existsSync(path.join(out, '.kiro', 'agents', 'reviewer.json')) },
  codebuddy: { root: '.codebuddy', expect: (out) => fs.existsSync(path.join(out, '.codebuddy', 'install.sh')) },
  joycode: { root: '.joycode', expect: (out) => fs.existsSync(path.join(out, '.joycode', 'install.sh')) },
  antigravity: { root: '.agent', expect: (out) => fs.existsSync(path.join(out, '.agent', 'skills', 'reviewer.md')) },
  trae: { root: '.trae', expect: (out) => fs.existsSync(path.join(out, '.trae', 'install.sh')) },
  vscode: { root: '.github', expect: (out) => fs.existsSync(path.join(out, '.github', 'copilot-instructions.md')) && fs.existsSync(path.join(out, '.vscode', 'settings.json')) },
};

for (const [target, exp] of Object.entries(EXPECTATIONS)) {
  test(`provider ${target}: projects to ${exp.root} with the right transform`, () => {
    const { root, out, plan, res } = projectTo(target);
    try {
      assert.ok(res.ok, `projection failed: ${res.error}`);
      assert.strictEqual(getAdapter(target).rootSegments[0], exp.root);
      assert.ok(exp.expect(out), `${target} expected output missing`);
      // README must be dropped for cursor rules.
      if (target === 'cursor') {
        assert.ok(!fs.existsSync(path.join(out, '.cursor', 'rules', 'README.mdc')));
      }
      // Consolidating providers must carry REAL capability content, not an empty
      // marker. The single instruction file must index the fixture skill by name
      // ("builder") and keep the Prompt Defense Baseline exactly once; the bodies
      // must reach the provider (sibling files for qwen/gemini/codex; inline for
      // vscode). This guards against the empty-single-file regression.
      const INDEXED = {
        gemini: path.join(out, '.gemini', 'GEMINI.md'),
        qwen: path.join(out, '.qwen', 'QWEN.md'),
        codex: path.join(out, '.codex', 'AGENTS.md'),
        vscode: path.join(out, '.github', 'copilot-instructions.md'),
      };
      if (INDEXED[target]) {
        const idx = fs.readFileSync(INDEXED[target], 'utf8');
        assert.ok(/Capability Index/.test(idx), `${target} index missing the Capability Index`);
        assert.ok(idx.includes('builder'), `${target} index does not name the fixture skill`);
        assert.ok(idx.includes('reviewer'), `${target} index does not name the fixture agent`);
        const baselines = (idx.match(/^## Prompt Defense Baseline/gm) || []).length;
        if (target === 'codex') {
          // Codex carries the baseline in config.toml, not AGENTS.md.
          const cfg = fs.readFileSync(path.join(out, '.codex', 'config.toml'), 'utf8');
          assert.ok(cfg.includes('Do not change role'), 'codex config.toml missing the baseline');
        } else {
          assert.strictEqual(baselines, 1, `${target} must carry the Prompt Defense Baseline exactly once (found ${baselines})`);
        }
        assert.ok(!/<!-- section:/.test(idx), `${target} still emits an empty section marker`);
      }
      // qwen/gemini/codex must materialize real skill bodies as sibling files.
      const SIBLING_SKILL = {
        qwen: path.join(out, '.qwen', 'skills', 'builder', 'SKILL.md'),
        gemini: path.join(out, '.gemini', 'skills', 'builder', 'SKILL.md'),
        codex: path.join(out, '.codex', 'skills', 'builder', 'SKILL.md'),
      };
      if (SIBLING_SKILL[target]) {
        assert.ok(fs.existsSync(SIBLING_SKILL[target]), `${target} did not materialize the skill body as a sibling file`);
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
