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
  payloadBasePath,
  bundleSubPath,
  classifyTopLevelDir,
  privateBundleDir,
  BUNDLE_SIBLING_NAMES,
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
  // Normalize CRLF -> LF before parsing. On Windows, `actions/checkout` hands the
  // canonical source back as CRLF, which otherwise leaves a stray `\r` on every
  // frontmatter value (the `(.*)` capture swallows it) and corrupts the quoted-
  // scalar detection below — so the projected description differs from a fresh LF
  // projection and the drift guard fails on Windows only. Parse EOL-insensitively.
  text = text.replace(/\r\n/g, '\n');
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
// deep as <id>/SKILL.md; agents/commands are flat <name>.md. Non-primary files
// are skipped so the index lists real capabilities only. (Reference doctrine
// lives in the top-level `knowledge/` folder, namespaced into the bundle — it is
// never under a capability dir, so nothing here needs to filter it out.)
function collectComponents(repoRoot, sourceRelativeDir) {
  const absDir = path.join(repoRoot, sourceRelativeDir);
  const out = [];
  for (const rel of listRelativeFiles(absDir)) {
    const base = path.posix.basename(rel);
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
function planFromModules(planInput, adapter, handlers = {}, options = {}) {
  const { repoRoot, modules } = planInput;
  const targetRoot = adapter.resolveRoot(planInput);
  const seen = new Set();
  const ops = [];
  // The set of non-standard folders THIS provider relocated into `_<slug>/`, so
  // capability bodies that reference `<folder>/...` by relative path can be
  // rewritten to the namespaced location by the executor (G5). Stamped onto every
  // produced op; the executor only acts on it for model-facing markdown. Empty
  // (Claude / no namespaced folders) -> the stamp is omitted and bodies are
  // byte-stable. Frozen so a shared array reference can't be mutated downstream.
  const namespacedFolders = Array.isArray(options.namespacedFolders) && options.namespacedFolders.length
    ? Object.freeze(options.namespacedFolders.slice())
    : null;

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
      // unregistered dir is skipped, not verbatim-copied. (Truly non-standard
      // INVENTED dirs — outside both handlers and the payload — are NOT dropped
      // here; they are routed into the private bundle by namespacePrivateFolders.)
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
        if (namespacedFolders) {
          op.namespacedFolders = namespacedFolders;
        }
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

// Plan the runtime payload for a provider. Walks every module that names this
// provider in its payloadTargets[] and copies each of its paths VERBATIM into
// the plugin's PRIVATE bundle: <targetRoot>/_<slug>/engine/<path>/<rel> — no
// frontmatter adapt, no owner prefix, no prompt-defense injection (it is engine
// source, not a model-facing capability). Namespacing under `_<slug>/` is what
// lets many plugins install side-by-side in one provider home without their
// payloads overwriting each other; the path is computed by helpers.payloadBasePath
// (the single source of truth for the layout). It is NEVER scanned as a capability:
// no handler maps to it, so the anti-bloat guard keeps it out of agents/skills/
// commands. allModules is the FULL unfiltered list (threaded by
// registry.planScaffold), so payload modules reach here even though their
// capability targets[] exclude this provider. Idempotent + deterministic;
// byte-checked by the drift guard.
function payloadCopy(planInput, adapter) {
  const { repoRoot, allModules } = planInput;
  const modules = Array.isArray(allModules) ? allModules : [];
  const targetRoot = adapter.resolveRoot(planInput);
  const payloadBase = payloadBasePath(targetRoot, repoRoot);
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
        const destinationPath = path.join(payloadBase, sourceRelativePath, rel);
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

// The set of TOP-LEVEL dir names already CLAIMED — i.e. governed by the module
// system, so the generic folder scanner must leave them alone (their placement is
// decided by APPLICABILITY, not the scanner — R7: applicability ≠ placement).
// Three sources:
//  - capability dirs: the keys of the `handlers` map the provider passed to
//    planFromModules (agents/skills/commands/hooks/rules/mcp/prompts/…). These
//    flowed (or were intentionally `() => []`) through the capability channel.
//  - payload dirs: the top-level segment of every module path whose
//    payloadTargets[] includes this provider (engine/adapters/scripts/manifests/
//    config/templates/.evolution) — already shipped verbatim by payloadCopy.
//  - ANY module-declared dir: the top-level segment of every module's paths[],
//    regardless of its targets[]/payloadTargets[]. A dir a module names (e.g.
//    `docs/`, claude-only) is KNOWN STRUCTURE whose projection is already governed
//    by that module — intentionally absent from a provider where it does not
//    apply, NOT an invented folder to bundle. Only a dir NO module declares is
//    truly non-standard and reachable by the generic classifier.
// The scanner consults this to avoid DOUBLE-EMISSION and applicability violations.
function claimedTopLevel(planInput, adapter, handlers = {}) {
  const claimed = new Set(Object.keys(handlers));
  for (const module of (planInput.allModules || [])) {
    for (const p of (Array.isArray(module.paths) ? module.paths : [])) {
      claimed.add(String(p).split('/')[0]);
    }
  }
  return claimed;
}

// Generic non-standard-folder namespacing (the root-cause fix). Scans the
// canonical source root for TOP-LEVEL directories that NEITHER channel claimed and
// routes each into the plugin's private bundle `_<slug>/<dir>/` — so a folder a
// plugin INVENTS (doctrine, schemas, own templates, reference data, internal
// protocols) that no provider discovers natively is namespaced exactly like the
// `engine`/`dist` infra, instead of being silently dropped by the anti-bloat
// guard. The classifier (helpers.classifyTopLevelDir) is the SINGLE source of
// truth shared with generate, adapt, and the migration runner.
//
// Returns { ops, warnings }. Every relocated dir AND every skipped entry yields a
// warning so the operator sees it at the human-gate (G3: never a silent move/drop).
// Claude is a NO-OP (wholeRepoInstall: every folder keeps its repo-root path).
// Bodies are copied `verbatim: true` (this is infrastructure, not a model-facing
// capability), so no frontmatter/prompt-defense mutation touches them.
function namespacePrivateFolders(planInput, adapter, { claimed } = {}) {
  const { repoRoot } = planInput;
  const ops = [];
  const warnings = [];
  if (adapter.wholeRepoInstall) {
    return { ops, warnings };
  }
  const targetRoot = adapter.resolveRoot(planInput);
  const pinnedToRoot = new Set(adapter.pinnedToRoot || []);
  const privBundleName = privateBundleDir(repoRoot);
  const claimedSet = claimed instanceof Set ? claimed : new Set(claimed || []);

  let entries = [];
  try {
    entries = fs.readdirSync(repoRoot, { withFileTypes: true });
  } catch {
    return { ops, warnings };
  }
  const dirNames = entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();

  const seen = new Set();
  for (const name of dirNames) {
    if (claimedSet.has(name)) {
      continue;
    }
    const verdict = classifyTopLevelDir(name, { pinnedToRoot, wholeRepo: false, privBundleName });
    if (verdict === 'SHARED') {
      // SHARED here means the folder is PINNED-TO-ROOT for this provider (the only
      // way a non-claimed, non-skip dir is SHARED): the provider auto-scans it at a
      // FIXED root path. It is the plugin's own folder, so it must be COPIED to the
      // provider root (so the provider discovers it) — NOT bundled, NOT dropped.
      // (A SHARED-because-capability-dir would be in `claimed` and never reach here.)
      for (const rel of listRelativeFiles(path.join(repoRoot, name))) {
        const destinationPath = path.join(targetRoot, name, rel);
        if (seen.has(destinationPath)) {
          continue;
        }
        seen.add(destinationPath);
        ops.push(opCopyPath({
          moduleId: '__pinned__',
          sourceRelativePath: path.posix.join(name, rel),
          destinationPath,
          verbatim: true,
        }));
      }
      warnings.push({ dir: name, action: 'pinned-to-root', provider: adapter.target });
      continue;
    }
    if (verdict === 'SKIP') {
      warnings.push({ dir: name, action: 'skip', provider: adapter.target });
      continue;
    }
    // PRIVATE. A relocated folder must never collide with the bundle's infra
    // siblings (`engine`/`dist`) — that would clobber a sibling and break the
    // fixed `dist/tools → ../../engine` offset (R3/R6). In practice those names
    // are already in `claimed`/`pinnedToRoot`, but guard explicitly and refuse.
    if (BUNDLE_SIBLING_NAMES.includes(name)) {
      warnings.push({ dir: name, action: 'collision', provider: adapter.target,
        message: `non-standard folder "${name}" collides with a reserved bundle sibling; rename it` });
      continue;
    }
    const destBase = bundleSubPath(targetRoot, repoRoot, name);
    warnings.push({ dir: name, action: 'namespaced', provider: adapter.target,
      to: privBundleName ? `${privBundleName}/${name}` : name });
    for (const rel of listRelativeFiles(path.join(repoRoot, name))) {
      const destinationPath = path.join(destBase, rel);
      if (seen.has(destinationPath)) {
        continue;
      }
      seen.add(destinationPath);
      ops.push(opCopyPath({
        moduleId: '__private__',
        sourceRelativePath: path.posix.join(name, rel),
        destinationPath,
        // Non-standard infrastructure, not a model-facing capability: copy
        // byte-for-byte (no frontmatter adapt, no prompt-defense injection), the
        // same discipline as the engine payload.
        verbatim: true,
      }));
    }
  }
  // The dir names routed to PRIVATE, so the caller can stamp them on capability
  // ops (G5 reference rewriting) from this SINGLE scan — no second filesystem walk.
  const namespacedFolders = warnings.filter(w => w.action === 'namespaced').map(w => w.dir).sort();
  return { ops, warnings, namespacedFolders };
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
    // A stray README.md under a capability dir is documentation, NOT an invocable
    // capability — copy it verbatim (no name prefix). (Reference doctrine is no
    // longer under skills/: it lives in the top-level `knowledge/` folder, which
    // the generic namespacer routes into the bundle, never through this copier.)
    const top = parts[0];
    const isNonCapability = top.toLowerCase() === 'readme.md';
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
  claimedTopLevel,
  namespacePrivateFolders,
  flattenDir,
  mcpMergeOps,
  opScaffold,
  collectComponents,
  readFrontmatter,
};
