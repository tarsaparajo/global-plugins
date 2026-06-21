'use strict';

// Shared test fixture: builds a tiny canonical source in a temp dir so provider
// and projection tests can run against a known input without touching the repo.

const fs = require('fs');
const os = require('os');
const path = require('path');

// The slug the fixture's manifest declares; owner-identity assertions use it.
const FIXTURE_PLUGIN_NAME = 'fixture-plugin';

function makeCanonicalFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-test-'));
  const w = (rel, content) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };
  // The reviewer agent carries Claude-shaped frontmatter (a tools ARRAY, a NAMED
  // color) plus a STRAY `model: sonnet` so provider tests can assert each is
  // adapted correctly: tools kept for claude / rewritten to an object for
  // opencode / dropped for codex; color kept for claude / hex for opencode /
  // dropped for codex; and `model` DROPPED for EVERY target (never preset — a
  // CLI/runtime choice the user makes in the CLI). Canonical agents ship no
  // model:; this stray input proves the projector strips it everywhere.
  w('agents/reviewer.md', '---\nname: reviewer\ndescription: Review code for issues.\ntools: ["Read", "Grep", "Bash"]\nmodel: sonnet\ncolor: cyan\n---\n# Reviewer\n\nReview code.\n');
  // The builder skill's description deliberately contains a colon ("gate: …") —
  // the YAML mapping-value trap that made Codex skip skills. The projector must
  // emit it double-quoted so every projected SKILL.md is valid YAML.
  w('skills/builder/SKILL.md', '---\nname: builder\ndescription: Build things from a spec. Fast gate: schema-valid, round-trips.\n---\n# Builder\n\nBuild from spec.\n');
  w('commands/run.md', '---\ndescription: Run the thing.\n---\n# Run\n\nRun it.\n');
  w('rules/style.md', '# Style\n\nAlways test.\n');
  w('rules/README.md', '# Rules\n');
  w('mcp/servers.json', JSON.stringify({ mcpServers: { demo: { command: 'demo' } } }, null, 2));
  // A plugin manifest so pluginLabel() resolves a known slug — exercised by the
  // owner-identity projections (description prefix, OpenCode name prefix, Codex
  // index grouping). FIXTURE_PLUGIN_NAME is exported for assertions.
  w('.claude-plugin/plugin.json', JSON.stringify({ name: FIXTURE_PLUGIN_NAME }, null, 2));
  return root;
}

function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

// Standard single module covering the fixture dirs.
function fixtureModules() {
  return [{ id: 'm1', paths: ['agents', 'skills', 'commands', 'rules', 'mcp'], targets: [] }];
}

module.exports = { makeCanonicalFixture, cleanup, fixtureModules, FIXTURE_PLUGIN_NAME };
