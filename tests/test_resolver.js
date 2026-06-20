'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

const PLUGIN_ROOT = path.join(__dirname, '..');
const { resolve } = require('../engine/resolver');

test('resolver expands a profile into its module set', () => {
  const r = resolve(PLUGIN_ROOT, { profile: 'minimal' });
  const ids = r.modules.map(m => m.id);
  assert.ok(ids.includes('engine-core'));
  assert.ok(ids.includes('agents-core'));
  assert.ok(ids.includes('skills-core'));
});

test('resolver pulls in transitive dependencies', () => {
  const r = resolve(PLUGIN_ROOT, { modules: ['skills-core'] });
  const ids = r.modules.map(m => m.id);
  assert.ok(ids.includes('agents-core'), 'skills-core depends on agents-core');
  assert.ok(ids.includes('engine-core'), 'skills-core depends on engine-core');
});

test('resolver resolves all fourteen provider targets', () => {
  const r = resolve(PLUGIN_ROOT, { targets: ['all'] });
  assert.strictEqual(r.targets.length, 14);
  for (const t of ['claude', 'claude-project', 'cursor', 'codex', 'opencode', 'gemini', 'qwen', 'zed', 'kiro', 'codebuddy', 'joycode', 'antigravity', 'trae', 'vscode']) {
    assert.ok(r.targets.includes(t), `missing target ${t}`);
  }
});

test('resolver filters targets when a subset is requested', () => {
  const r = resolve(PLUGIN_ROOT, { targets: ['cursor', 'codex'] });
  assert.deepStrictEqual(r.targets.sort(), ['codex', 'cursor']);
});

test('resolver throws on an unknown profile', () => {
  assert.throws(() => resolve(PLUGIN_ROOT, { profile: 'nope' }));
});
