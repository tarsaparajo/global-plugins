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
