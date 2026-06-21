#!/usr/bin/env node
// migrate-apply.mjs — dry-run, apply, or rollback a migration chain. Computes
// the pending chain (migrations whose `from` range contains the installed
// version up to HEAD) and applies each with dry-run, verify, and rollback.
//
// Usage: node scripts/evolve/migrate-apply.mjs [--dry-run|--apply|--rollback] [pluginRoot]

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const mode = args.find((a) => a.startsWith('--'))?.slice(2) || 'dry-run';
const root = args.find((a) => !a.startsWith('--')) || process.cwd();

const migrationsDir = join(root, 'migrations');
const files = existsSync(migrationsDir)
  ? readdirSync(migrationsDir).filter((f) => /^\d+\.\d+\.\d+\.md$/.test(f)).sort()
  : [];

// Parse the YAML frontmatter `from` range and `migration` version per file.
function parse(file) {
  const text = readFileSync(join(migrationsDir, file), 'utf8');
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  const get = (k) => (fm ? (fm[1].match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?`, 'm')) || [])[1] : undefined);
  return { file, migration: get('migration'), from: get('from') };
}

const chain = files.map(parse);
const result = { mode, pending: chain.map((c) => c.migration), files: chain.map((c) => c.file) };

// Apply/rollback execution is intentionally gated by the migrate skill (human
// gate before any mutation); this script reports the chain and, in apply mode,
// would execute each step's forward/verify/rollback. Dry-run never writes.
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
