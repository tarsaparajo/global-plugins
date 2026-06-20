'use strict';

// Shared test fixture: builds a tiny canonical source in a temp dir so provider
// and projection tests can run against a known input without touching the repo.

const fs = require('fs');
const os = require('os');
const path = require('path');

function makeCanonicalFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-test-'));
  const w = (rel, content) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };
  w('agents/reviewer.md', '---\nname: reviewer\ndescription: Review code for issues.\n---\n# Reviewer\n\nReview code.\n');
  w('skills/builder/SKILL.md', '---\nname: builder\ndescription: Build things from a spec.\n---\n# Builder\n\nBuild from spec.\n');
  w('commands/run.md', '---\ndescription: Run the thing.\n---\n# Run\n\nRun it.\n');
  w('rules/style.md', '# Style\n\nAlways test.\n');
  w('rules/README.md', '# Rules\n');
  w('mcp/servers.json', JSON.stringify({ mcpServers: { demo: { command: 'demo' } } }, null, 2));
  return root;
}

function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

// Standard single module covering the fixture dirs.
function fixtureModules() {
  return [{ id: 'm1', paths: ['agents', 'skills', 'commands', 'rules', 'mcp'], targets: [] }];
}

module.exports = { makeCanonicalFixture, cleanup, fixtureModules };
