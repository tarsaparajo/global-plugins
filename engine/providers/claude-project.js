'use strict';

// Claude (project scope). Identical transform shape to claude-home but rooted
// at the consuming project's .claude/ instead of the user home.

const claudeHome = require('./claude-home');

module.exports = { planOperations: claudeHome.planOperations };
