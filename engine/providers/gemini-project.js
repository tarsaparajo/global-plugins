'use strict';

// Gemini (project scope). Gemini reads a single GEMINI.md entry file, but its
// root is a directory, so the real agent/skill/command bodies are copied as
// sibling files and GEMINI.md is generated as a capability index that points at
// them — never an empty consolidation.

const path = require('path');
const { planFromModules, defaultCopy, opScaffold } = require('./_base');

// Emit the GEMINI.md index once. The shared destination dedupes to a single op;
// the generator derives its content from the whole canonical source.
function indexOp(ctx) {
  return opScaffold({
    moduleId: ctx.module.id,
    sourceRelativePath: null,
    destinationPath: path.join(ctx.targetRoot, 'GEMINI.md'),
    generator: 'gemini:single-file',
    carriesPromptDefense: true,
    append: false,
  });
}

// Copy the real bodies AND contribute the single index op.
function copyAndIndex(ctx) {
  return [...defaultCopy(ctx), indexOp(ctx)];
}

function planOperations(planInput, adapter) {
  return planFromModules(planInput, adapter, {
    rules: defaultCopy,
    agents: copyAndIndex,
    skills: copyAndIndex,
    commands: copyAndIndex,
    hooks: () => [],
    mcp: () => [],
  });
}

module.exports = { planOperations };
