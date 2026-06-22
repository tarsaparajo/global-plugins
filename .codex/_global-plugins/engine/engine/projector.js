'use strict';

// Projector: turns a resolved adapter + module set into an ordered operation
// list (the projection plan) WITHOUT touching disk. This is the pure function
// the parity check re-runs to prove determinism.

const path = require('path');
const { getAdapter, planScaffold } = require('./registry');
const { opSymlink } = require('./helpers');

// Plan operations for a single target.
function planForTarget(target, options) {
  return planScaffold({ ...options, target });
}

// When the opt-in universal substrate is enabled, the child shares its
// instruction files across all three CLI providers, anchored on AGENTS.md (read
// natively by Codex and OpenCode) with a sibling CLAUDE.md symlinked to it
// (read by Claude Code; OpenCode resolves its CLAUDE.md fallback to the same
// file). The substrate is HIERARCHICAL: every AGENTS.md at any level of the
// child gets its own sibling CLAUDE.md -> AGENTS.md link.
//
// This NEVER imposes structure on the child: it only universalizes instruction
// files the child ALREADY has. If the child ships no AGENTS.md, nothing is
// created — there is simply nothing to universalize. The user decides entirely
// what the child does and how it is laid out; this only links what exists,
// and only when the user opts in. Returned as its own pseudo-plan so the
// executor/parity treat it like a target.
function planUniversalSubstrate(options) {
  const root = options.projectRoot || options.repoRoot;

  // Discover the child's existing instruction files (AGENTS.md, any depth). One
  // sibling CLAUDE.md -> AGENTS.md link per file, at every level. No scaffolding.
  const operations = findInstructionFiles(root).map(agents => opSymlink({
    moduleId: '__substrate__',
    destinationPath: path.join(path.dirname(agents), 'CLAUDE.md'),
    linkTarget: 'AGENTS.md',
  }));

  return { targetRoot: root, adapter: { target: 'substrate' }, operations };
}

// Recursively find every AGENTS.md under root, excluding provider dotfolders,
// VCS, and node_modules.
function findInstructionFiles(root) {
  const fs = require('fs');
  const SKIP = new Set(['.git', 'node_modules', '.claude', '.codex', '.opencode']);
  const out = [];
  const walk = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!SKIP.has(e.name)) {
          walk(path.join(dir, e.name));
        }
      } else if (e.isFile() && e.name === 'AGENTS.md') {
        out.push(path.join(dir, e.name));
      }
    }
  };
  walk(root);
  return out.sort();
}

// Plan operations across every requested target. Returns one plan per target,
// plus a universal-substrate plan when that opt-in is enabled.
function planAll(targets, options) {
  const plans = targets.map(target => planForTarget(target, options));
  if (options && options.universalSubstrate) {
    plans.push(planUniversalSubstrate(options));
  }
  return plans;
}

// Produce a human-readable propagation plan (used by the human-gate). Each row
// is { provider, op, destination, transform }.
function renderPropagationPlan(plans) {
  const rows = [];
  for (const plan of plans) {
    for (const op of plan.operations) {
      rows.push({
        provider: plan.adapter.target,
        op: op.kind,
        destination: op.destinationPath,
        transform: op.generator || op.strategy || op.kind,
      });
    }
  }
  return rows;
}

// Collect the non-standard-folder warnings across every plan (G3), so the
// human-gate and `project.mjs --dry-run` show each re-home/skip/collision before
// any write. Each entry is { provider, dir, action, to?, message? }.
function collectWarnings(plans) {
  const out = [];
  for (const plan of plans) {
    for (const w of (Array.isArray(plan.warnings) ? plan.warnings : [])) {
      out.push({ provider: plan.adapter.target, ...w });
    }
  }
  return out;
}

module.exports = {
  getAdapter,
  planForTarget,
  planAll,
  renderPropagationPlan,
  collectWarnings,
};
