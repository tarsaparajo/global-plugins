'use strict';

// Builder: assembles the projection plan for a whole plugin by resolving the
// manifests (resolver) and planning each target (projector). Also hosts the
// scaffold generators the executor calls for non-1:1 outputs (config.toml,
// single-file consolidation, install scripts, kiro agent json).

const { resolve } = require('./resolver');
const { planAll } = require('./projector');
const { collectComponents } = require('./providers/_base');

// Build a deterministic capability index (markdown) describing the agents,
// skills, and commands a plugin ships, derived from the canonical source. Each
// single-file provider embeds this index so the model is aware of every
// capability and where its body lives, rather than receiving an empty file.
function capabilityIndex(repoRoot, { bodyDir } = {}) {
  const groups = [
    { dir: 'agents', label: 'Agents', noun: 'agent' },
    { dir: 'skills', label: 'Skills', noun: 'skill' },
    { dir: 'commands', label: 'Commands', noun: 'command' },
  ];
  const lines = ['## Capability Index', ''];
  for (const g of groups) {
    const items = collectComponents(repoRoot, g.dir);
    if (!items.length) {
      continue;
    }
    lines.push(`### ${g.label}`, '');
    for (const it of items) {
      const where = bodyDir ? ` — \`${bodyDir}/${g.dir}/\`` : '';
      const desc = it.description ? ` — ${it.description}` : '';
      lines.push(`- **${it.name}**${desc}${where}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// Inline every component body under heading-addressable sections. Used by truly
// single-file providers (no sibling directory channel) so the index entries
// resolve to a heading in the same file.
function capabilityBodies(repoRoot) {
  const fs = require('fs');
  const path = require('path');
  const groups = [
    { dir: 'agents', noun: 'Agent' },
    { dir: 'skills', noun: 'Skill' },
    { dir: 'commands', noun: 'Command' },
  ];
  const out = [];
  for (const g of groups) {
    for (const it of collectComponents(repoRoot, g.dir)) {
      let body = '';
      try {
        body = fs.readFileSync(path.join(repoRoot, it.sourceRelativePath), 'utf8');
      } catch {
        continue;
      }
      // Strip the YAML frontmatter; the heading carries name + description.
      body = body.replace(/^---\n[\s\S]*?\n---\n?/, '');
      // Strip the per-file Prompt Defense Baseline block — the consolidated file
      // already carries it once at the top, so inlined bodies must not repeat it.
      body = body.replace(/##\s*Prompt Defense Baseline\n[\s\S]*?(?=\n##?\s|\n#\s|$)/, '');
      body = body.trim();
      out.push(`## ${g.noun}: ${it.name}\n`);
      if (it.description) {
        out.push(`> ${it.description}\n`);
      }
      out.push(`${body}\n`);
    }
  }
  return out.join('\n');
}

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
    return [
      '# Agents',
      '',
      'This plugin projects its agents as native Codex role files under',
      '`.codex/agents/*.toml`. Its skills and commands are installed as sibling',
      'files under `.codex/`; the index below names each capability.',
      '',
      capabilityIndex(ctx.repoRoot, { bodyDir: '.codex' }),
    ].join('\n');
  },
  'gemini:single-file'(op, ctx) {
    return [
      '# Plugin Instructions',
      '',
      'This file is the entry point for this plugin. The full agent, skill, and',
      'command bodies are installed as sibling files under `.gemini/`; the index',
      'below names each capability and where its body lives.',
      '',
      capabilityIndex(ctx.repoRoot, { bodyDir: '.gemini' }),
    ].join('\n');
  },
  'qwen:single-file'(op, ctx) {
    return [
      '# Qwen CLI Instructions',
      '',
      'This file is the entry point for this plugin. The full agent, skill, and',
      'command bodies are installed as sibling files under the same `.qwen/`',
      'root; the index below names each capability and where its body lives.',
      '',
      capabilityIndex(ctx.repoRoot, { bodyDir: '.qwen' }),
    ].join('\n');
  },
  'kiro:agent-json'(op) {
    return `${JSON.stringify({ source: op.sourceRelativePath, format: 'kiro-agent' }, null, 2)}\n`;
  },
  'install-script'() {
    return '#!/usr/bin/env bash\nset -euo pipefail\n# Generated install helper.\necho "Installed."\n';
  },
  'vscode:copilot-instructions'(op, ctx) {
    return [
      '# Copilot Instructions',
      '',
      'This plugin integrates with VS Code through GitHub Copilot. The index',
      'below names every agent, skill, and command; the full bodies follow as',
      'heading-addressable sections so Copilot can load any of them on demand.',
      '',
      capabilityIndex(ctx.repoRoot),
      '',
      capabilityBodies(ctx.repoRoot),
    ].join('\n');
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
