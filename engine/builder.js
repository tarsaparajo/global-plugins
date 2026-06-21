'use strict';

// Builder: assembles the projection plan for a whole plugin by resolving the
// manifests (resolver) and planning each target (projector). Also hosts the
// scaffold generators the executor calls for non-1:1 outputs (the codex
// AGENTS.md capability index and config.toml).

const { resolve } = require('./resolver');
const { planAll } = require('./projector');
const { collectComponents } = require('./providers/_base');

// Escape a value for a TOML basic string (double-quoted). Newlines are folded to
// spaces; backslashes and quotes are escaped. Codex agent descriptions are short
// single-line strings, so this stays simple and deterministic.
function tomlString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s*\n\s*/g, ' ').trim()}"`;
}

// Re-express canonical agents as Codex `[agents.<name>]` config.toml tables. Each
// canonical agent contributes its name + description (the only fields Codex's
// native agent-table schema carries: config_file / description /
// nickname_candidates). Other frontmatter (a tools array, a named color) has NO
// Codex slot and is intentionally NOT emitted here — it is dropped from
// frontmatter and, where a real equivalent exists, re-expressed by the agentic
// projector (color -> openai.yaml interface.brand_color, etc.). `model` is never
// preset on any provider (a CLI/runtime choice), so it never reaches here.
function codexAgentTables(repoRoot) {
  const agents = collectComponents(repoRoot, 'agents');
  if (!agents.length) {
    return '';
  }
  const out = ['', '# Custom agents (native Codex [agents.<name>] tables).',
    '# Re-expressed from canonical agents; their guidance is indexed in AGENTS.md.'];
  for (const a of agents) {
    out.push('', `[agents.${a.name}]`);
    if (a.description) {
      out.push(`description = ${tomlString(a.description)}`);
    }
  }
  return `${out.join('\n')}\n`;
}

// Build a deterministic capability index (markdown) describing the agents,
// skills, and commands a plugin ships, derived from the canonical source. Each
// single-file provider embeds this index so the model is aware of every
// capability and where its body lives, rather than receiving an empty file.
function capabilityIndex(repoRoot, { bodyDir } = {}) {
  const groups = [
    // Codex agents are re-expressed as config.toml [agents.<name>] tables, not
    // files under .codex/agents/ — so the agents group points at config.toml.
    { dir: 'agents', label: 'Agents', noun: 'agent', whereOverride: 'config.toml `[agents.<name>]`' },
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
      let where = '';
      if (g.whereOverride) {
        where = ` — ${g.whereOverride}`;
      } else if (bodyDir) {
        where = ` — \`${bodyDir}/${g.dir}/\``;
      }
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
  'codex:config-toml'(op, ctx) {
    const defense = require('./prompt-defense').baselineBlock();
    const agentTables = codexAgentTables(ctx.repoRoot);
    return [
      '#:schema https://developers.openai.com/codex/config-schema.json',
      '',
      'approval_policy = "on-request"',
      'sandbox_mode = "workspace-write"',
      '',
      'prompt_defense_baseline = """',
      defense,
      '"""',
      agentTables,
    ].join('\n');
  },
  'codex:agents-md'(op, ctx) {
    const rules = foldedRules(ctx.repoRoot);
    return [
      '# Agents',
      '',
      'This plugin re-expresses its agents as native Codex `[agents.<name>]`',
      'tables in `config.toml`; their roles are named in the index below. Skills',
      'and commands are installed as sibling files under `.codex/` (skill',
      'frontmatter reduced to Codex\'s `name` + `description`). Provider-specific',
      'agent metadata that has no Codex frontmatter slot (named color, a tools',
      'array) is intentionally not carried here; `model` is never preset on any',
      'provider (a CLI/runtime choice).',
      '',
      capabilityIndex(ctx.repoRoot, { bodyDir: '.codex' }),
      ...(rules ? ['', rules] : []),
    ].join('\n');
  },
};

module.exports = { buildProjectionPlan, generators };
