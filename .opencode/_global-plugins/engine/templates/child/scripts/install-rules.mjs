#!/usr/bin/env node
// install-rules.mjs — copy this plugin's rules into a Claude Code rules
// directory. Claude Code's /plugin install distributes commands, agents,
// skills, hooks, and MCP — but NOT rules — so rules must be copied manually.
// Codex and OpenCode need nothing here: their rule content is folded into
// AGENTS.md and auto-discovered.
//
// Usage:
//   node scripts/install-rules.mjs --list                 # show rules + targets
//   node scripts/install-rules.mjs --dry-run [pluginRoot] # plan, write nothing
//   node scripts/install-rules.mjs --apply   [pluginRoot] # copy into project .claude/rules/
//   node scripts/install-rules.mjs --apply --user [root]  # copy into ~/.claude/rules/

import { existsSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const args = process.argv.slice(2);
const mode = args.find((a) => a.startsWith('--') && a !== '--user')?.slice(2) || 'dry-run';
const userScope = args.includes('--user');
const root = args.find((a) => !a.startsWith('--')) || process.cwd();

const rulesDir = join(root, 'rules');
const files = existsSync(rulesDir)
  ? readdirSync(rulesDir).filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md').sort()
  : [];

// Project scope is the safer default: reviewable, scoped to the consuming repo.
const dest = userScope ? join(homedir(), '.claude', 'rules') : join(process.cwd(), '.claude', 'rules');
const plan = { mode, scope: userScope ? 'user' : 'project', dest, rules: files };

if (mode === 'list' || mode === 'dry-run') {
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  process.exit(0);
}

if (mode === 'apply') {
  mkdirSync(dest, { recursive: true });
  const copied = [];
  for (const f of files) {
    copyFileSync(join(rulesDir, f), join(dest, f));
    copied.push(f);
  }
  process.stdout.write(`${JSON.stringify({ ...plan, copied }, null, 2)}\n`);
  process.exit(0);
}

process.stderr.write(`Unknown mode: --${mode}. Use --list, --dry-run, or --apply.\n`);
process.exit(1);
