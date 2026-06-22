'use strict';

// OpenCode (home scope). Canonical components are copied, then a compiled
// TypeScript plugin payload is produced under .opencode/dist/. The build step
// MUST run before validate() succeeds; planFromModules appends it (via the
// adapter.buildStep) and validate() hard-fails if dist artefacts are missing.

const fs = require('fs');
const path = require('path');
const { planFromModules, defaultCopy, ownerPrefixedCopy, payloadCopy, claimedTopLevel, namespacePrivateFolders } = require('./_base');
const { buildValidationIssue, pluginLabel, privateBundleDir } = require('../helpers');

// The compiled-payload artefacts the build step must produce, resolved against
// this plugin's private bundle (`.opencode/_<slug>/dist/`) plus the per-slug
// discovery loader at the shared `.opencode/plugins/<slug>.js`. Slug-aware so a
// child's artefacts are checked in its own bundle, never the parent's.
function requiredArtefacts(repoRoot) {
  const bundle = privateBundleDir(repoRoot);
  const distBase = bundle ? path.join('.opencode', bundle, 'dist') : path.join('.opencode', 'dist');
  const arts = [
    { rel: path.join(distBase, 'index.js'), type: 'file' },
    { rel: path.join(distBase, 'plugins'), type: 'directory' },
    { rel: path.join(distBase, 'tools'), type: 'directory' },
  ];
  const slug = pluginLabel(repoRoot);
  if (slug) {
    arts.push({ rel: path.join('.opencode', 'plugins', `${slug}.js`), type: 'file' });
  }
  return arts;
}

function isExpectedType(absPath, type) {
  try {
    const stat = fs.statSync(absPath);
    return type === 'file' ? stat.isFile() : stat.isDirectory();
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) {
      return false;
    }
    throw error;
  }
}

// Validate checks the build payload at the OUTPUT root (where the projection is
// written and where the build step produces dist/), resolved from the adapter.
// Planning is allowed before the build; the projector runs the build step
// first, then validation confirms the artefacts exist.
function validate(input, adapter) {
  if (input.skipBuildCheck) {
    return [];
  }
  // Resolve the output root the same way the adapter resolves its target root,
  // minus the .opencode segment (requiredArtefacts paths include it).
  let outputBase;
  try {
    outputBase = adapter ? path.dirname(adapter.resolveRoot(input)) : (input.projectRoot || input.homeDir || input.repoRoot);
  } catch {
    return [];
  }
  if (!outputBase) {
    return [];
  }
  const slug = pluginLabel(input.repoRoot);
  const distHint = slug ? `.opencode/_${slug}/dist` : '.opencode/dist';
  const buildCmd = `node engine/build-opencode.js .${slug ? ` ${slug}` : ''}`;
  const missing = requiredArtefacts(input.repoRoot)
    .filter(a => !isExpectedType(path.join(outputBase, a.rel), a.type))
    .map(a => a.rel);
  if (missing.length === 0) {
    return [];
  }
  return [buildValidationIssue(
    'error',
    'opencode-plugin-not-built',
    `OpenCode install requires the compiled payload under ${distHint}; missing: ${missing.join(', ')}. `
      + `Run "${buildCmd}" before re-running the projector.`,
    { missing }
  )];
}

function planOperations(planInput, adapter) {
  // Owner-prefix the invocable NAME of agents/skills/commands (e.g.
  // `/<slug>-adapt`) so the owning plugin is identifiable in OpenCode's `/`
  // palette — OpenCode has no native namespacing like Claude's `/plugin:cmd`.
  // hooks/rules/mcp are not invocable capabilities, so they copy verbatim.
  const label = pluginLabel(planInput.repoRoot);
  const prefixed = ctx => ownerPrefixedCopy(ctx, label);
  const handlers = {
    agents: prefixed,
    skills: prefixed,
    commands: prefixed,
    hooks: defaultCopy,
    rules: defaultCopy,
    mcp: defaultCopy,
  };
  // Scan for non-standard invented folders and route them into `_<slug>/<dir>/`
  // (G1). Computed first so the namespaced names are stamped on capability ops for
  // reference rewriting (G5). claimed subtracts capability handlers + payload dirs.
  // Note OpenCode's pinnedToRoot does NOT include prompts/rules (unlike Codex), so
  // a source `prompts/`/`rules/` not claimed by a module IS bundled here (R2).
  const claimed = claimedTopLevel(planInput, adapter, handlers);
  const priv = namespacePrivateFolders(planInput, adapter, { claimed });

  const ops = planFromModules(planInput, adapter, handlers, { namespacedFolders: priv.namespacedFolders });
  // Runtime payload: ship the projection engine into .opencode/_<slug>/engine/ so
  // an OpenCode install can itself generate/adapt/evolve child plugins. The native
  // dist/ tools (build-opencode.js) shell out to this payload. Separate from the
  // capability surface; never scanned/owner-prefixed as a capability.
  ops.push(...payloadCopy(planInput, adapter));
  // Non-standard invented folders -> `_<slug>/<dir>/` (siblings of engine/dist).
  ops.push(...priv.ops);
  if (priv.warnings.length) {
    ops.warnings = priv.warnings;
  }
  return ops;
}

module.exports = { planOperations, validate };
