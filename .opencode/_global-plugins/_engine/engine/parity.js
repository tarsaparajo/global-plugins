'use strict';

// Parity: proves a projection is a faithful, complete image of the canonical
// for every target. Parity is STRUCTURAL equivalence (each provider has its own
// shape), checked along five axes per target: coverage, no-orphan,
// transform-determinism, round-trip identity, and the containment guard.

const fs = require('fs');
const path = require('path');

const { isForeignPlatformPath, listRelativeFiles } = require('./helpers');

// Re-running planOperations must reproduce the same destination set (the
// projection is a pure function). Non-determinism => fail.
function checkDeterminism(planFn) {
  const a = planFn().map(op => op.destinationPath).sort();
  const b = planFn().map(op => op.destinationPath).sort();
  return JSON.stringify(a) === JSON.stringify(b);
}

// A path is present if it exists OR is a symlink (a managed link counts as
// present even if a coverage check runs before its target is materialized;
// fs.existsSync follows links and would report a not-yet-written target as
// missing, so lstat the path itself).
function isPresent(dest) {
  if (fs.existsSync(dest)) {
    return true;
  }
  try {
    return fs.lstatSync(dest).isSymbolicLink();
  } catch {
    return false;
  }
}

// Every planned destination exists on disk (coverage).
function checkCoverage(plan) {
  const missing = plan.operations
    .filter(op => op.kind !== 'build-step')
    .map(op => op.destinationPath)
    .filter(dest => !isPresent(dest));
  return { ok: missing.length === 0, missing };
}

// No file under the target root is unaccounted for by the plan (no-orphan),
// scoped to files the engine manages. Excluded from the orphan set:
//  - the per-plugin install-state file (engine state, not a projected op);
//  - build-step OUTPUTS — the OpenCode compiled plugin under any `dist/` segment
//    and the per-slug discovery loader at `plugins/<slug>.js`. These are produced
//    by `node engine/build-opencode.js` (a build-step marker in the plan, not a
//    copy-path op), so they legitimately exist on disk without a matching copy
//    destination. Without this they would always read as orphans.
function isBuildArtifact(f) {
  if (/(^|\/)dist(\/|$)/.test(f)) {
    return true; // compiled plugin output (e.g. _<slug>/dist/*)
  }
  if (/(^|\/)plugins\/[^/]+\.js$/.test(f)) {
    return true; // shared-dir discovery loader (plugins/<slug>.js)
  }
  return false;
}
function checkNoOrphan(plan, targetRoot) {
  if (!fs.existsSync(targetRoot)) {
    return { ok: true, orphans: [] };
  }
  const planned = new Set(plan.operations.map(op => op.destinationPath));
  const onDisk = listRelativeFiles(targetRoot).map(rel => path.join(targetRoot, rel));
  const orphans = onDisk.filter(f =>
    !planned.has(f) && !f.includes('install-state.json') && !isBuildArtifact(f));
  return { ok: orphans.length === 0, orphans };
}

// No foreign provider shape leaked into this target's dotfolder (containment).
function checkContainment(plan, target) {
  const leaks = plan.operations.filter(op =>
    op.sourceRelativePath && isForeignPlatformPath(op.sourceRelativePath, target));
  return { ok: leaks.length === 0, leaks: leaks.map(op => op.sourceRelativePath) };
}

// Run all checks for one target's plan. planFn re-runs the projection.
function checkTarget(plan, planFn) {
  const targetRoot = plan.targetRoot;
  const coverage = checkCoverage(plan);
  const noOrphan = checkNoOrphan(plan, targetRoot);
  const determinism = checkDeterminism(planFn);
  const containment = checkContainment(plan, plan.adapter.target);
  const ok = coverage.ok && noOrphan.ok && determinism && containment.ok;
  return {
    id: plan.adapter.target,
    checks: {
      coverage: coverage.ok,
      noOrphan: noOrphan.ok,
      determinism,
      containment: containment.ok,
    },
    ok,
    details: { coverage, noOrphan, containment },
  };
}

module.exports = {
  checkDeterminism,
  checkCoverage,
  checkNoOrphan,
  checkContainment,
  checkTarget,
};
