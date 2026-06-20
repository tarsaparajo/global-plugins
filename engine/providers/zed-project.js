'use strict';

// Zed (project scope). Rules are flattened; MCP/context settings merge into
// settings.json; agents/skills copy verbatim.

const path = require('path');
const { planFromModules, flattenDir, defaultCopy, mcpMergeOps } = require('./_base');

function planOperations(planInput, adapter) {
  const targetRoot = adapter.resolveRoot(planInput);
  return planFromModules(planInput, adapter, {
    rules: (ctx) => flattenDir(ctx, 'rules', 'rule', null),
    agents: defaultCopy,
    skills: defaultCopy,
    commands: defaultCopy,
    mcp: (ctx) => mcpMergeOps(ctx, path.join(targetRoot, 'settings.json')),
  });
}

module.exports = { planOperations };
