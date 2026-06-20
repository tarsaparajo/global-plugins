'use strict';

// Shared planOperations helpers used by the provider modules. A provider module
// declares HOW canonical component dirs map into its native dotfolder; the base
// turns a module's paths[] into operations, filtering foreign platform paths.

const path = require('path');
const fs = require('fs');

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

// Read the leading YAML frontmatter of a markdown file and return { name,
// description } when present. Used to build capability indexes for the
// single-file providers without embedding the whole body.
function readFrontmatter(absFile) {
  let text = '';
  try {
    text = fs.readFileSync(absFile, 'utf8');
  } catch {
    return {};
  }
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!match) {
    return {};
  }
  const out = {};
  for (const line of match[1].split('\n')) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) {
      continue;
    }
    let value = kv[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[kv[1]] = value;
  }
  return out;
}

// Walk a canonical component dir (agents/skills/commands) and return one entry
// per primary file with its derived name + description. Skills live one level
// deep as <id>/SKILL.md; agents/commands are flat <name>.md. _knowledge docs and
// non-primary files are skipped so the index lists real capabilities only.
function collectComponents(repoRoot, sourceRelativeDir) {
  const absDir = path.join(repoRoot, sourceRelativeDir);
  const out = [];
  for (const rel of listRelativeFiles(absDir)) {
    const base = path.posix.basename(rel);
    const top = rel.split('/')[0];
    if (top === '_knowledge') {
      continue;
    }
    const isSkill = base === 'SKILL.md';
    if (!base.endsWith('.md') || (sourceRelativeDir === 'skills' && !isSkill)) {
      continue;
    }
    const fm = readFrontmatter(path.join(absDir, rel));
    const name = fm.name || (isSkill ? rel.split('/')[0] : base.replace(/\.md$/, ''));
    out.push({
      name,
      description: fm.description || '',
      sourceRelativePath: path.posix.join(sourceRelativeDir, rel),
    });
  }
  return out;
}

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

// Canonical component dirs whose .md files carry model-facing frontmatter that
// must be adapted to the target provider's real schema (keep/rewrite/drop). The
// frontmatterTarget tag is read by the executor; see engine/frontmatter.js.
const FRONTMATTER_DIRS = new Set(['agents', 'skills', 'commands']);

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

// The provider target whose .md frontmatter this op should be adapted to, or
// undefined when no adaptation applies (non-frontmatter dir, or claude which IS
// the canonical shape). Threaded onto ops and read by the executor.
function frontmatterTargetFor(adapter, sourceRelativePath) {
  if (!adapter || adapter.target === 'claude') {
    return undefined;
  }
  const top = String(sourceRelativePath).split('/')[0];
  return FRONTMATTER_DIRS.has(top) ? adapter.target : undefined;
}

// Copy every file under a canonical dir, preserving structure under targetRoot.
function defaultCopy({ repoRoot, targetRoot, module, sourceRelativePath, adapter }) {
  const absSource = path.join(repoRoot, sourceRelativePath);
  const frontmatterTarget = frontmatterTargetFor(adapter, sourceRelativePath);
  return listRelativeFiles(absSource).map(rel => opCopyPath({
    moduleId: module.id,
    sourceRelativePath: path.posix.join(sourceRelativePath, rel),
    destinationPath: path.join(targetRoot, sourceRelativePath, rel),
    ...(frontmatterTarget ? { frontmatterTarget } : {}),
  }));
}

// Flatten a dir of files into <targetRoot>/<destDir>, applying nameTransform.
// nameTransform(fileName, sourceRelFile) => newName | null (null = skip).
function flattenDir({ repoRoot, targetRoot, module, sourceRelativePath, adapter }, destDir, kind, nameTransform) {
  const absSource = path.join(repoRoot, sourceRelativePath);
  const make = kind === 'rule' ? opFlatRule : opFlatFile;
  const frontmatterTarget = frontmatterTargetFor(adapter, sourceRelativePath);
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
      ...(frontmatterTarget ? { frontmatterTarget } : {}),
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
  collectComponents,
  readFrontmatter,
};
