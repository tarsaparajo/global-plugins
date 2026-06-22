'use strict';

// Resolver: reads the 3-tier manifests (profiles -> modules -> components) and
// resolves a request (a profile name, a list of module ids, or "all") into the
// concrete module set, then into the target-adapter set. Dependencies are
// resolved transitively; targets[] on each module is the per-provider
// compatibility registry.

const fs = require('fs');
const path = require('path');

const { listProviders } = require('./registry');

function loadManifests(pluginRoot) {
  const dir = path.join(pluginRoot, 'manifests');
  const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  return {
    profiles: read('profiles.json'),
    modules: read('modules.json'),
    components: read('components.json'),
  };
}

function moduleById(manifests, id) {
  return (manifests.modules.modules || []).find(m => m.id === id) || null;
}

// Resolve a module id plus all its transitive dependencies.
function resolveModuleWithDeps(manifests, id, acc = new Set()) {
  if (acc.has(id)) {
    return acc;
  }
  const module = moduleById(manifests, id);
  if (!module) {
    throw new Error(`Unknown module: ${id}`);
  }
  acc.add(id);
  for (const dep of (module.dependencies || [])) {
    resolveModuleWithDeps(manifests, dep, acc);
  }
  return acc;
}

// Resolve a profile name into its module set (with deps).
function resolveProfile(manifests, profileName) {
  const profile = (manifests.profiles.profiles || {})[profileName];
  if (!profile) {
    throw new Error(`Unknown profile: ${profileName}`);
  }
  const acc = new Set();
  for (const id of profile.modules) {
    resolveModuleWithDeps(manifests, id, acc);
  }
  return [...acc].map(id => moduleById(manifests, id));
}

// Resolve "all" modules.
function resolveAllModules(manifests) {
  return (manifests.modules.modules || []).slice();
}

// Given a resolved module set, compute the union of targets[] they declare.
function resolveTargets(modules, requestedTargets) {
  const declared = new Set();
  for (const m of modules) {
    for (const t of (m.targets || [])) {
      declared.add(t);
    }
  }
  const available = new Set(listProviders().map(a => a.target));
  let targets = [...declared].filter(t => available.has(t));
  if (Array.isArray(requestedTargets) && requestedTargets.length > 0 && requestedTargets[0] !== 'all') {
    targets = targets.filter(t => requestedTargets.includes(t));
  }
  return targets;
}

// Top-level resolve. request: { profile?, modules?, targets? }
function resolve(pluginRoot, request = {}) {
  const manifests = loadManifests(pluginRoot);
  let modules;
  if (request.profile) {
    modules = resolveProfile(manifests, request.profile);
  } else if (Array.isArray(request.modules) && request.modules.length > 0) {
    const acc = new Set();
    for (const id of request.modules) {
      resolveModuleWithDeps(manifests, id, acc);
    }
    modules = [...acc].map(id => moduleById(manifests, id));
  } else {
    modules = resolveAllModules(manifests);
  }
  const targets = resolveTargets(modules, request.targets);
  return { manifests, modules, targets };
}

module.exports = {
  loadManifests,
  moduleById,
  resolveModuleWithDeps,
  resolveProfile,
  resolveAllModules,
  resolveTargets,
  resolve,
};
