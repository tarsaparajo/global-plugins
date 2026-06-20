'use strict';

// Unit tests for the agent frontmatter transforms. These guard the bug where
// Claude-native agent frontmatter (array `tools`, `color: cyan`, bare `model`)
// leaked verbatim into providers whose schemas reject that shape (OpenCode,
// Codex). The assertions encode each target's documented schema.

const test = require('node:test');
const assert = require('node:assert');

const fm = require('../engine/frontmatter');

const CLAUDE_AGENT = [
  '---',
  'name: reviewer',
  'description: Reviews code for quality and best practices',
  'tools: ["Read", "Grep", "Glob", "Bash"]',
  'model: sonnet',
  'color: cyan',
  '---',
  '# Reviewer',
  '',
  'Review code.',
  '',
].join('\n');

test('parse: reads scalars, inline arrays, and separates the body', () => {
  const { data, body } = fm.parse(CLAUDE_AGENT);
  assert.strictEqual(data.name, 'reviewer');
  assert.strictEqual(data.description, 'Reviews code for quality and best practices');
  assert.deepStrictEqual(data.tools, ['Read', 'Grep', 'Glob', 'Bash']);
  assert.strictEqual(data.model, 'sonnet');
  assert.strictEqual(data.color, 'cyan');
  assert.ok(body.includes('# Reviewer'));
});

test('parse: content without frontmatter returns empty data and full body', () => {
  const { data, body } = fm.parse('# Just a heading\n');
  assert.deepStrictEqual(data, {});
  assert.strictEqual(body, '# Just a heading\n');
});

test('toOpenCodeAgent: tools array becomes a lowercase object map', () => {
  const out = fm.toOpenCodeAgent(CLAUDE_AGENT);
  const { data } = fm.parse(out);
  assert.strictEqual(typeof data.tools, 'object');
  assert.ok(!Array.isArray(data.tools), 'tools must be an object, not an array');
  assert.deepStrictEqual(data.tools, { read: true, grep: true, glob: true, bash: true });
});

test('toOpenCodeAgent: drops the Claude-only color field', () => {
  const out = fm.toOpenCodeAgent(CLAUDE_AGENT);
  const { data } = fm.parse(out);
  assert.ok(!('color' in data), 'color must not be emitted for OpenCode');
});

test('toOpenCodeAgent: normalizes the bare model alias to provider/model', () => {
  const out = fm.toOpenCodeAgent(CLAUDE_AGENT);
  const { data } = fm.parse(out);
  assert.ok(String(data.model).includes('/'), 'model must be a provider/model id');
  assert.ok(String(data.model).startsWith('anthropic/'));
});

test('toOpenCodeAgent: unmappable model is dropped, not emitted invalid', () => {
  const out = fm.toOpenCodeAgent('---\nname: x\nmodel: some-unknown-alias\n---\nbody\n');
  const { data } = fm.parse(out);
  assert.ok(!('model' in data), 'unknown model alias should be dropped');
});

test('toOpenCodeAgent: stamps mode subagent and preserves description', () => {
  const out = fm.toOpenCodeAgent(CLAUDE_AGENT);
  const { data, body } = fm.parse(out);
  assert.strictEqual(data.mode, 'subagent');
  assert.strictEqual(data.description, 'Reviews code for quality and best practices');
  assert.ok(body.includes('Review code.'));
});

test('toOpenCodeAgent: an already provider-prefixed model passes through', () => {
  const out = fm.toOpenCodeAgent('---\nname: x\nmodel: anthropic/claude-opus-4-1\n---\nbody\n');
  const { data } = fm.parse(out);
  assert.strictEqual(data.model, 'anthropic/claude-opus-4-1');
});

test('toCodexAgentToml: emits valid TOML scalars, array, and instructions', () => {
  const out = fm.toCodexAgentToml(CLAUDE_AGENT);
  assert.ok(out.includes('name = "reviewer"'));
  assert.ok(out.includes('description = "Reviews code for quality and best practices"'));
  assert.ok(out.includes('tools = ["read", "grep", "glob", "bash"]'));
  assert.ok(/instructions = """[\s\S]*Review code\.[\s\S]*"""/.test(out));
  // No leftover YAML frontmatter fences.
  assert.ok(!out.includes('---'), 'TOML output must not contain YAML fences');
  assert.ok(!out.includes('color'), 'color is a Claude-only field');
});

test('serialize: round-trips a transformed object deterministically', () => {
  const out1 = fm.toOpenCodeAgent(CLAUDE_AGENT);
  const out2 = fm.toOpenCodeAgent(CLAUDE_AGENT);
  assert.strictEqual(out1, out2, 'transform must be deterministic');
});
