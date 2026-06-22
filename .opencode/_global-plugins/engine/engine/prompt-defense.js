'use strict';

// Prompt Defense Baseline injection. The canonical block is stored once at
// templates/prompt-defense-baseline.md and injected, verbatim, into every
// model-facing .md immediately after YAML frontmatter (and after an H1 if
// present), as a "## Prompt Defense Baseline" section. Idempotent.

const fs = require('fs');
const path = require('path');

const BASELINE_PATH = path.join(__dirname, '..', 'templates', 'prompt-defense-baseline.md');
const SECTION_HEADING = '## Prompt Defense Baseline';

let _baseline = null;
function baselineBlock() {
  if (_baseline === null) {
    _baseline = fs.readFileSync(BASELINE_PATH, 'utf8').trim();
  }
  return _baseline;
}

function hasBaseline(content) {
  return content.includes(SECTION_HEADING);
}

// Split off a leading YAML frontmatter block (--- ... ---) if present.
function splitFrontmatter(content) {
  const match = content.match(/^(---\n[\s\S]*?\n---\n)/);
  if (match) {
    return { frontmatter: match[1], body: content.slice(match[1].length) };
  }
  return { frontmatter: '', body: content };
}

// Inject the baseline after frontmatter and after a leading H1 if there is one.
function inject(content) {
  if (hasBaseline(content)) {
    return content;
  }
  const { frontmatter, body } = splitFrontmatter(content);
  const block = `${baselineBlock()}\n\n`;

  const lines = body.split('\n');
  // Skip leading blank lines.
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') {
    i += 1;
  }
  if (i < lines.length && /^#\s+/.test(lines[i])) {
    // Insert after the H1 (and one blank line).
    const head = lines.slice(0, i + 1).join('\n');
    const rest = lines.slice(i + 1).join('\n').replace(/^\n+/, '');
    return `${frontmatter}${head}\n\n${block}${rest}`;
  }
  return `${frontmatter}${block}${body.replace(/^\n+/, '')}`;
}

module.exports = {
  BASELINE_PATH,
  SECTION_HEADING,
  baselineBlock,
  hasBaseline,
  inject,
};
