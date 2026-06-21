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
  // Codex re-expresses agents as [agents.<name>] config.toml tables — NOT
  // agents/<name>.toml files (which never existed in real Codex).
  codex: { root: '.codex', expect: (out) => !fs.existsSync(path.join(out, '.codex', 'agents')) && fs.existsSync(path.join(out, '.codex', 'config.toml')) },
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
        // The baseline rides in a DEDICATED [prompt_defense] table (append-safe),
        // NOT a bare root `prompt_defense_baseline` key (which would bind to a
        // trailing table like [desktop] when merged into an existing config).
        assert.ok(/^\[prompt_defense\]$/m.test(cfg), 'codex config.toml missing the [prompt_defense] table');
        assert.ok(/^baseline = ".+"$/m.test(cfg), 'codex [prompt_defense] missing a single-line baseline string');
        assert.ok(!/^prompt_defense_baseline\s*=/m.test(cfg), 'codex must NOT emit a bare root prompt_defense_baseline key');
        assert.ok(!cfg.includes('"""'), 'codex must NOT use a brittle triple-quoted baseline string');
        // Agents are re-expressed as native [agents.<name>] tables in config.toml,
        // carrying ONLY Codex's real fields (description). The Claude-only fields
        // (tools array, model alias, named color) have no Codex slot.
        assert.ok(/\[agents\.reviewer\]/.test(cfg), 'codex config.toml missing the [agents.reviewer] table');
        assert.ok(/description = "Review code for issues\."/.test(cfg), 'codex [agents.reviewer] missing its description');
        const skillMd = path.join(out, '.codex', 'skills', 'builder', 'SKILL.md');
        assert.ok(fs.existsSync(skillMd), 'codex did not materialize the skill body as a sibling file');
        // The fixture skill's description carries a colon ("Fast gate: …"). Codex's
        // SKILL.md frontmatter must be VALID YAML: the colon-bearing description
        // must be double-quoted, never left as a bare scalar (which a YAML reader
        // parses as a nested mapping → "mapping values are not allowed in this
        // context" → Codex skips the skill).
        const skillBody = fs.readFileSync(skillMd, 'utf8');
        assert.ok(/^description: ".*Fast gate: schema-valid, round-trips\."$/m.test(skillBody),
          'codex SKILL.md must double-quote a colon-bearing description');
        assert.ok(!/^description: Build things from a spec\. Fast gate:/m.test(skillBody),
          'codex SKILL.md must NOT leave a colon-bearing description unquoted');
        // No Claude-shaped frontmatter may leak anywhere in the Codex projection:
        // not a renamed agent .toml, not the skill SKILL.md (name + description
        // only), not the config or index.
        for (const f of listFiles(path.join(out, '.codex'))) {
          const body = fs.readFileSync(f, 'utf8');
          assert.ok(!/^color:\s/m.test(body), `codex leaked a Claude color field in ${f}`);
          assert.ok(!/^model:/m.test(body), `codex leaked a model field in ${f} (model is never preset)`);
          assert.ok(!/^tools:\s*\[/m.test(body), `codex leaked a Claude tools array in ${f}`);
        }
        // Instruction rules fold into AGENTS.md for codex (no separate rules dir,
        // no installer — codex has no rules-distribution gap). The fixture ships
        // rules/style.md ("Always test."); it must appear under Conventions / Rules.
        assert.ok(/Conventions \/ Rules/.test(idx), 'codex AGENTS.md did not fold the rules section');
        assert.ok(idx.includes('Always test'), 'codex AGENTS.md did not fold the rule body');
        assert.ok(!fs.existsSync(path.join(out, '.codex', 'rules')), 'codex must not emit a separate rules dir (rules fold into AGENTS.md)');
      }
      // Claude keeps the canonical frontmatter verbatim (canonical IS Claude
      // shape) EXCEPT model: the fixture carries a stray `model: sonnet` and the
      // projector must DROP it (model is never preset — a CLI/runtime choice).
      if (target === 'claude') {
        const ag = fs.readFileSync(path.join(out, '.claude', 'agents', 'reviewer.md'), 'utf8');
        assert.ok(/^tools:\s*\["Read", "Grep", "Bash"\]/m.test(ag), 'claude must keep the tools array verbatim');
        assert.ok(!/^model:/m.test(ag), 'claude must NOT emit a model field (dropped even on claude)');
        assert.ok(/^color:\s*cyan/m.test(ag), 'claude must keep the named color verbatim');
      }
      // OpenCode rewrites field SHAPES: tools array -> object; color named Claude
      // color -> hex (a bare Claude name is not a valid OpenCode color); model is
      // dropped (never preset).
      if (target === 'opencode') {
        const ag = fs.readFileSync(path.join(out, '.opencode', 'agents', 'reviewer.md'), 'utf8');
        assert.ok(!/^tools:\s*\[/m.test(ag), 'opencode must not keep the Claude tools array');
        assert.ok(/^tools:\s*\{[^}]*read: true[^}]*\}/m.test(ag), 'opencode must rewrite tools to an object of name:true');
        assert.ok(!/^model:/m.test(ag), 'opencode must NOT emit a model field (dropped)');
        assert.ok(!/^color:\s*cyan/m.test(ag), 'opencode must not keep the bare Claude color name (invalid)');
        assert.ok(/^color:\s*#06B6D4/m.test(ag), 'opencode must rewrite cyan -> hex #06B6D4');
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
