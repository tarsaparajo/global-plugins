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

test('claude is a no-op — canonical IS the Claude shape', () => {
  assert.strictEqual(fm.adapt(AGENT, 'claude'), AGENT);
  assert.strictEqual(fm.adapt(AGENT, undefined), AGENT);
});

test('opencode rewrites tools array -> object and model alias -> provider/model', () => {
  const out = fm.adapt(AGENT, 'opencode');
  assert.match(out, /^name: reviewer$/m);
  assert.match(out, /^description: Review code for issues\.$/m);
  assert.doesNotMatch(out, /^tools:\s*\[/m, 'tools array must not survive');
  assert.match(out, /^tools:\s*\{ read: true, grep: true, bash: true \}$/m);
  assert.match(out, /^model:\s*anthropic\/claude-sonnet/m);
  assert.match(out, /^color:\s*cyan$/m, 'opencode keeps a color field');
  assert.match(out, /Body stays untouched\./, 'body is preserved');
});

test('opencode drops model when the alias is inherit', () => {
  const src = '---\nname: a\ndescription: d\nmodel: inherit\n---\nbody\n';
  const out = fm.adapt(src, 'opencode');
  assert.doesNotMatch(out, /^model:/m, 'inherit -> dropped (OpenCode inherits global)');
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

test('unknown / already-qualified model ids pass through on opencode', () => {
  const src = '---\nname: a\ndescription: d\nmodel: anthropic/claude-opus-4-5\n---\nb\n';
  const out = fm.adapt(src, 'opencode');
  assert.match(out, /^model:\s*anthropic\/claude-opus-4-5$/m);
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
