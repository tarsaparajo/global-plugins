'use strict';

// VS Code (project scope). VS Code itself has no native agent format; it
// integrates through GitHub Copilot. All instruction context is consolidated
// into .github/copilot-instructions.md, and a .vscode/settings.json is emitted
// pointing Copilot's code/test/commit generation at that file.

const path = require('path');
const { planFromModules, opScaffold } = require('./_base');

function consolidate(ctx) {
  return [opScaffold({
    moduleId: ctx.module.id,
    sourceRelativePath: ctx.sourceRelativePath,
    destinationPath: path.join(ctx.targetRoot, 'copilot-instructions.md'),
    generator: 'vscode:copilot-instructions',
    section: String(ctx.sourceRelativePath).split('/')[0],
    carriesPromptDefense: true,
    append: true,
  })];
}

function planOperations(planInput, adapter) {
  const targetRoot = adapter.resolveRoot(planInput); // .github
  // The project root is the parent of .github; .vscode is a sibling of .github.
  const projectRoot = path.dirname(targetRoot);
  const ops = planFromModules(planInput, adapter, {
    rules: consolidate,
    agents: consolidate,
    skills: consolidate,
    commands: consolidate,
    hooks: () => [],
    mcp: () => [],
  });
  // Emit the VS Code settings that wire Copilot to the instructions file.
  ops.push(opScaffold({
    moduleId: '__vscode__',
    sourceRelativePath: null,
    destinationPath: path.join(projectRoot, '.vscode', 'settings.json'),
    generator: 'vscode:settings',
  }));
  return ops;
}

module.exports = { planOperations };
