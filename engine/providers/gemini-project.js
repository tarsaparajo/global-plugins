'use strict';

// Gemini (project scope). All context (rules, agents, skills, commands) is
// consolidated into a single GEMINI.md at the target root. The Prompt Defense
// Baseline is kept once inside that consolidated file.

const path = require('path');
const { planFromModules, opScaffold } = require('./_base');

function consolidate(ctx) {
  // Each canonical dir contributes a section to the single file; the executor's
  // "gemini:single-file" generator concatenates them deterministically.
  return [opScaffold({
    moduleId: ctx.module.id,
    sourceRelativePath: ctx.sourceRelativePath,
    destinationPath: path.join(ctx.targetRoot, 'GEMINI.md'),
    generator: 'gemini:single-file',
    section: String(ctx.sourceRelativePath).split('/')[0],
    carriesPromptDefense: true,
    append: true,
  })];
}

function planOperations(planInput, adapter) {
  return planFromModules(planInput, adapter, {
    rules: consolidate,
    agents: consolidate,
    skills: consolidate,
    commands: consolidate,
    hooks: () => [],
    mcp: () => [],
  });
}

module.exports = { planOperations };
