'use strict';

// Claude (home scope). Canonical components map almost 1:1 into ~/.claude.
// MCP config is merged into .mcp.json; hooks keep ${CLAUDE_PLUGIN_ROOT}.

const path = require('path');
const { planFromModules, defaultCopy, mcpMergeOps } = require('./_base');

function planOperations(planInput, adapter) {
  const targetRoot = adapter.resolveRoot(planInput);
  return planFromModules(planInput, adapter, {
    // Merge canonical mcp/*.json into .mcp.json at the target root.
    mcp: (ctx) => mcpMergeOps(ctx, path.join(targetRoot, '.mcp.json')),
    // agents, skills, commands, hooks, rules -> verbatim copy.
    agents: defaultCopy,
    skills: defaultCopy,
    commands: defaultCopy,
    hooks: defaultCopy,
    rules: defaultCopy,
  });
}

module.exports = { planOperations };
