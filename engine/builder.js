'use strict';

// Builder: assembles the projection plan for a whole plugin by resolving the
// manifests (resolver) and planning each target (projector). Also hosts the
// scaffold generators the executor calls for non-1:1 outputs (config.toml,
// single-file consolidation, install scripts, kiro agent json).

const { resolve } = require('./resolver');
const { planAll } = require('./projector');

// Build the full multi-target projection plan for a plugin.
function buildProjectionPlan(pluginRoot, request = {}) {
  const { modules, targets, manifests } = resolve(pluginRoot, request);
  const plans = planAll(targets, {
    repoRoot: pluginRoot,
    projectRoot: request.projectRoot || pluginRoot,
    homeDir: request.homeDir,
    modules,
  });
  return { manifests, modules, targets, plans };
}

// Scaffold generators: generator-name -> function(op, ctx) => string content.
// These produce deterministic content for non-copy operations.
const generators = {
  'codex:config-toml'(op) {
    const defense = require('./prompt-defense').baselineBlock();
    return [
      '#:schema https://developers.openai.com/codex/config-schema.json',
      '',
      'approval_policy = "on-request"',
      'sandbox_mode = "workspace-write"',
      '',
      'prompt_defense_baseline = """',
      defense,
      '"""',
      '',
    ].join('\n');
  },
  'codex:agents-md'(op, ctx) {
    return `# Agents\n\nProjected agent index for this plugin.\n`;
  },
  'gemini:single-file'(op) {
    return `\n<!-- section: ${op.section} -->\n`;
  },
  'qwen:single-file'(op) {
    return `\n<!-- section: ${op.section} -->\n`;
  },
  'kiro:agent-json'(op) {
    return `${JSON.stringify({ source: op.sourceRelativePath, format: 'kiro-agent' }, null, 2)}\n`;
  },
  'install-script'() {
    return '#!/usr/bin/env bash\nset -euo pipefail\n# Generated install helper.\necho "Installed."\n';
  },
  'vscode:copilot-instructions'(op) {
    return `\n<!-- section: ${op.section} -->\n`;
  },
  'vscode:settings'() {
    return `${JSON.stringify({
      'chat.promptFiles': true,
      'github.copilot.chat.codeGeneration.instructions': [
        { file: '.github/copilot-instructions.md' },
      ],
      'github.copilot.chat.testGeneration.instructions': [
        { file: '.github/copilot-instructions.md' },
      ],
    }, null, 2)}\n`;
  },
};

module.exports = { buildProjectionPlan, generators };
