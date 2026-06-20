'use strict';

// OpenCode (home scope). Canonical components are copied, then a compiled
// TypeScript plugin payload is produced under .opencode/dist/. The build step
// MUST run before validate() succeeds; planFromModules appends it (via the
// adapter.buildStep) and validate() hard-fails if dist artefacts are missing.

const fs = require('fs');
const path = require('path');
const { planFromModules, defaultCopy, transformAgents } = require('./_base');
const { buildValidationIssue } = require('../helpers');

const REQUIRED_ARTEFACTS = Object.freeze([
  { rel: path.join('.opencode', 'dist', 'index.js'), type: 'file' },
  { rel: path.join('.opencode', 'dist', 'plugins'), type: 'directory' },
  { rel: path.join('.opencode', 'dist', 'tools'), type: 'directory' },
]);

function isExpectedType(absPath, type) {
  try {
    const stat = fs.statSync(absPath);
    return type === 'file' ? stat.isFile() : stat.isDirectory();
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) {
      return false;
    }
    throw error;
  }
}

// Validate checks the build payload at the OUTPUT root (where the projection is
// written and where the build step produces dist/), resolved from the adapter.
// Planning is allowed before the build; the projector runs the build step
// first, then validation confirms the artefacts exist.
function validate(input, adapter) {
  if (input.skipBuildCheck) {
    return [];
  }
  // Resolve the output root the same way the adapter resolves its target root,
  // minus the .opencode segment (REQUIRED_ARTEFACTS paths include it).
  let outputBase;
  try {
    outputBase = adapter ? path.dirname(adapter.resolveRoot(input)) : (input.projectRoot || input.homeDir || input.repoRoot);
  } catch {
    return [];
  }
  if (!outputBase) {
    return [];
  }
  const missing = REQUIRED_ARTEFACTS
    .filter(a => !isExpectedType(path.join(outputBase, a.rel), a.type))
    .map(a => a.rel);
  if (missing.length === 0) {
    return [];
  }
  return [buildValidationIssue(
    'error',
    'opencode-plugin-not-built',
    `OpenCode install requires the compiled payload under .opencode/dist; missing: ${missing.join(', ')}. `
      + 'Run "node engine/build-opencode.js" before re-running the projector.',
    { missing }
  )];
}

function planOperations(planInput, adapter) {
  return planFromModules(planInput, adapter, {
    // Agents carry Claude-native frontmatter (array tools, `color`, bare
    // `model`) that OpenCode's schema rejects; rewrite each into OpenCode's
    // agent shape (object tools, provider/model, mode) under .opencode/agents.
    agents: (ctx) => transformAgents(ctx, 'opencode-agent', 'agents', onlyMarkdown),
    skills: defaultCopy,
    commands: defaultCopy,
    hooks: defaultCopy,
    rules: defaultCopy,
    mcp: defaultCopy,
  });
}

// Keep only markdown agent files (preserving relative path); non-md companions
// are skipped — OpenCode agents are markdown.
function onlyMarkdown(rel) {
  return rel.endsWith('.md') ? rel : null;
}

module.exports = { planOperations, validate };
