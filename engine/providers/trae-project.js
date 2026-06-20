'use strict';

// Trae (project scope). Installed into the project's .trae/ via the same shape
// as the other script-installed editors: rules flattened, components copied, an
// install helper emitted.

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
    moduleId: '__trae__',
    sourceRelativePath: null,
    destinationPath: path.join(targetRoot, 'install.sh'),
    generator: 'install-script',
  }));
  return ops;
}

module.exports = { planOperations };
