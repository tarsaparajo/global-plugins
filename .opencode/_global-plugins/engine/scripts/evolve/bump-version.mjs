#!/usr/bin/env node
// bump-version.mjs — bump SemVer, write the CHANGELOG entry, refresh the
// projection lock, and sync the version across manifests. Level is derived from
// the change set (major|minor|patch) or passed explicitly.
//
// Usage: node scripts/evolve/bump-version.mjs <major|minor|patch> [pluginRoot]

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, posix, resolve as resolvePath } from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const level = process.argv[2] || 'patch';
// Absolute: a relative root ("." ) makes join(root,'engine') a bare specifier
// require() mis-resolves as a node_modules package.
const root = resolvePath(process.argv[3] || process.cwd());
const enginePath = join(root, 'engine');
const semver = require(join(enginePath, 'semver.js'));

const current = semver.readVersion(root);
const next = semver.bump(current, level);
semver.writeVersion(root, next);
// Fan VERSION out to ALL markers: plugin.json, marketplace.json, package.json, and
// every README version badge (root + locales) — per knowledge/bump-protocol.md.
const sync = semver.sync(root);

// Regenerate the hero so the version pill + hero.png track VERSION (the pill is
// derived from VERSION inside build-hero.js, not string-patched). Guarded: skip
// when the generator is absent (e.g. payload-only installs).
let heroRegenerated = false;
const heroScript = join(root, 'assets', 'build-hero.js');
if (existsSync(heroScript)) {
  const r = spawnSync(process.execPath, [heroScript], { cwd: root, stdio: 'ignore' });
  heroRegenerated = r.status === 0;
}

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

process.stdout.write(`${JSON.stringify({ from: current, to: next, level, synced: sync.written, heroRegenerated }, null, 2)}\n`);
