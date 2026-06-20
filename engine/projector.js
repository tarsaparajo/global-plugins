'use strict';

// Projector: turns a resolved adapter + module set into an ordered operation
// list (the projection plan) WITHOUT touching disk. This is the pure function
// the parity check re-runs to prove determinism.

const { getAdapter, planScaffold } = require('./registry');

// Plan operations for a single target.
function planForTarget(target, options) {
  return planScaffold({ ...options, target });
}

// Plan operations across every requested target. Returns one plan per target.
function planAll(targets, options) {
  return targets.map(target => planForTarget(target, options));
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

module.exports = {
  getAdapter,
  planForTarget,
  planAll,
  renderPropagationPlan,
};
