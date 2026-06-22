'use strict';

// Compliance: the governance + projection + i18n + security gate. Runs as the
// engine behind /validate and /audit, in CI, and as the first side-effect of a
// child's /evolve. Emits a severity-ranked report. The self-sufficiency guard
// (check 9) is hard and non-suppressible.

const fs = require('fs');
const path = require('path');

const semver = require('./semver');
const promptDefense = require('./prompt-defense');
const { listProviders } = require('./registry');
const { listRelativeFiles, payloadBasePath, privateBundleDir, RESERVED_DIR_NAMES } = require('./helpers');
const { OPENCODE_THEME_TOKENS } = require('./frontmatter');

// Terms that would reveal a source/methodology/inspiration origin. Any hit in a
// shipped file fails the build. The terms are assembled from fragments so this
// definition does not match itself when the engine scans its own source. Kept
// conservative to avoid false positives on ordinary English.
const SELF_SUFFICIENCY_DENYLIST = [
  ['every', 'thing-claude-code'].join(''),
  ['audited', ' method', 'ology'].join(''),
  ['method', 'ology origin'].join(''),
  ['reverse', '-engineered'].join(''),
  ['inspired', ' by the original'].join(''),
  ['derived', ' from the original'].join(''),
  ['modeled', ' on the original'].join(''),
  ['copied', ' from the original'].join(''),
];

// Files that are never shipped and so are exempt from scanning.
const SCAN_IGNORE = new Set(['node_modules', '.git']);

function finding(severity, code, message, extra = {}) {
  return { severity, code, message, ...extra };
}

function checkManifests(root) {
  const out = [];
  const pj = path.join(root, '.claude-plugin', 'plugin.json');
  const mj = path.join(root, '.claude-plugin', 'marketplace.json');
  if (!fs.existsSync(pj)) {
    return [finding('error', 'manifest-missing', 'plugin.json missing')];
  }
  const p = JSON.parse(fs.readFileSync(pj, 'utf8'));
  if (fs.existsSync(mj)) {
    const m = JSON.parse(fs.readFileSync(mj, 'utf8'));
    const mp = m.plugins && m.plugins[0];
    if (mp && mp.name !== p.name) {
      out.push(finding('error', 'manifest-name-mismatch', `plugin.json name "${p.name}" != marketplace "${mp.name}"`));
    }
    if (mp && mp.license !== p.license) {
      out.push(finding('warning', 'manifest-license-mismatch', 'license differs between manifests'));
    }
  }
  return out;
}

function checkVersionSync(root) {
  const res = semver.checkSync(root);
  return res.ok ? [] : res.drift.map(d =>
    finding('error', 'version-drift', `${d.file} version ${d.got} != VERSION ${d.expected}`));
}

function checkRegistry() {
  const out = [];
  for (const a of listProviders()) {
    if (!a.rootSegments.length) {
      out.push(finding('error', 'adapter-no-root', `adapter ${a.id} has no rootSegments`));
    }
    if (!a.installStatePathSegments.length) {
      out.push(finding('error', 'adapter-no-install-state', `adapter ${a.id} missing installStatePathSegments`));
    }
  }
  return out;
}

// Walk every shipped .md / text file and assert the denylist never matches.
function checkSelfSufficiency(root) {
  const out = [];
  walk(root, (abs, rel) => {
    if (!/\.(md|json|js|mjs|ts|toml|txt|yml|yaml)$/i.test(abs)) {
      return;
    }
    let content;
    try {
      content = fs.readFileSync(abs, 'utf8').toLowerCase();
    } catch {
      return;
    }
    for (const term of SELF_SUFFICIENCY_DENYLIST) {
      if (content.includes(term)) {
        out.push(finding('error', 'self-sufficiency-leak', `"${term}" found in ${rel}`, { file: rel }));
      }
    }
  });
  return out;
}

function checkPromptDefense(root) {
  const out = [];
  const dirs = ['agents', 'skills', 'commands'];
  for (const d of dirs) {
    const base = path.join(root, d);
    if (!fs.existsSync(base)) {
      continue;
    }
    for (const rel of listRelativeFiles(base)) {
      if (!rel.endsWith('.md')) {
        continue;
      }
      const lower = path.basename(rel).toLowerCase();
      if (['readme.md'].includes(lower)) {
        continue;
      }
      // Reference doctrine (the top-level `knowledge/` folder) holds
      // progressive-disclosure docs, not loaded skill instructions — it is exempt
      // from the baseline. It is not under any capability dir scanned here, so no
      // explicit skip is needed.
      const content = fs.readFileSync(path.join(base, rel), 'utf8');
      if (!promptDefense.hasBaseline(content)) {
        out.push(finding('error', 'missing-prompt-defense', `${d}/${rel} lacks Prompt Defense Baseline`));
      }
    }
  }
  return out;
}

function checkI18n(root) {
  const out = [];
  const cfgPath = path.join(root, 'config', 'locales.json');
  if (!fs.existsSync(cfgPath)) {
    return [finding('warning', 'i18n-no-config', 'config/locales.json missing')];
  }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  for (const loc of cfg.locales || []) {
    const readme = path.join(root, 'docs', loc.dir, 'README.md');
    if (!fs.existsSync(readme)) {
      out.push(finding('error', 'i18n-missing-readme', `docs/${loc.dir}/README.md missing (selector would 404)`));
    }
  }
  return out;
}

// Committed-projection guard. The engine adapts frontmatter per provider
// (drop `model:` everywhere; rewrite a named Claude color -> hex for OpenCode),
// but that only helps the FRESH output — a previously committed projection can
// still carry the old, invalid shape if it was never regenerated. That exact
// gap shipped a `.opencode` agent with `color: cyan` + a stale `model:`, which
// OpenCode rejects on install. This check reads the committed projection files
// directly and fails on the two symptoms; the full byte-for-byte drift guard
// lives in tests/test_projection_drift.js. Read-only: it never re-projects, so
// `validate` stays fast and pure. The remedy is always the same — re-project.
function checkProjectionDrift(root) {
  const out = [];
  const FIX = 'run: node scripts/evolve/project.mjs --apply';

  // Every committed agent on a file-based provider must not preset `model:`.
  // (Codex re-expresses agents inside config.toml/AGENTS.md/skills — same rule.)
  const modelDirs = ['.claude/agents', '.opencode/agents', '.codex'];
  for (const d of modelDirs) {
    const base = path.join(root, d);
    if (!fs.existsSync(base)) {
      continue;
    }
    for (const rel of listRelativeFiles(base)) {
      if (!/\.(md|toml)$/.test(rel)) {
        continue;
      }
      const file = `${d}/${rel}`;
      const content = fs.readFileSync(path.join(base, rel), 'utf8');
      if (/^model:/m.test(content)) {
        out.push(finding('error', 'projection-drift',
          `${file} carries a preset "model:" — model is never preset (a CLI/runtime choice); ${FIX}`, { file }));
      }
    }
  }

  // Every committed OpenCode agent color must be a hex #RRGGBB or a theme token —
  // a bare Claude name (cyan, green, …) is rejected by OpenCode's validator. A hex
  // MUST be YAML-quoted ("#RRGGBB"): a bare # after ": " starts a comment, so an
  // unquoted hex parses empty and OpenCode rejects the agent.
  const ocAgents = path.join(root, '.opencode', 'agents');
  if (fs.existsSync(ocAgents)) {
    for (const rel of listRelativeFiles(ocAgents)) {
      if (!rel.endsWith('.md')) {
        continue;
      }
      const file = `.opencode/agents/${rel}`;
      const content = fs.readFileSync(path.join(ocAgents, rel), 'utf8');
      const m = content.match(/^color:\s*(.+?)\s*$/m);
      if (!m) {
        continue;
      }
      const raw = m[1];
      const wasQuoted = /^".*"$/.test(raw);
      const value = raw.replace(/^"|"$/g, '');
      if (/^#[0-9a-fA-F]{6}$/.test(value)) {
        if (!wasQuoted) {
          out.push(finding('error', 'projection-drift',
            `${file} has a BARE hex color "${value}" — must be YAML-quoted ("${value}") or OpenCode reads it as a comment; ${FIX}`, { file }));
        }
      } else if (!OPENCODE_THEME_TOKENS.includes(value)) {
        out.push(finding('error', 'projection-drift',
          `${file} has invalid OpenCode color "${value}" — needs hex #RRGGBB or a theme token; ${FIX}`, { file }));
      }
    }
  }

  // Runtime-payload completeness: a Codex/OpenCode install must carry a COMPLETE
  // engine under engine/ so it can generate/adapt/evolve itself. A partial payload
  // would fail at re-projection on the user's machine — fail loud here instead. (Only
  // checked when the dotfolder exists; Claude carries the engine via whole-repo.)
  const REQUIRED_PAYLOAD = [
    'engine/resolver.js', 'engine/projector.js', 'engine/executor.js', 'engine/builder.js',
    'engine/frontmatter.js', 'engine/helpers.js', 'engine/registry.js',
    'scripts/evolve/project.mjs', 'manifests/modules.json', 'adapters/registry.json',
  ];
  // The payload lives in the plugin's PRIVATE bundle `_<slug>/engine/` (the
  // namespacing that lets many plugins install side-by-side). Compute the base the
  // same way the engine does (helpers.payloadBasePath), so this check tracks the
  // layout from one source of truth.
  const bundle = privateBundleDir(root);
  const bundleLabel = bundle ? `${bundle}/engine` : 'engine';
  for (const dot of ['.codex', '.opencode']) {
    const dotBase = path.join(root, dot);
    if (!fs.existsSync(dotBase)) {
      continue;
    }
    const payload = payloadBasePath(dotBase, root);
    if (!fs.existsSync(payload)) {
      out.push(finding('error', 'projection-drift',
        `${dot}/${bundleLabel}/ missing — the install cannot run the projection engine to generate child plugins; ${FIX}`,
        { file: `${dot}/${bundleLabel}` }));
      continue;
    }
    for (const rel of REQUIRED_PAYLOAD) {
      if (!fs.existsSync(path.join(payload, rel))) {
        out.push(finding('error', 'projection-drift',
          `${dot}/${bundleLabel}/${rel} missing — incomplete runtime payload; ${FIX}`, { file: `${dot}/${bundleLabel}/${rel}` }));
      }
    }
    // The private bundle name must not collide with a reserved provider dir
    // (which would shadow a standard capability/discovery surface).
    if (bundle && RESERVED_DIR_NAMES.includes(bundle.replace(/^_/, ''))) {
      out.push(finding('error', 'projection-drift',
        `plugin slug "${bundle.replace(/^_/, '')}" collides with a reserved provider dir name; rename the plugin; ${FIX}`,
        { file: `${dot}/${bundle}` }));
    }
  }

  return out;
}

function walk(root, fn, rel = '') {
  const dir = rel ? path.join(root, rel) : root;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (SCAN_IGNORE.has(e.name)) {
      continue;
    }
    const childRel = rel ? path.posix.join(rel, e.name) : e.name;
    const abs = path.join(root, childRel);
    if (e.isDirectory()) {
      walk(root, fn, childRel);
    } else {
      fn(abs, childRel);
    }
  }
}

// Run the full audit. Returns { ok, findings } where ok=false if any error.
function audit(root, options = {}) {
  const findings = [
    ...checkManifests(root),
    ...checkVersionSync(root),
    ...checkRegistry(),
    ...checkPromptDefense(root),
    ...checkI18n(root),
    ...checkSelfSufficiency(root),
    ...checkProjectionDrift(root),
  ];
  const ok = !findings.some(f => f.severity === 'error');
  return { ok, findings };
}

module.exports = {
  SELF_SUFFICIENCY_DENYLIST,
  checkManifests,
  checkVersionSync,
  checkRegistry,
  checkSelfSufficiency,
  checkPromptDefense,
  checkI18n,
  checkProjectionDrift,
  audit,
};
