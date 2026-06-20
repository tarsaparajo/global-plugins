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
const { listRelativeFiles } = require('./helpers');

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
      // _knowledge/ holds progressive-disclosure reference docs, not loaded
      // skill instruction files; they are exempt like READMEs.
      if (rel.split('/')[0] === '_knowledge') {
        continue;
      }
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
  audit,
};
