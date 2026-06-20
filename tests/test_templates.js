'use strict';

const test = require('node:test');
const assert = require('node:assert');

const promptDefense = require('../engine/prompt-defense');

test('prompt-defense baseline is six bullets', () => {
  const block = promptDefense.baselineBlock();
  const bullets = block.split('\n').filter(l => l.trim().startsWith('- '));
  assert.strictEqual(bullets.length, 6);
});

test('inject adds the baseline after frontmatter', () => {
  const input = '---\nname: x\n---\n# Title\n\nBody.\n';
  const out = promptDefense.inject(input);
  assert.ok(out.includes('## Prompt Defense Baseline'));
  assert.ok(out.indexOf('---\nname: x\n---') === 0, 'frontmatter preserved at top');
  assert.ok(out.indexOf('# Title') < out.indexOf('## Prompt Defense Baseline'), 'baseline after H1');
});

test('inject is idempotent', () => {
  const input = '---\nname: x\n---\n# Title\n\nBody.\n';
  const once = promptDefense.inject(input);
  const twice = promptDefense.inject(once);
  assert.strictEqual(once, twice);
});

test('inject handles files with no frontmatter', () => {
  const input = '# Title\n\nBody.\n';
  const out = promptDefense.inject(input);
  assert.ok(out.includes('## Prompt Defense Baseline'));
});
