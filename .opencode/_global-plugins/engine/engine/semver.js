'use strict';

// SemVer source-of-truth handling. VERSION (plugin root) is the only writable
// version; sync() fans it out to plugin.json + marketplace.json. bump() applies
// a major/minor/patch increment. Pure string helpers; the caller writes files.

const fs = require('fs');
const path = require('path');

function parse(version) {
  const m = String(version).trim().match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!m) {
    throw new Error(`Invalid SemVer: ${version}`);
  }
  return { major: +m[1], minor: +m[2], patch: +m[3], prerelease: m[4] || null };
}

function format({ major, minor, patch, prerelease }) {
  const base = `${major}.${minor}.${patch}`;
  return prerelease ? `${base}-${prerelease}` : base;
}

function bump(version, level) {
  const v = parse(version);
  if (level === 'major') {
    return format({ major: v.major + 1, minor: 0, patch: 0, prerelease: null });
  }
  if (level === 'minor') {
    return format({ major: v.major, minor: v.minor + 1, patch: 0, prerelease: null });
  }
  if (level === 'patch') {
    return format({ major: v.major, minor: v.minor, patch: v.patch + 1, prerelease: null });
  }
  throw new Error(`Unknown bump level: ${level}`);
}

function readVersion(pluginRoot) {
  return fs.readFileSync(path.join(pluginRoot, 'VERSION'), 'utf8').trim();
}

function writeVersion(pluginRoot, version) {
  parse(version); // validate
  fs.writeFileSync(path.join(pluginRoot, 'VERSION'), `${version}\n`);
}

// Fan VERSION out to the manifests. Returns the list of files rewritten.
function sync(pluginRoot) {
  const version = readVersion(pluginRoot);
  const targets = [
    { file: '.claude-plugin/plugin.json', apply: (j) => { j.version = version; } },
    {
      file: '.claude-plugin/marketplace.json',
      apply: (j) => {
        if (Array.isArray(j.plugins) && j.plugins[0]) {
          j.plugins[0].version = version;
        }
      },
    },
  ];
  const written = [];
  for (const t of targets) {
    const abs = path.join(pluginRoot, t.file);
    if (!fs.existsSync(abs)) {
      continue;
    }
    const json = JSON.parse(fs.readFileSync(abs, 'utf8'));
    t.apply(json);
    fs.writeFileSync(abs, `${JSON.stringify(json, null, 2)}\n`);
    written.push(t.file);
  }
  return { version, written };
}

// Check that every derived manifest agrees with VERSION (no drift).
function checkSync(pluginRoot) {
  const version = readVersion(pluginRoot);
  const drift = [];
  const pj = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
  if (fs.existsSync(pj)) {
    const j = JSON.parse(fs.readFileSync(pj, 'utf8'));
    if (j.version !== version) {
      drift.push({ file: '.claude-plugin/plugin.json', expected: version, got: j.version });
    }
  }
  const mj = path.join(pluginRoot, '.claude-plugin', 'marketplace.json');
  if (fs.existsSync(mj)) {
    const j = JSON.parse(fs.readFileSync(mj, 'utf8'));
    const got = j.plugins && j.plugins[0] && j.plugins[0].version;
    if (got !== version) {
      drift.push({ file: '.claude-plugin/marketplace.json', expected: version, got });
    }
  }
  return { ok: drift.length === 0, version, drift };
}

module.exports = { parse, format, bump, readVersion, writeVersion, sync, checkSync };
