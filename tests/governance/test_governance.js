'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const PLUGIN_ROOT = path.join(__dirname, '..', '..');
const semver = require('../../engine/semver');
const compliance = require('../../engine/compliance');

test('VERSION is valid SemVer and synced to the manifests', () => {
  const res = semver.checkSync(PLUGIN_ROOT);
  assert.ok(res.ok, `version drift: ${JSON.stringify(res.drift)}`);
});

test('semver bump levels behave correctly', () => {
  assert.strictEqual(semver.bump('0.1.0', 'patch'), '0.1.1');
  assert.strictEqual(semver.bump('0.1.0', 'minor'), '0.2.0');
  assert.strictEqual(semver.bump('0.1.9', 'major'), '1.0.0');
});

test('CHANGELOG follows Keep a Changelog with an Unreleased section', () => {
  const cl = fs.readFileSync(path.join(PLUGIN_ROOT, 'CHANGELOG.md'), 'utf8');
  assert.ok(cl.includes('## [Unreleased]'));
  assert.ok(/## \[0\.1\.0\]/.test(cl));
});

test('the language selector lists all fourteen labels and every locale README exists', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'config', 'locales.json'), 'utf8'));
  assert.strictEqual(cfg.locales.length, 13, '13 localized + English = 14');
  const readme = fs.readFileSync(path.join(PLUGIN_ROOT, 'README.md'), 'utf8');
  for (const loc of cfg.locales) {
    assert.ok(readme.includes(`docs/${loc.dir}/README.md`), `selector missing ${loc.dir}`);
    assert.ok(fs.existsSync(path.join(PLUGIN_ROOT, 'docs', loc.dir, 'README.md')), `missing docs/${loc.dir}/README.md`);
  }
});

test('compliance audit passes with zero errors', () => {
  const r = compliance.audit(PLUGIN_ROOT);
  const errors = r.findings.filter(f => f.severity === 'error');
  assert.ok(r.ok, `compliance errors: ${JSON.stringify(errors, null, 2)}`);
});

test('self-sufficiency guard finds no source attribution', () => {
  const leaks = compliance.checkSelfSufficiency(PLUGIN_ROOT);
  assert.strictEqual(leaks.length, 0, `leaks: ${JSON.stringify(leaks)}`);
});

test('every version marker (package.json, README badges, hero pill) equals VERSION', () => {
  // checkSync now covers the full bump-target list (knowledge/bump-protocol.md):
  // the two .claude-plugin manifests, package.json, every README badge, and the
  // hero pill. This is the guard that catches a forgotten badge / stale package.json.
  const res = semver.checkSync(PLUGIN_ROOT);
  assert.ok(res.ok, `version-marker drift: ${JSON.stringify(res.drift, null, 2)}`);
});

test('semver.sync fans VERSION out to package.json and the README badges', () => {
  // Unit test on a throwaway tree: sync() must rewrite package.json + a README badge,
  // not just the two manifests. Would have caught the 0.9.0 package.json drift.
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gp-semver-'));
  try {
    fs.writeFileSync(path.join(tmp, 'VERSION'), '3.4.5\n');
    fs.writeFileSync(path.join(tmp, 'package.json'), `${JSON.stringify({ name: 'x', version: '0.0.1' }, null, 2)}\n`);
    fs.writeFileSync(path.join(tmp, 'README.md'), 'badge: version-0.0.1-green.svg here\n');
    fs.mkdirSync(path.join(tmp, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.claude-plugin', 'plugin.json'), `${JSON.stringify({ name: 'x', version: '0.0.1' }, null, 2)}\n`);
    const res = semver.sync(tmp);
    assert.strictEqual(res.version, '3.4.5');
    assert.ok(res.written.includes('package.json'), 'sync must rewrite package.json');
    assert.ok(res.written.includes('README.md'), 'sync must rewrite the README badge');
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(tmp, 'package.json'), 'utf8')).version, '3.4.5');
    assert.ok(fs.readFileSync(path.join(tmp, 'README.md'), 'utf8').includes('version-3.4.5-green.svg'));
    // checkSync agrees there is no drift after sync.
    assert.ok(semver.checkSync(tmp).ok, 'checkSync must be clean after sync');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('checkSync detects a phantom version drift (forgotten badge)', () => {
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gp-drift-'));
  try {
    fs.writeFileSync(path.join(tmp, 'VERSION'), '2.1.0\n');
    fs.writeFileSync(path.join(tmp, 'README.md'), 'stale badge: version-9.9.9-green.svg\n');
    const res = semver.checkSync(tmp);
    assert.ok(!res.ok, 'checkSync must report drift');
    assert.ok(res.drift.some(d => /README\.md/.test(d.file)), 'drift must name the README badge');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
