'use strict';

// Kiro (project scope). Agents are emitted in BOTH .md and .json form; MCP
// merges into settings/mcp.json; rules are flattened. Marked beta in the
// registry until broader verification.

const path = require('path');
const { planFromModules, flattenDir, defaultCopy, mcpMergeOps } = require('./_base');
const { opScaffold } = require('../helpers');

function planOperations(planInput, adapter) {
  const targetRoot = adapter.resolveRoot(planInput);
  return planFromModules(planInput, adapter, {
    agents: (ctx) => {
      const md = flattenDir(ctx, 'agents', 'file', (name) => name);
      // Emit a parallel .json sidecar for each agent .md.
      const json = flattenDir(ctx, 'agents', 'file', (name) =>
        name.endsWith('.md') ? `${name.slice(0, -3)}.json` : null)
        .map(op => opScaffold({
          moduleId: op.moduleId,
          sourceRelativePath: op.sourceRelativePath,
          destinationPath: op.destinationPath,
          generator: 'kiro:agent-json',
        }));
      return [...md, ...json];
    },
    rules: (ctx) => flattenDir(ctx, 'rules', 'rule', null),
    skills: defaultCopy,
    commands: defaultCopy,
    mcp: (ctx) => mcpMergeOps(ctx, path.join(targetRoot, 'settings', 'mcp.json')),
  });
}

module.exports = { planOperations };
