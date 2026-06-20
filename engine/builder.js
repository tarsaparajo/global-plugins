'use strict';

// Builder: assembles the projection plan for a whole plugin by resolving the
// manifests (resolver) and planning each target (projector). Also hosts the
// scaffold generators the executor calls for non-1:1 outputs (the codex
// AGENTS.md capability index and config.toml).

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

// Fold any canonical rules/*.md bodies into a "Conventions / Rules" section.
// Codex and OpenCode read instruction rules from their single AGENTS.md, so a
// plugin that ships a rules/ layer has it folded here. Empty (no section) when
// there is no rules/ dir — so plugins without rules are unaffected.
function foldedRules(repoRoot) {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(repoRoot, 'rules');
  let files = [];
  try {
    files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f.toLowerCase() !== 'readme.md').sort();
  } catch {
    return '';
  }
  if (!files.length) {
    return '';
  }
  const out = ['## Conventions / Rules', ''];
  for (const f of files) {
    let body = fs.readFileSync(path.join(dir, f), 'utf8');
    body = body.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
    out.push(body, '');
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
    const rules = foldedRules(ctx.repoRoot);
    return [
      '# Agents',
      '',
      'This plugin projects its agents as native Codex role files under',
      '`.codex/agents/*.toml`. Its skills and commands are installed as sibling',
      'files under `.codex/`; the index below names each capability.',
      '',
      capabilityIndex(ctx.repoRoot, { bodyDir: '.codex' }),
      ...(rules ? ['', rules] : []),
    ].join('\n');
  },
};

module.exports = { buildProjectionPlan, generators };
