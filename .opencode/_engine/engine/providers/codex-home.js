'use strict';

// Codex (home scope). Codex's REAL native model (verified against
// developers.openai.com/codex, June 2026) is NOT "one .toml per agent renamed
// from markdown". Custom agents are `[agents.<name>]` tables in config.toml
// (config_file / description / nickname_candidates); skills are
// `skills/<name>/SKILL.md` whose frontmatter is `name` + `description` ONLY;
// instructions live in AGENTS.md. There is no per-agent markdown body, no
// per-agent `color`/`tools`/`model` frontmatter, and no agents/<name>.toml file.
//
// So we re-express canonical agents NATIVELY: each becomes an `[agents.<name>]`
// entry folded into config.toml by the codex:config-toml generator, and is named
// in the AGENTS.md capability index. We do NOT flatten agents into .toml files.
// Skills and commands keep their real bodies as sibling files; their SKILL.md
// frontmatter is reduced to name+description by the frontmatter adapter (the
// executor applies it via the frontmatterTarget tag set in _base.defaultCopy).
// The Prompt Defense Baseline rides in config.toml as a TOML string field.

const path = require('path');
const { planFromModules, defaultCopy, opScaffold, payloadCopy } = require('./_base');

function planOperations(planInput, adapter) {
  const targetRoot = adapter.resolveRoot(planInput);
  const ops = planFromModules(planInput, adapter, {
    // Agents are NOT emitted as files — they are re-expressed as [agents.<name>]
    // tables in config.toml and indexed from AGENTS.md (see the generators).
    agents: () => [],
    skills: defaultCopy,
    commands: defaultCopy,
    rules: () => [],
    hooks: () => [],
    mcp: () => [],
  });

  ops.push(opScaffold({
    moduleId: '__codex__',
    sourceRelativePath: 'AGENTS.md',
    destinationPath: path.join(targetRoot, 'AGENTS.md'),
    generator: 'codex:agents-md',
  }));
  ops.push(opScaffold({
    moduleId: '__codex__',
    sourceRelativePath: null,
    destinationPath: path.join(targetRoot, 'config.toml'),
    generator: 'codex:config-toml',
    carriesPromptDefense: true,
  }));

  // Runtime payload: ship the projection engine into .codex/_engine/ so a Codex
  // install can itself generate/adapt/evolve child plugins by running
  // `cd ~/.codex/_engine && node scripts/evolve/project.mjs` (Codex runs node with
  // approval_policy="on-request" + sandbox_mode="workspace-write"). Separate from
  // the capability surface above; never scanned as agents/skills/commands.
  ops.push(...payloadCopy(planInput, adapter));

  return ops;
}

module.exports = { planOperations };
