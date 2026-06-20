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

    supports(targetOrId) {
      return targetOrId === entry.id || targetOrId === entry.target;
    },

    resolveRoot(input) {
      const base = resolveBaseRoot(entry.kind, input);
      return path.join(base, ...adapter.rootSegments);
    },

    getInstallStatePath(input) {
      return path.join(adapter.resolveRoot(input), ...adapter.installStatePathSegments);
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

  const supportedModules = modules.filter(m => adapter.moduleSupported(m));
  const operations = adapter.planOperations({ ...planInput, modules: supportedModules });

  return {
    adapter: { id: adapter.id, target: adapter.target, kind: adapter.kind },
    targetRoot: adapter.resolveRoot(planInput),
    installStatePath: adapter.getInstallStatePath(planInput),
    buildStep: adapter.buildStep,
    validationIssues,
    operations,
  };
}

module.exports = {
  REGISTRY_PATH,
  createAdapter,
  getAdapters,
  listProviders,
  getAdapter,
  planScaffold,
};
