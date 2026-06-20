'use strict';

// Antigravity (project scope, .agent root). Remaps canonical vocabulary:
// commands -> workflows, agents -> skills. Rules flattened. Only supports a
// module if it has a non-foreign path (supportsModule: non-empty-paths).

const { planFromModules, flattenDir, defaultCopy } = require('./_base');

function planOperations(planInput, adapter) {
  return planFromModules(planInput, adapter, {
    rules: (ctx) => flattenDir(ctx, 'rules', 'rule', null),
    // agents -> skills/
    agents: (ctx) => flattenDir(ctx, 'skills', 'file', (name) => name),
    // commands -> workflows/
    commands: (ctx) => flattenDir(ctx, 'workflows', 'file', (name) => name),
    skills: defaultCopy,
    mcp: defaultCopy,
  });
}

module.exports = { planOperations };
