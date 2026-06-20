'use strict';

// Aggregate test runner. Discovers every test_*.js under tests/ and runs them
// with the Node built-in test runner. Exits non-zero on any failure.

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TESTS_DIR = __dirname;

function findTests(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...findTests(abs));
    } else if (/^test_.*\.js$/.test(entry.name)) {
      out.push(abs);
    }
  }
  return out;
}

const files = findTests(TESTS_DIR).sort();
if (files.length === 0) {
  console.error('No tests found.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
  cwd: path.join(TESTS_DIR, '..'),
});

process.exit(result.status === null ? 1 : result.status);
