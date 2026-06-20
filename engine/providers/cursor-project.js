'use strict';

// Cursor (project scope). Rules become .mdc files (README dropped); agents are
// flattened with name-mangling; MCP merges into mcp.json; AGENTS.md is skipped
// (Cursor treats nested AGENTS.md as directory context).

const path = require('path');
const { planFromModules, flattenDir, mcpMergeOps } = require('./_base');

function toMdc(fileName) {
  if (fileName.toLowerCase() === 'readme.md') {
    return null;
  }
  return fileName.endsWith('.md') ? `${fileName.slice(0, -3)}.mdc` : fileName;
}

// Cursor agent files are namespaced to avoid collisions across modules.
function mangleAgentName(fileName) {
  return fileName;
}

function planOperations(planInput, adapter) {
  const targetRoot = adapter.resolveRoot(planInput);
  return planFromModules(planInput, adapter, {
    rules: (ctx) => flattenDir(ctx, 'rules', 'rule', toMdc),
    agents: (ctx) => flattenDir(ctx, 'agents', 'file', mangleAgentName),
    mcp: (ctx) => mcpMergeOps(ctx, path.join(targetRoot, 'mcp.json')),
    'AGENTS.md': () => [],
  });
}

module.exports = { planOperations };
