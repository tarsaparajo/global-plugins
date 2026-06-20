'use strict';

// Codex (home scope). Agents are emitted as TOML; a consolidated AGENTS.md and
// config.toml are scaffolded at the target root. The Prompt Defense Baseline is
// carried as a string field inside config.toml.

const path = require('path');
const { planFromModules, defaultCopy, transformAgents, opScaffold } = require('./_base');

// Agents are emitted as real TOML. Source markdown agent files are renamed
// .md -> .toml and their frontmatter+body rewritten into a TOML document;
// non-markdown files are skipped (Codex agents are TOML).
function toTomlName(rel) {
  if (!rel.endsWith('.md')) {
    return null;
  }
  return `${rel.slice(0, -3)}.toml`;
}

function planOperations(planInput, adapter) {
  const targetRoot = adapter.resolveRoot(planInput);
  const ops = planFromModules(planInput, adapter, {
    // Agents become native Codex role TOML files (frontmatter+body rewritten
    // into valid TOML); skills and commands keep their real bodies as sibling
    // files, indexed from AGENTS.md.
    agents: (ctx) => transformAgents(ctx, 'codex-agent-toml', 'agents', toTomlName),
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
