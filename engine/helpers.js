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
};
