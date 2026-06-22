#!/usr/bin/env node
// project.mjs — re-project a canonical delta to every provider this plugin
// supports. --dry-run renders the propagation plan without writing; --apply
// writes the change set via the bundled engine. Reuses the same planOperations
// engine, scoped to the changed paths.
//
// Usage: node scripts/evolve/project.mjs [--dry-run|--apply] [pluginRoot]

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const apply = args.includes('--apply');
// Resolve to ABSOLUTE: a relative root like "." makes join(root,'engine') a bare
// specifier ("engine") that require() mis-resolves as a node_modules package.
const root = resolvePath(args.find((a) => !a.startsWith('--')) || process.cwd());

// The child ships the engine under ./engine (copied at generation time).
const enginePath = join(root, 'engine');
if (!existsSync(enginePath)) {
  process.stderr.write('[project] bundled engine/ not found; cannot re-project.\n');
  process.exit(1);
}

const { resolve } = require(join(enginePath, 'resolver.js'));
const projector = require(join(enginePath, 'projector.js'));
const executor = require(join(enginePath, 'executor.js'));
const { generators } = require(join(enginePath, 'builder.js'));
const { listProviders } = require(join(enginePath, 'registry.js'));

// Provenance: the plugin's own version (the "schemaVersion" the migration runner
// gates on) and which global-plugins release authored this projection. Read from
// VERSION at the canonical root; absent -> null (a pre-stamp / fixture install).
function readVersion(dir) {
  try { return readFileSync(join(dir, 'VERSION'), 'utf8').trim() || null; } catch { return null; }
}
function readGeneratedWith(dir) {
  // A generated child records the parent release in .evolution/baseline/provenance
  // when seeded; the parent itself is its own provenance.
  try {
    const j = JSON.parse(readFileSync(join(dir, '.evolution', 'baseline', 'provenance.json'), 'utf8'));
    if (j && typeof j.generatedWith === 'string') return j.generatedWith;
  } catch { /* fall through */ }
  const slug = (() => { try { return JSON.parse(readFileSync(join(dir, '.claude-plugin', 'plugin.json'), 'utf8')).name; } catch { return null; } })();
  const v = readVersion(dir);
  return slug && v ? `${slug}@${v}` : null;
}

// Write the install-state stamp into every provider projection's bundle so an
// installed copy records (1) its own version — the gating key the migration runner
// reads — and (2) the release that authored it. The path is the SAME the engine
// computes (adapter.getInstallStatePath), so it lands inside `_<slug>/` on
// Codex/OpenCode and at the provider root on Claude. install-state.json is
// excluded from the parity drift check, so this is not a drift-guarded artifact.
function writeInstallState(plansList, repoRoot) {
  const schemaVersion = readVersion(repoRoot);
  const generatedWith = readGeneratedWith(repoRoot);
  const byTarget = new Map(listProviders().map((a) => [a.target, a]));
  for (const plan of plansList) {
    const adapter = byTarget.get(plan.adapter.target);
    if (!adapter || typeof adapter.getInstallStatePath !== 'function') continue;
    const statePath = adapter.getInstallStatePath({ repoRoot, projectRoot: repoRoot, homeDir: repoRoot });
    mkdirSync(dirname(statePath), { recursive: true });
    writeFileSync(statePath, `${JSON.stringify({
      plugin: generatedWith ? generatedWith.split('@')[0] : null,
      schemaVersion,
      generatedWith,
      provider: plan.adapter.target,
    }, null, 2)}\n`);
  }
}

const { modules, targets } = resolve(root, { targets: ['all'] });
const plans = projector.planAll(targets, { repoRoot: root, projectRoot: root, homeDir: root, modules });

if (!apply) {
  const rows = projector.renderPropagationPlan(plans);
  // Non-standard-folder re-home / skip notices, surfaced for the human-gate so a
  // folder is never moved into `_<slug>/` (or skipped) silently.
  const warnings = projector.collectWarnings ? projector.collectWarnings(plans) : [];
  process.stdout.write(`${JSON.stringify({ mode: 'dry-run', targets, warnings, rows }, null, 2)}\n`);
  process.exit(0);
}

const results = [];
for (const plan of plans) {
  results.push({ target: plan.adapter.target, ...executor.applyPlan(plan, { repoRoot: root, generators }) });
}
const ok = results.every((r) => r.ok);
// Stamp provenance only after every projection applied cleanly.
if (ok) {
  try { writeInstallState(plans, root); } catch (e) {
    process.stderr.write(`[project] install-state stamp failed: ${e.message}\n`);
  }
}
process.stdout.write(`${JSON.stringify({ mode: 'apply', ok, results }, null, 2)}\n`);
process.exit(ok ? 0 : 1);
