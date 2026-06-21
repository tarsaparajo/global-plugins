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
const { isForeignPlatformPath, pluginLabel, payloadBasePath } = require('../../engine/helpers');
const { makeCanonicalFixture, cleanup, fixtureModules, FIXTURE_PLUGIN_NAME } = require('../_fixture');

// The fixture plugin's private bundle dir name (e.g. `_fixture-plugin`).
const FIXTURE_BUNDLE = `_${FIXTURE_PLUGIN_NAME}`;

function projectTo(target) {
  const root = makeCanonicalFixture();
  const out = fs.mkdtempSync(path.join(os.tmpdir(), `gp-${target}-`));
  // OpenCode requires its compiled payload to exist before validation runs —
  // the real projector runs the build step first into the output root. Pass the
  // fixture slug so the build lands in the namespaced private bundle.
  if (target === 'opencode') {
    require('../../engine/build-opencode').build(out, pluginLabel(root));
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
  // OpenCode owner-prefixes the invocable name: reviewer -> <plugin>-reviewer.md.
  opencode: { root: '.opencode', expect: (out) => fs.existsSync(path.join(out, '.opencode', 'agents', `${FIXTURE_PLUGIN_NAME}-reviewer.md`)) },
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
        // Codex has no native namespacing -> every description is owner-prefixed.
        const L = FIXTURE_PLUGIN_NAME;
        assert.ok(cfg.includes(`description = "[${L}] Review code for issues."`),
          'codex [agents.reviewer] description must carry the [plugin] owner prefix');
        // The AGENTS.md index is owner-prefixed AND grouped under a "### <plugin>" heading.
        assert.ok(new RegExp(`^### ${L}$`, 'm').test(idx), 'codex AGENTS.md missing the "### <plugin>" owner group heading');
        assert.ok(idx.includes(`[${L}] `), 'codex AGENTS.md index entries must carry the [plugin] owner prefix');
        const skillMd = path.join(out, '.codex', 'skills', 'builder', 'SKILL.md');
        assert.ok(fs.existsSync(skillMd), 'codex did not materialize the skill body as a sibling file (name NOT prefixed on codex)');
        // The fixture skill's description carries a colon ("Fast gate: …"). Codex's
        // SKILL.md frontmatter must be VALID YAML: the colon-bearing description
        // must be double-quoted, AND owner-prefixed.
        const skillBody = fs.readFileSync(skillMd, 'utf8');
        assert.ok(new RegExp(`^description: "\\[${L}\\] .*Fast gate: schema-valid, round-trips\\."$`, 'm').test(skillBody),
          'codex SKILL.md description must be owner-prefixed AND double-quoted');
        assert.ok(!/^description: Build things from a spec\./m.test(skillBody),
          'codex SKILL.md must NOT leave the description bare/unprefixed');
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
      // color -> QUOTED hex; model dropped. AND owner-prefixes the invocable name
      // (file + name:) and the description (no native namespacing).
      if (target === 'opencode') {
        const L = FIXTURE_PLUGIN_NAME;
        const agPath = path.join(out, '.opencode', 'agents', `${L}-reviewer.md`);
        assert.ok(fs.existsSync(agPath), 'opencode agent file must be owner-prefixed (<plugin>-reviewer.md)');
        assert.ok(!fs.existsSync(path.join(out, '.opencode', 'agents', 'reviewer.md')), 'no unprefixed opencode agent file');
        const ag = fs.readFileSync(agPath, 'utf8');
        assert.ok(!/^tools:\s*\[/m.test(ag), 'opencode must not keep the Claude tools array');
        assert.ok(/^tools:\s*\{[^}]*read: true[^}]*\}/m.test(ag), 'opencode must rewrite tools to an object of name:true');
        assert.ok(!/^model:/m.test(ag), 'opencode must NOT emit a model field (dropped)');
        assert.ok(!/^color:\s*cyan/m.test(ag), 'opencode must not keep the bare Claude color name (invalid)');
        assert.ok(/^color:\s*"#06B6D4"$/m.test(ag), 'opencode must rewrite cyan -> QUOTED hex "#06B6D4"');
        assert.ok(!/^color:\s*#06B6D4\s*$/m.test(ag), 'opencode hex must NOT be bare (would be a YAML comment)');
        assert.ok(new RegExp(`^name: ${L}-reviewer$`, 'm').test(ag), 'opencode agent name: must match its owner-prefixed file');
        // A leading "[" makes the scalar a YAML flow-sequence unless quoted, so the
        // owner-prefixed description MUST be double-quoted.
        assert.ok(new RegExp(`^description: "\\[${L}\\] `, 'm').test(ag), 'opencode agent description owner-prefixed AND quoted');
        // Skill: directory AND name: are owner-prefixed; no unprefixed dir remains.
        const skillPath = path.join(out, '.opencode', 'skills', `${L}-builder`, 'SKILL.md');
        assert.ok(fs.existsSync(skillPath), 'opencode skill dir must be owner-prefixed (<plugin>-builder/)');
        assert.ok(!fs.existsSync(path.join(out, '.opencode', 'skills', 'builder')), 'no unprefixed opencode skill dir');
        const sk = fs.readFileSync(skillPath, 'utf8');
        assert.ok(new RegExp(`^name: ${L}-builder$`, 'm').test(sk), 'opencode skill name: must match its owner-prefixed dir');
        assert.ok(new RegExp(`^description: "\\[${L}\\] `, 'm').test(sk), 'opencode skill description prefixed (and quoted for its colon)');
        // Command file is owner-prefixed too (commands have no name: field).
        assert.ok(fs.existsSync(path.join(out, '.opencode', 'commands', `${L}-run.md`)), 'opencode command file must be owner-prefixed');
        assert.ok(!fs.existsSync(path.join(out, '.opencode', 'commands', 'run.md')), 'no unprefixed opencode command file');
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

// Namespacing: a plugin's non-standard infra lands in its private bundle
// `_<slug>/`, standard/shared surfaces stay at the dotfolder root, and no flat
// `_engine`/`dist` remains — so installs never collide.
for (const target of ['codex', 'opencode']) {
  test(`provider ${target}: non-standard infra is namespaced under _<slug>/`, () => {
    const { root, out, res } = projectTo(target);
    try {
      assert.ok(res.ok, `projection failed: ${res.error}`);
      const dot = path.join(out, `.${target}`);
      // Payload in the private bundle.
      assert.ok(fs.existsSync(path.join(payloadBasePath(dot, root), 'engine', 'resolver.js')),
        `${target}: payload must live under .${target}/${FIXTURE_BUNDLE}/_engine/`);
      // No flat (un-namespaced) infra at the dotfolder root.
      assert.ok(!fs.existsSync(path.join(dot, '_engine')), `${target}: flat _engine must not exist at the root`);
      assert.ok(!fs.existsSync(path.join(dot, 'dist')), `${target}: flat dist must not exist at the root`);
      if (target === 'opencode') {
        // Compiled plugin in the bundle, discovery loader in the shared dir.
        assert.ok(fs.existsSync(path.join(dot, FIXTURE_BUNDLE, 'dist', 'index.js')),
          'opencode dist must live under the private bundle');
        assert.ok(fs.existsSync(path.join(dot, 'plugins', `${FIXTURE_PLUGIN_NAME}.js`)),
          'opencode per-slug discovery loader must exist in the shared plugins/ dir');
        // dist tools resolve the payload as a sibling (../../_engine).
        const tools = fs.readFileSync(path.join(dot, FIXTURE_BUNDLE, 'dist', 'tools', 'index.js'), 'utf8');
        assert.ok(/'\.\.', '\.\.', '_engine'/.test(tools), 'opencode dist tools must resolve ../../_engine (sibling of dist)');
        // Tool names are slug-prefixed (no shadowing across installed plugins).
        assert.ok(tools.includes(`${FIXTURE_PLUGIN_NAME}-generate`), 'opencode tool names must be slug-prefixed');
        // Standard/shared surfaces stay at the root, NOT inside the bundle.
        assert.ok(fs.existsSync(path.join(dot, 'agents')), 'opencode agents/ must stay at the root');
        assert.ok(!fs.existsSync(path.join(dot, FIXTURE_BUNDLE, 'agents')), 'agents/ must NOT move into the private bundle');
      }
    } finally {
      cleanup(root); cleanup(out);
    }
  });
}

// Anti-collision: two plugins with different slugs project into the SAME provider
// home without overwriting each other's private bundle or discovery loader.
test('two plugins install side-by-side without colliding (opencode)', () => {
  const fs2 = require('fs');
  const home = fs2.mkdtempSync(path.join(os.tmpdir(), 'gp-multi-'));
  const { build } = require('../../engine/build-opencode');
  try {
    for (const slug of ['plugin-alpha', 'plugin-beta']) {
      const root = makeCanonicalFixture();
      // Rewrite the fixture's plugin slug so each install has a distinct identity.
      fs2.writeFileSync(path.join(root, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: slug }, null, 2));
      build(home, slug);
      const plan = planScaffold({ target: 'opencode', repoRoot: root, projectRoot: home, homeDir: home, modules: fixtureModules() });
      const res = executor.applyPlan(plan, { repoRoot: root, generators });
      assert.ok(res.ok, `projection for ${slug} failed: ${res.error}`);
      cleanup(root);
    }
    // Both bundles + both loaders coexist.
    for (const slug of ['plugin-alpha', 'plugin-beta']) {
      assert.ok(fs2.existsSync(path.join(home, '.opencode', `_${slug}`, '_engine', 'engine', 'resolver.js')),
        `${slug} payload survived the second install`);
      assert.ok(fs2.existsSync(path.join(home, '.opencode', `_${slug}`, 'dist', 'index.js')),
        `${slug} dist survived the second install`);
      assert.ok(fs2.existsSync(path.join(home, '.opencode', 'plugins', `${slug}.js`)),
        `${slug} discovery loader survived the second install`);
    }
  } finally {
    cleanup(home);
  }
});
