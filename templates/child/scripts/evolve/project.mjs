#!/usr/bin/env node
// project.mjs — re-project a canonical delta to every provider this plugin
// supports. --dry-run renders the propagation plan without writing; --apply
// writes the change set via the bundled engine. Reuses the same planOperations
// engine, scoped to the changed paths.
//
// Usage: node scripts/evolve/project.mjs [--dry-run|--apply] [pluginRoot]

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const root = args.find((a) => !a.startsWith('--')) || process.cwd();

// The child ships the engine under ./engine (copied at generation time). The
// engine MUST be bundled whole — agent frontmatter is rewritten per provider
// (e.g. OpenCode object `tools`, Codex TOML) by engine/frontmatter.js, so a
// partial copy produces invalid provider files. Fail loudly if a required
// engine module is missing rather than emitting an unprojectable plugin.
const enginePath = join(root, 'engine');
const REQUIRED_ENGINE = ['resolver.js', 'projector.js', 'executor.js', 'builder.js', 'frontmatter.js', 'helpers.js'];
const missingEngine = REQUIRED_ENGINE.filter((f) => !existsSync(join(enginePath, f)));
if (!existsSync(enginePath) || missingEngine.length > 0) {
  const detail = !existsSync(enginePath) ? 'directory not found' : `missing: ${missingEngine.join(', ')}`;
  process.stderr.write(`[project] bundled engine/ incomplete (${detail}); cannot re-project.\n`);
  process.exit(1);
}

const { resolve } = require(join(enginePath, 'resolver.js'));
const projector = require(join(enginePath, 'projector.js'));
const executor = require(join(enginePath, 'executor.js'));
const { generators } = require(join(enginePath, 'builder.js'));

const { modules, targets } = resolve(root, { targets: ['all'] });
const plans = projector.planAll(targets, { repoRoot: root, projectRoot: root, homeDir: root, modules });

if (!apply) {
  const rows = projector.renderPropagationPlan(plans);
  process.stdout.write(`${JSON.stringify({ mode: 'dry-run', targets, rows }, null, 2)}\n`);
  process.exit(0);
}

const results = [];
for (const plan of plans) {
  results.push({ target: plan.adapter.target, ...executor.applyPlan(plan, { repoRoot: root, generators }) });
}
const ok = results.every((r) => r.ok);
process.stdout.write(`${JSON.stringify({ mode: 'apply', ok, results }, null, 2)}\n`);
process.exit(ok ? 0 : 1);
