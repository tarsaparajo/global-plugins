'use strict';

// Codex (home scope). Agents are emitted as TOML; a consolidated AGENTS.md and
// config.toml are scaffolded at the target root. The Prompt Defense Baseline is
// carried as a string field inside config.toml.

const path = require('path');
const { planFromModules, defaultCopy, flattenDir, opScaffold } = require('./_base');

function toToml(fileName) {
  return fileName.endsWith('.md') ? `${fileName.slice(0, -3)}.toml` : fileName;
}

function planOperations(planInput, adapter) {
  const targetRoot = adapter.resolveRoot(planInput);
  const ops = planFromModules(planInput, adapter, {
    // Agents become native Codex role TOML files; skills and commands keep their
    // real bodies as sibling files, indexed from AGENTS.md.
    agents: (ctx) => flattenDir(ctx, 'agents', 'file', toToml),
    skills: defaultCopy,
    commands: defaultCopy,
    rules: () => [],
    hooks: () => [],
    mcp: () => [],
  });

  ops.push(opScaffold({
    moduleId: '__codex__',
    sourceRelativePath: 'AGENTS.md',
    destinationPath: path.join(targetRoot, 'AGENTS.md'),
    generator: 'codex:agents-md',
  }));
  ops.push(opScaffold({
    moduleId: '__codex__',
    sourceRelativePath: null,
    destinationPath: path.join(targetRoot, 'config.toml'),
    generator: 'codex:config-toml',
    carriesPromptDefense: true,
  }));

  return ops;
}

module.exports = { planOperations };
