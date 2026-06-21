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
    // Decode a quoted YAML scalar to its plain value: a double-quoted value is
    // unquoted AND unescaped (\" -> ", \\ -> \) so a description like
    // "...\"validate a plugin\"..." yields clean inner quotes, not literal
    // backslashes in the consolidated AGENTS.md index / [agents.<name>] tables.
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\(["\\])/g, '$1');
    } else if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1).replace(/''/g, "'");
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
// "hooks", "mcp") to a function(ctx) => operations[]. A dir with NO registered
// handler is SKIPPED (not copied) — this is the 0.7.0 anti-bloat guard that keeps
// infrastructure (engine/, adapters/, manifests/, config/, templates/, docs/) out
// of the provider CAPABILITY surface. Runtime payload (the engine that performs
// generation) travels through a SEPARATE channel — see payloadCopy() — into a
// reserved non-capability subdir, never via these handlers.
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
      // Only project canonical dirs a provider EXPLICITLY handles. Anything else
      // is infrastructure (engine/, adapters/, manifests/, config/, templates/,
      // docs/) that lives at the repo root and must never be copied into a
      // provider dotfolder — doing so bloated every install with the engine
      // source. A provider opts a dir in by registering a handler for it; an
      // unregistered dir is skipped, not verbatim-copied.
      if (typeof handlers[top] !== 'function') {
        continue;
      }
      const ctx = { repoRoot, targetRoot, module, sourceRelativePath, adapter };
      const produced = handlers[top](ctx);
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

// The reserved, non-capability subdir of a provider dotfolder that holds the
// RUNTIME PAYLOAD (the projection engine + manifests + adapters + templates +
// re-projection wrappers + delta baseline). A provider whose install carries this
// can run `node _engine/scripts/evolve/project.mjs` to generate/adapt/evolve
// child plugins itself — closing the gap where only Claude (whole-repo install)
// could run the engine. It is NEVER scanned as a capability: no handler maps to
// it, so the 0.7.0 guard keeps it out of agents/skills/commands.
const RESERVED_PAYLOAD_DIR = '_engine';

// Plan the runtime payload for a provider. Walks every module that names this
// provider in its payloadTargets[] and copies each of its paths VERBATIM into
// <targetRoot>/_engine/<path>/<rel> — no frontmatter adapt, no owner prefix, no
// prompt-defense injection (it is engine source, not a model-facing capability).
// allModules is the FULL unfiltered list (threaded by registry.planScaffold), so
// payload modules reach here even though their capability targets[] exclude this
// provider. Idempotent + deterministic; byte-checked by the drift guard.
function payloadCopy(planInput, adapter) {
  const { repoRoot, allModules } = planInput;
  const modules = Array.isArray(allModules) ? allModules : [];
  const targetRoot = adapter.resolveRoot(planInput);
  const seen = new Set();
  const ops = [];
  for (const module of modules) {
    const payloadTargets = Array.isArray(module.payloadTargets) ? module.payloadTargets : [];
    if (!payloadTargets.includes(adapter.target)) {
      continue;
    }
    for (const sourceRelativePath of (Array.isArray(module.paths) ? module.paths : [])) {
      const absSource = path.join(repoRoot, sourceRelativePath);
      for (const rel of listRelativeFiles(absSource)) {
        const destinationPath = path.join(targetRoot, RESERVED_PAYLOAD_DIR, sourceRelativePath, rel);
        if (seen.has(destinationPath)) {
          continue;
        }
        seen.add(destinationPath);
        ops.push(opCopyPath({
          moduleId: module.id,
          sourceRelativePath: path.posix.join(sourceRelativePath, rel),
          destinationPath,
          // Engine source, not a capability: copy byte-for-byte. `verbatim` tells
          // the executor to skip frontmatter adaptation AND prompt-defense
          // injection, so payload .md files stay identical to canonical (a mutated
          // template/agent source would break re-projection).
          verbatim: true,
        }));
      }
    }
  }
  return ops;
}

// The provider target whose .md frontmatter this op should be adapted to, or
// undefined when no adaptation applies (non-frontmatter dir). Claude IS the
// canonical shape, but it is still adapted: the adapter is a near-no-op for
// claude (it keeps every field) EXCEPT it drops a stray `model:` — model is never
// preset on any provider (a CLI/runtime choice). Threaded onto ops, read by the
// executor.
function frontmatterTargetFor(adapter, sourceRelativePath) {
  if (!adapter) {
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

// Like defaultCopy, but prefixes the capability NAME with `<pluginLabel>-` so the
// owning plugin is part of the invocable token in CLIs without native namespacing
// (OpenCode). For a flat component (`agents/<name>.md`, `commands/<name>.md`) the
// FILE basename is prefixed -> `/<label>-<name>`. For a nested skill
// (`skills/<name>/SKILL.md`) the SKILL DIR segment is prefixed -> the skill name
// becomes `<label>-<name>`; the op also carries `nameOverride` so the executor
// rewrites the SKILL.md `name:` frontmatter to match the dir. Idempotent: a name
// already starting with `<label>-` is left alone. Non-component dirs are not
// routed here (the provider only wires this for agents/skills/commands).
function ownerPrefixedCopy({ repoRoot, targetRoot, module, sourceRelativePath, adapter }, label) {
  if (!label) {
    return defaultCopy({ repoRoot, targetRoot, module, sourceRelativePath, adapter });
  }
  const absSource = path.join(repoRoot, sourceRelativePath);
  const frontmatterTarget = frontmatterTargetFor(adapter, sourceRelativePath);
  const marker = `${label}-`;
  const prefixSeg = seg => (seg.startsWith(marker) ? seg : `${marker}${seg}`);
  const ops = [];
  for (const rel of listRelativeFiles(absSource)) {
    const parts = rel.split('/');
    // `_knowledge` under skills/ is shared reference doctrine, NOT an invocable
    // capability — copy it verbatim (no name prefix). README.md likewise.
    const top = parts[0];
    const isNonCapability = top === '_knowledge' || top.toLowerCase() === 'readme.md';
    let nameOverride;
    if (isNonCapability) {
      // leave parts untouched -> copied verbatim, no nameOverride.
    } else if (parts.length >= 2) {
      // Nested skill: prefix the SKILL DIR segment (the skill name); nameOverride
      // tells the executor to rewrite the SKILL.md `name:` to match.
      nameOverride = prefixSeg(top);
      parts[0] = nameOverride;
    } else {
      // Flat agent/command: prefix the file basename. nameOverride rewrites a
      // `name:` field IF present (agents have one; commands do not).
      const ext = path.posix.extname(top);
      const base = top.slice(0, top.length - ext.length);
      nameOverride = prefixSeg(base);
      parts[0] = `${nameOverride}${ext}`;
    }
    const destRel = parts.join('/');
    ops.push(opCopyPath({
      moduleId: module.id,
      sourceRelativePath: path.posix.join(sourceRelativePath, rel),
      destinationPath: path.join(targetRoot, sourceRelativePath, destRel),
      ...(frontmatterTarget ? { frontmatterTarget } : {}),
      ...(nameOverride ? { nameOverride } : {}),
    }));
  }
  return ops;
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
  ownerPrefixedCopy,
  payloadCopy,
  RESERVED_PAYLOAD_DIR,
  flattenDir,
  mcpMergeOps,
  opScaffold,
  collectComponents,
  readFrontmatter,
};
