'use strict';

// CodeBuddy (project scope). Rules flattened; agents/skills/commands copied;
// an install script is emitted at the target root.

const path = require('path');
const { planFromModules, flattenDir, defaultCopy, opScaffold } = require('./_base');

function planOperations(planInput, adapter) {
  const targetRoot = adapter.resolveRoot(planInput);
  const ops = planFromModules(planInput, adapter, {
    rules: (ctx) => flattenDir(ctx, 'rules', 'rule', null),
    agents: defaultCopy,
    skills: defaultCopy,
    commands: defaultCopy,
    mcp: defaultCopy,
  });
  ops.push(opScaffold({
    moduleId: '__codebuddy__',
    sourceRelativePath: null,
    destinationPath: path.join(targetRoot, 'install.sh'),
    generator: 'install-script',
  }));
  return ops;
}

module.exports = { planOperations };
