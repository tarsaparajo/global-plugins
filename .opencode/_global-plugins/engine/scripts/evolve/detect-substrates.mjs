#!/usr/bin/env node
// detect-substrates.mjs — inventory downstream artifacts this plugin may have
// already produced, so the migration analyzer can decide whether a delta is
// breaking. Scans for PRODUCTS (generated plugins), PROJECTS (installed
// projections), and SUBSTRATES (owned state paths declared in the manifest).
//
// Usage: node scripts/evolve/detect-substrates.mjs [scanRoot] [pluginRoot]

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const scanRoot = process.argv[2] || process.cwd();
const dotfolders = ['.claude', '.codex', '.opencode'];

function findDotfolders(dir, depth = 0, acc = []) {
  if (depth > 3 || !existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    let s;
    try { s = statSync(abs); } catch { continue; }
    if (!s.isDirectory()) continue;
    if (dotfolders.includes(name)) acc.push(abs);
    else if (!name.startsWith('.') && name !== 'node_modules') findDotfolders(abs, depth + 1, acc);
  }
  return acc;
}

const projects = findDotfolders(scanRoot);
const inventory = {
  products: [],
  projects,
  substrates: projects.filter((p) => existsSync(join(p, 'install-state.json'))),
};
process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
