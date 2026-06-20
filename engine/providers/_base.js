'use strict';

// Shared planOperations helpers used by the provider modules. A provider module
// declares HOW canonical component dirs map into its native dotfolder; the base
// turns a module's paths[] into operations, filtering foreign platform paths.

const path = require('path');

const {
  isForeignPlatformPath,
  listRelativeFiles,
  opCopyPath,
  opMergeJson,
  opFlatRule,
  opFlatFile,
  opScaffold,
  opBuildStep,
} = require('../helpers');

// Expand a canonical mcp/ directory into one merge-json operation per JSON file,
// each merged into the single destination MCP file the provider expects.
function mcpMergeOps({ repoRoot, module, sourceRelativePath }, destinationPath) {
  const absSource = path.join(repoRoot, sourceRelativePath);
  return listRelativeFiles(absSource)
    .filter(rel => rel.endsWith('.json'))
    .map(rel => opMergeJson({
      moduleId: module.id,
      sourceRelativePath: path.posix.join(sourceRelativePath, rel),
      destinationPath,
    }));
}

// Default per-component routing shared by most providers. handlers maps a
// canonical top-level dir (e.g. "agents", "rules", "skills", "commands",
// "hooks", "mcp") to a function(ctx) => operations[]. Unknown dirs fall back to
// a verbatim copy preserving relative path under the target root.
function planFromModules(planInput, adapter, handlers = {}) {
  const { repoRoot, modules } = planInput;
  const targetRoot = adapter.resolveRoot(planInput);
  const seen = new Set();
  const ops = [];

  for (const module of (modules || [])) {
    const paths = Array.isArray(module.paths) ? module.paths : [];
    for (const sourceRelativePath of paths) {
      if (isForeignPlatformPath(sourceRelativePath, adapter.target)) {
        continue;
      }
      const top = String(sourceRelativePath).split('/')[0];
      const ctx = { repoRoot, targetRoot, module, sourceRelativePath, adapter };
      const produced = typeof handlers[top] === 'function'
        ? handlers[top](ctx)
        : defaultCopy(ctx);
      for (const op of produced) {
        if (!op || !op.destinationPath || seen.has(op.destinationPath)) {
          continue;
        }
        seen.add(op.destinationPath);
        ops.push(op);
      }
    }
  }

  if (adapter.buildStep) {
    ops.push(opBuildStep({
      moduleId: '__build__',
      destinationPath: path.join(targetRoot, '.build'),
      command: adapter.buildStep.command,
      requires: adapter.buildStep.requires,
    }));
  }

  return ops;
}

// Copy every file under a canonical dir, preserving structure under targetRoot.
function defaultCopy({ repoRoot, targetRoot, module, sourceRelativePath }) {
  const absSource = path.join(repoRoot, sourceRelativePath);
  return listRelativeFiles(absSource).map(rel => opCopyPath({
    moduleId: module.id,
    sourceRelativePath: path.posix.join(sourceRelativePath, rel),
    destinationPath: path.join(targetRoot, sourceRelativePath, rel),
  }));
}

// Flatten a dir of files into <targetRoot>/<destDir>, applying nameTransform.
// nameTransform(fileName, sourceRelFile) => newName | null (null = skip).
function flattenDir({ repoRoot, targetRoot, module, sourceRelativePath }, destDir, kind, nameTransform) {
  const absSource = path.join(repoRoot, sourceRelativePath);
  const make = kind === 'rule' ? opFlatRule : opFlatFile;
  const ops = [];
  for (const rel of listRelativeFiles(absSource)) {
    const fileName = path.posix.basename(rel);
    const newName = nameTransform ? nameTransform(fileName, rel) : fileName;
    if (newName == null) {
      continue;
    }
    ops.push(make({
      moduleId: module.id,
      sourceRelativePath: path.posix.join(sourceRelativePath, rel),
      destinationPath: path.join(targetRoot, destDir, newName),
    }));
  }
  return ops;
}

module.exports = {
  planFromModules,
  defaultCopy,
  flattenDir,
  mcpMergeOps,
  opScaffold,
};
