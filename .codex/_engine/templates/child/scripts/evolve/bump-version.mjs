#!/usr/bin/env node
// bump-version.mjs — bump SemVer, write the CHANGELOG entry, refresh the
// projection lock, and sync the version across manifests. Level is derived from
// the change set (major|minor|patch) or passed explicitly.
//
// Usage: node scripts/evolve/bump-version.mjs <major|minor|patch> [pluginRoot]

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const level = process.argv[2] || 'patch';
const root = process.argv[3] || process.cwd();
const enginePath = join(root, 'engine');
const semver = require(join(enginePath, 'semver.js'));

const current = semver.readVersion(root);
const next = semver.bump(current, level);
semver.writeVersion(root, next);
const sync = semver.sync(root);

// Refresh projection lock (content-hash every canonical file).
function listFiles(dir, prefix = '') {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const abs = join(dir, name);
    const rel = prefix ? posix.join(prefix, name) : name;
    if (statSync(abs).isDirectory()) out.push(...listFiles(abs, rel));
    else out.push(rel);
  }
  return out;
}
const canonicalDir = join(root, 'canonical');
const files = {};
for (const rel of listFiles(canonicalDir)) {
  files[rel] = `sha256:${createHash('sha256').update(readFileSync(join(canonicalDir, rel))).digest('hex')}`;
}
const lockPath = join(root, '.evolution', 'baseline', 'projection.lock.json');
writeFileSync(lockPath, `${JSON.stringify({ version: next, files }, null, 2)}\n`);

process.stdout.write(`${JSON.stringify({ from: current, to: next, level, synced: sync.written }, null, 2)}\n`);
