#!/usr/bin/env node
// compute-delta.mjs — derive the canonical ChangeSet for this plugin.
//
// The delta is computed on the canonical source (never on provider
// projections, which are derived). Each canonical file is hashed and compared
// against the recorded baseline (.evolution/baseline/projection.lock.json),
// keyed by componentId from manifests/components.json. Emits a ChangeSet.
//
// Usage: node scripts/evolve/compute-delta.mjs [pluginRoot]

import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

const root = process.argv[2] || process.cwd();

function sha256(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}

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

function readJson(path, fallback) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
}

// Map a canonical file path to its componentId via the components manifest.
function componentIdFor(relPath, components) {
  const top = relPath.split('/')[0]; // agents|skills|commands|hooks|rules|mcp
  const name = relPath.split('/')[1]?.replace(/\.(md|json)$/, '');
  const family = top.replace(/s$/, '');
  const guess = `${family}:${name}`;
  const hit = (components.components || []).find((c) => c.id === guess);
  return hit ? hit.id : `${family}:${name || top}`;
}

function kindFor(relPath) {
  const top = relPath.split('/')[0];
  return ({ agents: 'agent', skills: 'skill', commands: 'command', hooks: 'hook', rules: 'rule', mcp: 'mcp' })[top] || 'manifest';
}

const canonicalDir = join(root, 'canonical');
const components = readJson(join(root, 'manifests', 'components.json'), { components: [] });
const lock = readJson(join(root, '.evolution', 'baseline', 'projection.lock.json'), { files: {} });
const fromVersion = existsSync(join(root, 'VERSION')) ? readFileSync(join(root, 'VERSION'), 'utf8').trim() : '0.0.0';

const current = {};
for (const rel of listFiles(canonicalDir)) {
  current[rel] = sha256(readFileSync(join(canonicalDir, rel)));
}

const baseline = lock.files || {};
const operations = [];

for (const [rel, hash] of Object.entries(current)) {
  if (!(rel in baseline)) {
    operations.push(makeOp('add', rel, null, hash, components));
  } else if (baseline[rel] !== hash) {
    operations.push(makeOp('modify', rel, baseline[rel], hash, components));
  }
}
for (const rel of Object.keys(baseline)) {
  if (!(rel in current)) {
    operations.push(makeOp('remove', rel, baseline[rel], null, components));
  }
}

function makeOp(op, rel, fromHash, toHash, components) {
  return {
    op,
    componentId: componentIdFor(rel.replace(/^canonical\//, ''), components),
    kind: kindFor(rel.replace(/^canonical\//, '')),
    canonicalPath: posix.join('canonical', rel),
    fromHash,
    toHash,
  };
}

const changeset = { fromVersion, operations };
process.stdout.write(`${JSON.stringify(changeset, null, 2)}\n`);
