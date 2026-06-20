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
