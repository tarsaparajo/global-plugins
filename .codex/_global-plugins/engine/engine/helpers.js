'use strict';

// Operation primitives and shared helpers for the projection engine.
// An "operation" is a plain object the executor applies to disk. Adapters never
// touch the filesystem directly; they emit operations via planOperations().

const fs = require('fs');
const os = require('os');
const path = require('path');

// Each dotfolder prefix is OWNED by exactly one provider target. A canonical
// source path under one provider's prefix must never be projected into another
// provider's dotfolder. ".claude-plugin" is the claude native-root marker;
// ".claude" is claude's own dotfolder.
const PLATFORM_SOURCE_PATH_OWNERS = Object.freeze({
  '.claude': 'claude',
  '.claude-plugin': 'claude',
  '.codex': 'codex',
  '.opencode': 'opencode',
});

// Reserved for target-name ownership aliases (none currently).
const TARGET_OWNERSHIP_ALIASES = Object.freeze({});

function ownershipFor(target) {
  return TARGET_OWNERSHIP_ALIASES[target] || target;
}

function normalizeRelativePath(relativePath) {
  return String(relativePath || '')
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/\/+$/, '');
}

// True when sourceRelativePath belongs to a DIFFERENT provider's dotfolder than
// the adapter currently projecting. Used to skip foreign platform paths and as
// the parity "containment" check.
function isForeignPlatformPath(sourceRelativePath, adapterTarget) {
  const normalizedPath = normalizeRelativePath(sourceRelativePath);
  const owner = ownershipFor(adapterTarget);

  for (const [prefix, ownerTarget] of Object.entries(PLATFORM_SOURCE_PATH_OWNERS)) {
    if (normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)) {
      return ownerTarget !== owner;
    }
  }

  return false;
}

function resolveBaseRoot(kind, input = {}) {
  if (kind === 'home') {
    return input.homeDir || os.homedir();
  }
  if (kind === 'project') {
    const projectRoot = input.projectRoot || input.repoRoot;
    if (!projectRoot) {
      throw new Error('projectRoot or repoRoot is required for project install targets');
    }
    return projectRoot;
  }
  throw new Error(`Unsupported install target kind: ${kind}`);
}

function buildValidationIssue(severity, code, message, extra = {}) {
  return { severity, code, message, ...extra };
}

// Recursively list files under dirPath as normalized relative paths.
function listRelativeFiles(dirPath, prefix = '') {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));
  const files = [];
  for (const entry of entries) {
    const entryPrefix = prefix ? path.posix.join(prefix, entry.name) : entry.name;
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listRelativeFiles(absolutePath, entryPrefix));
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      // Symlinks count as managed entries (do not recurse into them) so the
      // coverage/orphan checks see a universal-substrate link rather than
      // silently skipping it.
      files.push(normalizeRelativePath(entryPrefix));
    }
  }
  return files;
}

// --- Operation factory -----------------------------------------------------
// kind: one of the operation primitives below. strategy: how the executor
// resolves the destination. ownership "managed" means the engine owns the file
// and may overwrite it on re-projection.
function createOperation({
  kind = 'copy-path',
  moduleId,
  sourceRelativePath,
  destinationPath,
  strategy = 'preserve-relative-path',
  ownership = 'managed',
  ...rest
}) {
  return {
    kind,
    moduleId,
    sourceRelativePath: sourceRelativePath == null ? null : normalizeRelativePath(sourceRelativePath),
    destinationPath,
    strategy,
    ownership,
    ...rest,
  };
}

// copy-path: copy a single canonical file to destination verbatim.
function opCopyPath(args) {
  return createOperation({ kind: 'copy-path', strategy: 'preserve-relative-path', ...args });
}

// merge-json: deep-merge a canonical JSON payload into an existing destination
// JSON file (creating it if absent). Used for MCP configs and settings.json.
function opMergeJson(args) {
  return createOperation({ kind: 'merge-json', strategy: 'merge-json', ...args });
}

// flat-rule: flatten a rules directory into a single destination dir, applying
// an optional per-file name transform (e.g. .md -> .mdc, drop README).
function opFlatRule(args) {
  return createOperation({ kind: 'flat-rule', strategy: 'flatten', ...args });
}

// flat-file: flatten a directory of files (e.g. agents) into a destination dir,
// applying an optional per-file name transform.
function opFlatFile(args) {
  return createOperation({ kind: 'flat-file', strategy: 'flatten', ...args });
}

// scaffold: write a managed file whose content the engine produces (not a 1:1
// copy) — e.g. config.toml, install scripts, single-file consolidations.
function opScaffold(args) {
  return createOperation({ kind: 'scaffold', strategy: 'generated', ...args });
}

// build-step: invoke a provider build (e.g. compile the OpenCode TS plugin).
function opBuildStep(args) {
  return createOperation({
    kind: 'build-step',
    strategy: 'build',
    sourceRelativePath: null,
    ...args,
  });
}

// symlink: create a symbolic link at destinationPath pointing at linkTarget (a
// path relative to the link's own directory). Used by the opt-in universal
// substrate so AGENTS.md / CLAUDE.md across providers resolve to one file.
function opSymlink(args) {
  return createOperation({
    kind: 'symlink',
    strategy: 'symlink',
    sourceRelativePath: null,
    ...args,
  });
}

// Deep-merge plain objects (arrays are replaced, not concatenated, to keep
// merges deterministic and idempotent).
function deepMergeJson(base, overlay) {
  if (Array.isArray(overlay) || typeof overlay !== 'object' || overlay === null) {
    return overlay;
  }
  const out = (base && typeof base === 'object' && !Array.isArray(base)) ? { ...base } : {};
  for (const [key, value] of Object.entries(overlay)) {
    out[key] = deepMergeJson(out[key], value);
  }
  return out;
}

function readJsonFile(filePath, label) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse ${label || filePath} at ${filePath}: ${error.message}`);
  }
  return parsed;
}

// Resolve a plugin's slug (its identity label) from its root: prefer the
// `.claude-plugin/plugin.json` name (the canonical plugin identifier, the same
// file compliance.js reads), fall back to package.json `name`, else ''. Cached
// per root because the projector calls this once per emitted file. The slug is
// used to (a) prefix descriptions for OpenCode/Codex (whose CLIs have no native
// namespacing, unlike Claude's `/plugin:cmd`) and (b) prefix OpenCode
// command/agent/skill names so the owner shows in the invocable token itself.
const _pluginLabelCache = new Map();
function pluginLabel(repoRoot) {
  if (!repoRoot) {
    return '';
  }
  if (_pluginLabelCache.has(repoRoot)) {
    return _pluginLabelCache.get(repoRoot);
  }
  let label = '';
  for (const rel of [path.join('.claude-plugin', 'plugin.json'), 'package.json']) {
    try {
      const json = readJsonFile(path.join(repoRoot, rel), rel);
      if (json && typeof json.name === 'string' && json.name.trim()) {
        label = json.name.trim();
        break;
      }
    } catch {
      // Missing/invalid manifest — try the next candidate, default to ''.
    }
  }
  _pluginLabelCache.set(repoRoot, label);
  return label;
}

// Prepend a `[label] ` ownership marker to a description, idempotently: a falsy
// label or a description that already carries this exact `[label] ` prefix is
// returned unchanged (so re-projection never double-prefixes).
function prefixDescription(raw, label) {
  if (!label || raw == null) {
    return raw;
  }
  const marker = `[${label}] `;
  return String(raw).startsWith(marker) ? raw : `${marker}${raw}`;
}

// Remove a leading `[...] ` ownership marker from a description (reverse of
// prefixDescription, used when lifting an OpenCode/Codex plugin back to
// canonical so the marker is not baked into the canonical source).
function stripOwnershipPrefix(raw) {
  if (raw == null) {
    return raw;
  }
  return String(raw).replace(/^\[[^\]]+\]\s+/, '');
}

// Prefix a capability NAME (a command/agent/skill basename) with `<label>-`,
// idempotently. Used by the OpenCode projection so the owner is part of the
// invocable token (`/<label>-<name>`). Falsy label -> unchanged.
function prefixName(name, label) {
  if (!label || !name) {
    return name;
  }
  const marker = `${label}-`;
  return String(name).startsWith(marker) ? name : `${marker}${name}`;
}

// Top-level dir names a provider reads NATIVELY (the standard/shared surface).
// A plugin's private bundle dir MUST NOT collide with one of these, or it would
// shadow the provider's own capability surface or another plugin's shared dir.
const RESERVED_DIR_NAMES = Object.freeze([
  'agents', 'skills', 'commands', 'command', 'plugins', 'plugin',
  'tool', 'tools', 'dist', 'rules', 'hooks', 'mcp', 'prompts', 'engine',
]);

// The two infra siblings that live INSIDE every plugin's private bundle
// (`_<slug>/engine` runtime payload + `_<slug>/dist` compiled OpenCode plugin).
// The bundle dir `_<slug>/` already marks the whole group as infrastructure, so
// its members carry clean names (no redundant `_` prefix): `engine`, `dist`, and
// any namespaced folder (`knowledge`, …). A non-standard source folder relocated
// under `_<slug>/<folder>/` must NEVER be named one of these, or it would clobber
// a sibling and break the fixed `dist/tools → ../../engine` offset (R6). The
// generic folder scanner treats a PRIVATE folder with one of these names as a hard
// error, not a silent overwrite.
const BUNDLE_SIBLING_NAMES = Object.freeze(['engine', 'dist']);

// Top-level entries that are NEVER a plugin's own runtime infrastructure and so
// are SKIPped (with a note) rather than bundled. Three groups:
//  - VCS / tooling metadata and OS junk: `.git`, `node_modules`, `.DS_Store`,
//    `.github`, and the evolution scratch dir `.evolution` (its `baseline`
//    subpath ships as engine payload via a module, not as a top-level folder).
//  - Provider dotfolders (`.claude`/`.codex`/`.opencode`) and the Claude
//    native-root marker `.claude-plugin`: these are projection OUTPUTS, not
//    source folders to re-home.
//  - Repo-meta dev folders never shipped to a runtime install: `tests` (CI only),
//    `migrations` (consumed by the migrate runner from the repo/payload root, not
//    a per-install folder), and `assets` (README/author-time art, seeded into
//    children via templates/, not a runtime payload). These are conventional
//    dev-meta names a plugin's RUNTIME never reads; a plugin that needs reference
//    data at runtime names it `data`/`reference`/`protocols`/etc., which the
//    classifier still routes to PRIVATE.
// Everything unrecognized defaults to PRIVATE (bundled), NEVER dropped.
const SKIP_DIR_NAMES = Object.freeze(new Set([
  '.git', 'node_modules', '.DS_Store', '.github', '.evolution',
  '.claude', '.codex', '.opencode', '.claude-plugin',
  'tests', 'migrations', 'assets',
]));

// Classify a single TOP-LEVEL directory name for one provider into where it must
// land in that provider's home: 'SHARED' (stays at the dotfolder root — the
// provider reads it natively or all plugins share it), 'PRIVATE' (goes into the
// plugin's bundle `_<slug>/<name>/` — the plugin invented it and no provider
// discovers it), or 'SKIP' (genuine junk, dropped with a note). This is the
// SINGLE source of truth consumed by generate, adapt, and the migration runner,
// so all three agree on the same decision. PURE: no filesystem, no plan.
//
// Rules, in order:
//  - wholeRepo (Claude installs the whole repo verbatim) -> SHARED for everything;
//    every folder keeps its repo-root path, which `${CLAUDE_PLUGIN_ROOT}`-relative
//    refs already resolve. Claude is a NO-OP for namespacing.
//  - a SKIP name (junk/metadata/dotfolder) -> SKIP.
//  - a name in this provider's pinnedToRoot allowlist -> SHARED (the provider
//    auto-scans it at a FIXED root path; moving it would break discovery
//    silently). pinnedToRoot is PER-PROVIDER (R2): `prompts`/`rules` are scanned
//    by Codex but not OpenCode; `plugins` is scanned by OpenCode but not Codex.
//  - the plugin's own bundle dir name (`_<slug>`) -> SHARED (it IS the bundle).
//  - anything else -> PRIVATE (the safe default: an unknown folder is namespaced,
//    NEVER silently dropped).
function classifyTopLevelDir(name, { pinnedToRoot, wholeRepo, privBundleName } = {}) {
  if (wholeRepo) {
    return 'SHARED';
  }
  if (SKIP_DIR_NAMES.has(name)) {
    return 'SKIP';
  }
  const pinned = pinnedToRoot instanceof Set ? pinnedToRoot : new Set(pinnedToRoot || []);
  if (pinned.has(name)) {
    return 'SHARED';
  }
  if (privBundleName && name === privBundleName) {
    return 'SHARED';
  }
  return 'PRIVATE';
}

// The single namespaced PRIVATE bundle dir a plugin owns inside a provider's
// home config. ALL of a plugin's non-standard infrastructure (the `engine/`
// runtime payload, the OpenCode `dist/`, the install-state file) lives under it,
// so installing many plugins side-by-side never collides — each plugin gets its
// own `_<slug>/`. Shared/standard dirs (agents/skills/commands, plugins/,
// opencode.json, AGENTS.md, config.toml) are NEVER placed here; they stay at the
// provider root so they keep working across every installed plugin. The `_`
// prefix marks the BUNDLE as infrastructure and groups every plugin's bundle
// together; the bundle's MEMBERS carry clean names (`engine`, `dist`, `knowledge`,
// …) since the bundle itself already signals "infra". Falsy slug -> '' (legacy
// flat layout, used only by fixtures with no manifest).
function privateBundleDir(repoRoot) {
  const slug = pluginLabel(repoRoot);
  return slug ? `_${slug}` : '';
}

// Absolute path of an arbitrary subdir INSIDE a plugin's private bundle:
// <targetRoot>/_<slug>/<subdir> (or <targetRoot>/<subdir> when there is no slug —
// the legacy flat layout used only by manifest-less fixtures). This is the
// GENERAL placement primitive: the runtime payload is `engine`, the OpenCode
// compiled plugin is `dist`, and any non-standard folder a plugin invents is its
// own name — all SIBLINGS under `_<slug>/`. Keeping every bundle member a sibling
// is what preserves the fixed `dist/tools → ../../engine` offset (R6): new
// folders never nest under `engine`/`dist`, they sit beside them.
function bundleSubPath(targetRoot, repoRoot, subdir) {
  const bundle = privateBundleDir(repoRoot);
  return bundle ? path.join(targetRoot, bundle, subdir) : path.join(targetRoot, subdir);
}

// Absolute base path of the runtime payload for a provider install:
// <targetRoot>/_<slug>/engine (or <targetRoot>/engine when there is no slug).
// Single source of truth shared by the payload planner (_base.payloadCopy), the
// OpenCode build (dist must sit as a SIBLING of this), the drift guard, and the
// tests, so the layout rule lives in exactly one place. Expressed through
// bundleSubPath so the `engine` slot is just one named member of the bundle.
function payloadBasePath(targetRoot, repoRoot) {
  return bundleSubPath(targetRoot, repoRoot, 'engine');
}

module.exports = {
  PLATFORM_SOURCE_PATH_OWNERS,
  ownershipFor,
  normalizeRelativePath,
  isForeignPlatformPath,
  resolveBaseRoot,
  buildValidationIssue,
  listRelativeFiles,
  createOperation,
  opCopyPath,
  opMergeJson,
  opFlatRule,
  opFlatFile,
  opScaffold,
  opBuildStep,
  opSymlink,
  deepMergeJson,
  readJsonFile,
  pluginLabel,
  prefixDescription,
  stripOwnershipPrefix,
  prefixName,
  RESERVED_DIR_NAMES,
  BUNDLE_SIBLING_NAMES,
  SKIP_DIR_NAMES,
  classifyTopLevelDir,
  privateBundleDir,
  bundleSubPath,
  payloadBasePath,
};
