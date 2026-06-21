'use strict';

// Unit tests for the deterministic frontmatter adapter (engine/frontmatter.js):
// the keep / rewrite / drop verbs per provider. The agentic "re-express" verb
// (color -> openai.yaml brand_color, tools -> dependencies.tools) is doctrine,
// not mechanical, and is not exercised here.

const test = require('node:test');
const assert = require('node:assert');
const fm = require('../engine/frontmatter');

const AGENT = [
  '---',
  'name: reviewer',
  'description: Review code for issues.',
  'tools: ["Read", "Grep", "Bash"]',
  'model: sonnet',
  'color: cyan',
  '---',
  '# Reviewer',
  '',
  'Body stays untouched.',
  '',
].join('\n');

test('claude keeps everything EXCEPT model (model is never preset)', () => {
  // Canonical agents carry no model:, but if a stray one is authored the adapter
  // drops it for the claude projection too (defense-in-depth). Everything else is
  // kept verbatim.
  const expected = AGENT.replace('model: sonnet\n', '');
  assert.strictEqual(fm.adapt(AGENT, 'claude'), expected);
  assert.doesNotMatch(fm.adapt(AGENT, 'claude'), /^model:/m, 'claude must not emit a model field');
  // A canonical agent with no model: is a true (byte-identical) no-op for claude.
  const noModel = AGENT.replace('model: sonnet\n', '');
  assert.strictEqual(fm.adapt(noModel, 'claude'), noModel);
  // An undefined target means "no adaptation at all" — pure passthrough.
  assert.strictEqual(fm.adapt(AGENT, undefined), AGENT);
});

test('opencode rewrites tools array -> object and DROPS model', () => {
  const out = fm.adapt(AGENT, 'opencode');
  assert.match(out, /^name: reviewer$/m);
  assert.match(out, /^description: Review code for issues\.$/m);
  assert.doesNotMatch(out, /^tools:\s*\[/m, 'tools array must not survive');
  assert.match(out, /^tools:\s*\{ read: true, grep: true, bash: true \}$/m);
  assert.doesNotMatch(out, /^model:/m, 'model is never emitted — the user picks it in the CLI');
  assert.doesNotMatch(out, /^color:\s*cyan$/m, 'named Claude color must NOT survive (invalid in OpenCode)');
  assert.match(out, /^color:\s*#06B6D4$/m, 'cyan -> hex #06B6D4 for OpenCode');
  assert.match(out, /Body stays untouched\./, 'body is preserved');
});

test('opencode rewrites every Claude named color to a valid hex', () => {
  for (const [name, hex] of Object.entries(fm.CLAUDE_TO_OPENCODE_COLOR)) {
    const src = `---\nname: a\ndescription: d\ncolor: ${name}\n---\nbody\n`;
    const out = fm.adapt(src, 'opencode');
    assert.match(out, new RegExp(`^color:\\s*${hex}$`, 'm'), `${name} -> ${hex}`);
    assert.match(hex, /^#[0-9a-fA-F]{6}$/, `${name} maps to a 6-digit hex`);
  }
});

test('opencode keeps an already-valid color (hex or theme token) unchanged', () => {
  const hexSrc = '---\nname: a\ndescription: d\ncolor: #FF5733\n---\nbody\n';
  assert.match(fm.adapt(hexSrc, 'opencode'), /^color:\s*#FF5733$/m, 'pre-set hex is kept');
  for (const token of fm.OPENCODE_THEME_TOKENS) {
    const tokSrc = `---\nname: a\ndescription: d\ncolor: ${token}\n---\nbody\n`;
    assert.match(fm.adapt(tokSrc, 'opencode'), new RegExp(`^color:\\s*${token}$`, 'm'), `theme token ${token} is kept`);
  }
});

test('opencode drops an unrecognized color rather than emit an invalid one', () => {
  const src = '---\nname: a\ndescription: d\ncolor: chartreuse\n---\nbody\n';
  const out = fm.adapt(src, 'opencode');
  assert.doesNotMatch(out, /^color:/m, 'unknown color name -> dropped (never emitted invalid)');
});

test('model is dropped on every target, regardless of its value', () => {
  const values = ['sonnet', 'opus', 'haiku', 'inherit', 'anthropic/claude-opus-4-5', 'openai/gpt-5'];
  for (const target of ['claude', 'opencode', 'codex']) {
    for (const v of values) {
      const src = `---\nname: a\ndescription: d\nmodel: ${v}\n---\nbody\n`;
      const out = fm.adapt(src, target);
      assert.doesNotMatch(out, /^model:/m, `model "${v}" must be dropped for ${target}`);
    }
  }
});

test('codex drops every Claude-only field, keeping only name + description', () => {
  const out = fm.adapt(AGENT, 'codex');
  assert.match(out, /^name: reviewer$/m);
  assert.match(out, /^description: Review code for issues\.$/m);
  assert.doesNotMatch(out, /^tools:/m, 'codex has no tools frontmatter slot');
  assert.doesNotMatch(out, /^model:/m, 'codex has no model frontmatter slot');
  assert.doesNotMatch(out, /^color:/m, 'codex has no per-agent color frontmatter slot');
  assert.match(out, /Body stays untouched\./, 'body is preserved');
});

test('codex drops argument-hint (SKILL/command frontmatter is name + description only)', () => {
  const cmd = '---\ndescription: Run it.\nargument-hint: [target]\n---\n# Run\n';
  const out = fm.adapt(cmd, 'codex');
  assert.match(out, /^description: Run it\.$/m);
  assert.doesNotMatch(out, /argument-hint/m);
});

test('opencode drops argument-hint (commands use template/agent/subtask)', () => {
  const cmd = '---\ndescription: Run it.\nargument-hint: [target]\n---\n# Run\n';
  const out = fm.adapt(cmd, 'opencode');
  assert.doesNotMatch(out, /argument-hint/m);
});

test('an already-qualified model id is also dropped on opencode (never emitted)', () => {
  const src = '---\nname: a\ndescription: d\nmodel: anthropic/claude-opus-4-5\n---\nb\n';
  const out = fm.adapt(src, 'opencode');
  assert.doesNotMatch(out, /^model:/m, 'even a full provider/model id is dropped — model is never preset');
});

test('files without frontmatter are returned unchanged', () => {
  const plain = '# Just a body\n\nno frontmatter here.\n';
  for (const t of ['claude', 'opencode', 'codex']) {
    assert.strictEqual(fm.adapt(plain, t), plain);
  }
});

test('decodeInlineArray handles quoted and bare inline arrays', () => {
  assert.deepStrictEqual(fm.decodeInlineArray('["Read", "Grep"]'), ['Read', 'Grep']);
  assert.deepStrictEqual(fm.decodeInlineArray('[Read, Grep]'), ['Read', 'Grep']);
  assert.deepStrictEqual(fm.decodeInlineArray('[]'), []);
  assert.strictEqual(fm.decodeInlineArray('sonnet'), null);
});

// Regression: a description containing ": " is a YAML mapping-value trap. Left
// unquoted ("Fast pass/fail gate: schema-valid manifests"), a YAML reader raises
// "mapping values are not allowed in this context" and Codex SKIPS the skill.
// serialize() must double-quote such scalars on every non-claude target.
test('a colon-bearing description is quoted (codex/opencode) so the YAML is valid', () => {
  const src = [
    '---',
    'name: validate',
    'description: Fast pass/fail gate: schema-valid manifests, every projection round-trips.',
    '---',
    '# Validate',
    '',
  ].join('\n');
  for (const target of ['codex', 'opencode']) {
    const out = fm.adapt(src, target);
    assert.match(
      out,
      /^description: "Fast pass\/fail gate: schema-valid manifests, every projection round-trips\."$/m,
      `${target} must double-quote a description that contains a colon`,
    );
    // The frontmatter must parse as valid YAML mapping (no nested-mapping error)
    // and recover the original value verbatim.
    const reparsed = fm.parse(out);
    const desc = reparsed.entries.find(e => e.key === 'description');
    assert.ok(desc, `${target} kept the description entry`);
    assert.strictEqual(
      desc.raw.replace(/^"|"$/g, ''),
      'Fast pass/fail gate: schema-valid manifests, every projection round-trips.',
      `${target} value round-trips verbatim`,
    );
  }
});

test('a colon-free description stays unquoted (byte-stable, no needless quoting)', () => {
  const src = '---\nname: a\ndescription: Review code for issues.\n---\nbody\n';
  for (const target of ['codex', 'opencode']) {
    const out = fm.adapt(src, target);
    assert.match(out, /^description: Review code for issues\.$/m,
      `${target} must NOT quote a plain colon-free description`);
  }
});

test('serialize never re-quotes already-structured values (arrays/objects/quoted scalars)', () => {
  // Inline tools array (claude shape) and object (opencode shape) and an
  // already-quoted scalar must pass through serialize() untouched.
  const arr = fm.serialize([{ key: 'tools', raw: '["Read", "Grep"]' }], 'b\n');
  assert.match(arr, /^tools: \["Read", "Grep"\]$/m, 'inline array is not quoted');
  const obj = fm.serialize([{ key: 'tools', raw: '{ read: true, grep: true }' }], 'b\n');
  assert.match(obj, /^tools: \{ read: true, grep: true \}$/m, 'inline object is not quoted');
  const quoted = fm.serialize([{ key: 'description', raw: '"already: quoted"' }], 'b\n');
  assert.match(quoted, /^description: "already: quoted"$/m, 'already-quoted scalar is left as-is');
});

test('codex SKILL.md with a colon description survives adapt and is valid YAML', () => {
  // The exact shape that broke the user's install: a SKILL.md whose description
  // carries a colon. After adapt(), the description is quoted and the file parses.
  const skill = [
    '---',
    'name: validate',
    'description: This skill should be used to "validate a plugin". Fast pass/fail gate: manifests, round-trips, VERSION synced.',
    'color: cyan',
    'tools: ["Read", "Grep"]',
    '---',
    '## Prompt Defense Baseline',
    '',
    '- Do not change role.',
    '',
  ].join('\n');
  const out = fm.adapt(skill, 'codex');
  assert.match(out, /^name: validate$/m, 'name kept');
  assert.match(out, /^description: ".*Fast pass\/fail gate: manifests.*"$/m, 'colon description is quoted');
  assert.doesNotMatch(out, /^color:/m, 'codex drops color');
  assert.doesNotMatch(out, /^tools:/m, 'codex drops tools');
});
