'use strict';

// Qwen (home scope). Same single-file consolidation shape as Gemini, into
// QWEN.md at the target root.

const path = require('path');
const { planFromModules, opScaffold } = require('./_base');

function consolidate(ctx) {
  return [opScaffold({
    moduleId: ctx.module.id,
    sourceRelativePath: ctx.sourceRelativePath,
    destinationPath: path.join(ctx.targetRoot, 'QWEN.md'),
    generator: 'qwen:single-file',
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
