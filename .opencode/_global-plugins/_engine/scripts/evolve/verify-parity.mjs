#!/usr/bin/env node
// verify-parity.mjs — prove the projection is a faithful, complete image of the
// canonical for every target. Structural equivalence via the bundled parity
// engine: coverage, no-orphan, transform-determinism, round-trip, containment.
//
// Usage: node scripts/evolve/verify-parity.mjs [pluginRoot]

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve as resolvePath } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Absolute: a relative root ("." ) makes join(root,'engine') a bare specifier
// require() mis-resolves as a node_modules package.
const root = resolvePath(process.argv[2] || process.cwd());
const enginePath = join(root, 'engine');

const { resolve } = require(join(enginePath, 'resolver.js'));
const projector = require(join(enginePath, 'projector.js'));
const parity = require(join(enginePath, 'parity.js'));

const version = existsSync(join(root, 'VERSION')) ? readFileSync(join(root, 'VERSION'), 'utf8').trim() : '0.0.0';
const { modules, targets } = resolve(root, { targets: ['all'] });

const targetReports = [];
for (const target of targets) {
  const planFn = () => projector.planForTarget(target, { repoRoot: root, projectRoot: root, homeDir: root, modules }).operations;
  const plan = projector.planForTarget(target, { repoRoot: root, projectRoot: root, homeDir: root, modules });
  targetReports.push(parity.checkTarget(plan, planFn));
}

const ok = targetReports.every((t) => t.ok);
const report = { version, ok, targets: targetReports, failures: targetReports.filter((t) => !t.ok) };
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exit(ok ? 0 : 1);
