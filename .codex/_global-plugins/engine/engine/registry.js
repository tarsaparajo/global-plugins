'use strict';

// Loads the target-adapter registry and exposes adapter lookup + scaffold
// planning. Each registry entry is paired with a provider module under
// engine/providers/<id>.js that supplies the transform logic. The registry is
// the only place the supported-provider set is declared; nothing hardcodes it.

const fs = require('fs');
const path = require('path');

const {
  resolveBaseRoot,
  buildValidationIssue,
  isForeignPlatformPath,
  privateBundleDir,
} = require('./helpers');

const REGISTRY_PATH = path.join(__dirname, '..', 'adapters', 'registry.json');

function loadRegistryFile() {
  const raw = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  if (!raw || !Array.isArray(raw.providers)) {
    throw new Error('Invalid registry.json: expected { providers: [...] }');
  }
  return raw;
}

// Wrap an entry + its provider module into a frozen adapter object.
function createAdapter(entry, providerModule) {
  const adapter = {
    id: entry.id,
    target: entry.target,
    kind: entry.kind,
    rootSegments: Object.freeze((entry.rootSegments || []).slice()),
    installStatePathSegments: Object.freeze((entry.installStatePathSegments || []).slice()),
    nativeRootRelativePath: entry.nativeRootRelativePath || null,
    transforms: Object.freeze((entry.transforms || []).slice()),
    buildStep: entry.buildStep ? Object.freeze({ ...entry.buildStep }) : null,
    supportsModule: entry.supportsModule || 'always',
    stability: entry.stability || 'stable',
    // Placement metadata for the generic non-standard-folder classifier.
    // wholeRepoInstall (Claude): the provider installs the whole repo verbatim, so
    // EVERY folder keeps its repo-root path and nothing is namespaced — the scanner
    // is a no-op. pinnedToRoot: the top-level dir NAMES this provider auto-scans at
    // a FIXED root path (per-provider — R2); the classifier keeps them at the root
    // even though another provider might bundle the same name.
    wholeRepoInstall: entry.wholeRepoInstall === true,
    pinnedToRoot: Object.freeze((entry.pinnedToRoot || []).slice()),

    supports(targetOrId) {
      return targetOrId === entry.id || targetOrId === entry.target;
    },

    resolveRoot(input) {
      const base = resolveBaseRoot(entry.kind, input);
      return path.join(base, ...adapter.rootSegments);
    },

    getInstallStatePath(input) {
      // A `${bundle}` token in a segment resolves to the plugin's private bundle
      // dir (`_<slug>/`), so the install-state file lands inside the namespaced
      // bundle (`_<slug>/install-state.json`) and never collides with another
      // plugin's state at the same provider home. An empty bundle (no slug) drops
      // the segment, keeping the legacy flat path for fixtures.
      const bundle = privateBundleDir(input.repoRoot);
      const segments = adapter.installStatePathSegments
        .map(seg => (seg === '${bundle}' ? bundle : seg))
        .filter(seg => seg !== '');
      return path.join(adapter.resolveRoot(input), ...segments);
    },

    // "antigravity-style" adapters only support a module if it still has a
    // path after foreign-path filtering; the default is to always support.
    moduleSupported(module) {
      if (adapter.supportsModule !== 'non-empty-paths') {
        return true;
      }
      const paths = Array.isArray(module.paths) ? module.paths : [];
      return paths.some(p => !isForeignPlatformPath(p, adapter.target));
    },

    validate(input) {
      const issues = [];
      if (entry.kind === 'project' && !input.projectRoot && !input.repoRoot) {
        issues.push(buildValidationIssue('error', 'missing-project-root',
          `projectRoot or repoRoot required for project target ${entry.id}`));
      }
      if (entry.kind === 'home' && !input.homeDir) {
        issues.push(buildValidationIssue('error', 'missing-home-dir',
          `homeDir required for home target ${entry.id}`));
      }
      if (typeof providerModule.validate === 'function') {
        issues.push(...providerModule.validate(input, adapter));
      }
      return issues;
    },

    // Delegate the actual canonical->native transform to the provider module.
    planOperations(planInput) {
      return providerModule.planOperations(planInput, adapter);
    },
  };

  return Object.freeze(adapter);
}

function buildAdapters() {
  const registry = loadRegistryFile();
  return registry.providers.map(entry => {
    const modulePath = path.join(__dirname, 'providers', `${entry.id}.js`);
    let providerModule;
    try {
      providerModule = require(modulePath);
    } catch (error) {
      throw new Error(`Missing or invalid provider module for "${entry.id}" at ${modulePath}: ${error.message}`);
    }
    if (typeof providerModule.planOperations !== 'function') {
      throw new Error(`Provider module "${entry.id}" must export planOperations()`);
    }
    return createAdapter(entry, providerModule);
  });
}

let _adapters = null;
function getAdapters() {
  if (!_adapters) {
    _adapters = Object.freeze(buildAdapters());
  }
  return _adapters;
}

function listProviders() {
  return getAdapters().slice();
}

function getAdapter(targetOrId) {
  const adapter = getAdapters().find(a => a.supports(targetOrId));
  if (!adapter) {
    throw new Error(`Unknown provider adapter: ${targetOrId}`);
  }
  return adapter;
}

// Whether a module declares this provider in its targets[] compatibility
// registry. An empty/absent targets[] means "no restriction" — projected to
// every provider (the default for modules and test fixtures that omit it).
function moduleTargetsProvider(module, target) {
  const targets = Array.isArray(module.targets) ? module.targets : [];
  return targets.length === 0 || targets.includes(target);
}

// Whether a module declares this provider in its payloadTargets[] — i.e. its
// paths should ship to the provider as a verbatim RUNTIME PAYLOAD (under
// <dotfolder>/engine/), NOT as a projected capability. Absent/empty means "no
// payload for any provider" (the default — only engine/manifests/templates opt
// in). This is deliberately the inverse default of targets[] (which is
// unrestricted when empty): payload is opt-in, capability is opt-out.
function modulePayloadTargetsProvider(module, target) {
  const payloadTargets = Array.isArray(module.payloadTargets) ? module.payloadTargets : [];
  return payloadTargets.includes(target);
}

// Plan the full scaffold for one target over a set of modules.
function planScaffold(options = {}) {
  const adapter = getAdapter(options.target);
  const modules = Array.isArray(options.modules) ? options.modules : [];
  const planInput = {
    repoRoot: options.repoRoot,
    projectRoot: options.projectRoot || options.repoRoot,
    homeDir: options.homeDir,
    // Opt-in universal-substrate flag (default off) threaded through to the
    // provider modules so they can plan instruction-file symlinks.
    universalSubstrate: options.universalSubstrate || false,
  };

  const validationIssues = adapter.validate(planInput);
  const blocking = validationIssues.filter(i => i.severity === 'error');
  if (blocking.length > 0) {
    throw new Error(blocking.map(i => i.message).join('; '));
  }

  // A module is projected to this target only when its targets[] registry
  // (manifests/modules.json — "the per-provider compatibility registry") names
  // this provider. A module with NO targets[] is unrestricted (projected
  // everywhere) — this preserves behavior for ad-hoc modules and test fixtures
  // that omit the field. Without this filter a claude-only module (e.g. the
  // engine/, adapters/, manifests/ source) would be copied into every dotfolder,
  // bloating non-claude installs with infrastructure they never run.
  const supportedModules = modules
    .filter(m => adapter.moduleSupported(m))
    .filter(m => moduleTargetsProvider(m, adapter.target));
  // The full (unfiltered) module list is threaded as allModules so a provider can
  // plan a RUNTIME PAYLOAD from modules whose CAPABILITY targets[] exclude it but
  // whose payloadTargets[] include it (engine/manifests/templates → engine/).
  // This never re-enters the capability surface: payload modules are absent from
  // supportedModules, so planFromModules' capability handlers never see them.
  const operations = adapter.planOperations({ ...planInput, modules: supportedModules, allModules: modules });

  return {
    adapter: { id: adapter.id, target: adapter.target, kind: adapter.kind },
    targetRoot: adapter.resolveRoot(planInput),
    installStatePath: adapter.getInstallStatePath(planInput),
    buildStep: adapter.buildStep,
    validationIssues,
    operations,
    // Non-standard-folder re-home / skip notices (G3). A provider attaches them to
    // the returned operations array (which is an object); lift them onto the plan
    // so the human-gate and `project.mjs --dry-run` can show "folder X re-homed to
    // _<slug>/X/ (warning)" instead of moving/dropping a folder silently.
    warnings: Array.isArray(operations.warnings) ? operations.warnings : [],
  };
}

module.exports = {
  REGISTRY_PATH,
  createAdapter,
  getAdapters,
  listProviders,
  getAdapter,
  planScaffold,
  moduleTargetsProvider,
  modulePayloadTargetsProvider,
};
