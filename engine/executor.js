'use strict';

// Executor: applies a projection plan's operations to disk. The only module
// that writes provider files. Idempotent: re-running with the same canonical
// source yields byte-identical output. Snapshots prior state so a failed parity
// check can roll back.

const fs = require('fs');
const path = require('path');

const { deepMergeJson, readJsonFile } = require('./helpers');
const promptDefense = require('./prompt-defense');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readFileSafe(absPath) {
  try {
    return fs.readFileSync(absPath, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

// True if the path itself is a symbolic link (does NOT follow the link).
function isSymlink(absPath) {
  try {
    return fs.lstatSync(absPath).isSymbolicLink();
  } catch {
    return false;
  }
}

// Apply a single operation. repoRoot is the canonical source root; generators is
// a map of generator-name -> function(op, ctx) => string content.
function applyOperation(op, ctx) {
  const { repoRoot, generators } = ctx;
  ensureDir(path.dirname(op.destinationPath));

  switch (op.kind) {
    case 'copy-path':
    case 'flat-rule':
    case 'flat-file': {
      const source = path.join(repoRoot, op.sourceRelativePath);
      let content = fs.readFileSync(source, 'utf8');
      if (isModelFacingMarkdown(op.destinationPath)) {
        content = promptDefense.inject(content);
      }
      fs.writeFileSync(op.destinationPath, content);
      return { wrote: op.destinationPath };
    }
    case 'merge-json': {
      const source = path.join(repoRoot, op.sourceRelativePath);
      const overlay = readJsonFile(source, op.sourceRelativePath);
      const existing = fs.existsSync(op.destinationPath)
        ? readJsonFile(op.destinationPath, op.destinationPath)
        : {};
      const merged = deepMergeJson(existing, overlay);
      fs.writeFileSync(op.destinationPath, `${JSON.stringify(merged, null, 2)}\n`);
      return { merged: op.destinationPath };
    }
    case 'scaffold': {
      const gen = generators && generators[op.generator];
      let content = gen ? gen(op, ctx) : '';
      if (op.carriesPromptDefense && isModelFacingMarkdown(op.destinationPath)) {
        content = promptDefense.inject(content);
      }
      if (op.append && fs.existsSync(op.destinationPath)) {
        fs.appendFileSync(op.destinationPath, content);
      } else {
        fs.writeFileSync(op.destinationPath, content);
      }
      return { scaffolded: op.destinationPath };
    }
    case 'symlink': {
      // Create a symbolic link pointing at op.linkTarget (relative to the link's
      // own directory). Idempotent: replace any existing entry so re-projection
      // and rollback are stable. The link is created even if its target file is
      // not yet written — applyPlan orders non-link ops first so the target
      // exists, but a relative link is valid regardless.
      if (fs.existsSync(op.destinationPath) || isSymlink(op.destinationPath)) {
        fs.rmSync(op.destinationPath, { force: true });
      }
      fs.symlinkSync(op.linkTarget, op.destinationPath);
      return { linked: op.destinationPath, to: op.linkTarget };
    }
    case 'build-step': {
      // Build steps are executed by the caller (canonical-projector) via the
      // adapter.buildStep command before validate(); recorded here as a marker.
      return { build: op.command };
    }
    default:
      throw new Error(`Unknown operation kind: ${op.kind}`);
  }
}

function isModelFacingMarkdown(destPath) {
  if (!destPath.endsWith('.md')) {
    return false;
  }
  const base = path.basename(destPath).toLowerCase();
  // README/CHANGELOG/LICENSE/governance docs are not model-facing instruction files.
  return !['readme.md', 'changelog.md', 'license.md', 'security.md', 'evolution.md'].includes(base);
}

// Snapshot destination files an op set will touch, so a rollback can restore.
// A symlink is snapshotted as a link (its target), never dereferenced, so a
// rollback restores the link rather than a plain copy of the target's content.
function snapshot(ops) {
  const snap = {};
  for (const op of ops) {
    if (op.destinationPath && !(op.destinationPath in snap)) {
      snap[op.destinationPath] = isSymlink(op.destinationPath)
        ? { link: fs.readlinkSync(op.destinationPath) }
        : readFileSafe(op.destinationPath);
    }
  }
  return snap;
}

function rollback(snap) {
  for (const [dest, prior] of Object.entries(snap)) {
    if (prior === null) {
      if (fs.existsSync(dest) || isSymlink(dest)) {
        fs.rmSync(dest, { force: true });
      }
    } else if (prior && typeof prior === 'object' && 'link' in prior) {
      if (fs.existsSync(dest) || isSymlink(dest)) {
        fs.rmSync(dest, { force: true });
      }
      ensureDir(path.dirname(dest));
      fs.symlinkSync(prior.link, dest);
    } else {
      if (isSymlink(dest)) {
        fs.rmSync(dest, { force: true });
      }
      ensureDir(path.dirname(dest));
      fs.writeFileSync(dest, prior);
    }
  }
}

// Apply all operations in a plan; returns results. On any error, rolls back.
// Symlink ops run last (stable order) so their targets — e.g. the canonical
// AGENTS.md — are already written when a CLAUDE.md -> AGENTS.md link is created.
function applyPlan(plan, ctx) {
  const ops = plan.operations
    .filter(op => op.kind !== 'build-step')
    .map((op, i) => [op, i])
    .sort(([a, ia], [b, ib]) => {
      const sa = a.kind === 'symlink' ? 1 : 0;
      const sb = b.kind === 'symlink' ? 1 : 0;
      return sa - sb || ia - ib;
    })
    .map(([op]) => op);
  const snap = snapshot(ops);
  const results = [];
  try {
    for (const op of ops) {
      results.push(applyOperation(op, ctx));
    }
    return { ok: true, results };
  } catch (error) {
    rollback(snap);
    return { ok: false, error: error.message, results };
  }
}

module.exports = {
  applyOperation,
  applyPlan,
  snapshot,
  rollback,
  isModelFacingMarkdown,
};
