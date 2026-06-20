# Agents

This plugin projects its agents as native Codex role files under
`.codex/agents/*.toml`. Its skills and commands are installed as sibling
files under `.codex/`; the index below names each capability.

## Capability Index

### Agents

- **canonical-projector** — Project the canonical source onto every resolved provider's native dotfolder using the engine's planOperations per adapter. The only agent permitted to write plugin files. Enforces foreign-path guards and the Prompt Defense Baseline on every emitted markdown. — `.codex/agents/`
- **capability-extractor** — Lift a single-provider plugin (or a briefing's described features) into provider-neutral canonical capabilities — agents, skills, commands, hooks, rules, MCP — stripped of provider-specific shape. Engine for adapt. — `.codex/agents/`
- **compliance-validator** — Validate that a generated or adapted plugin is internally consistent — adapter coverage matches manifests, every projection round-trips, docs, version, and changelog are in sync, and the Prompt Defense Baseline is present everywhere. Engine for audit and validate. — `.codex/agents/`
- **evolution-propagator** — Re-project a canonical DELTA across all of this plugin's provider projections. Source of truth is the canonical source; computes the minimal change set, validates multi-provider parity, bumps SemVer, writes the CHANGELOG, and appends to EVOLUTION.md. Automatic with a single human-gate before writing. — `.codex/agents/`
- **migration-analyzer** — When an evolution delta is breaking for already-materialized products, projects, or substrates, generate a versioned migration with dry-run, rollback, and its own human-gate. Writes migrations/<version>.md. — `.codex/agents/`
- **plugin-architect** — Turn a natural-language briefing into a concrete multi-provider plugin architecture. Composes the 9-dimension Harness Lens as an internal tool to decide which skills, agents, hooks, commands, and MCP a plugin needs. Use for generate and the harness-lens explorer. — `.codex/agents/`
- **provider-detector** — Detect which providers a request targets and resolve them against the adapter registry and 3-tier manifests. For adapt, fingerprint an existing single-provider plugin's dotfolders to identify its source provider. — `.codex/agents/`

### Skills

- **adapt** — This skill should be used when the user wants to "adapt a plugin", "make my plugin work everywhere", "convert a single-provider plugin to multi-provider", "port my Claude Code/Codex/OpenCode plugin to the other providers", or points at a plugin built for one tool. Fingerprints the source, lifts it to canonical, and projects it to all three CLI providers (or a selected subset) while preserving 100% of the original functionality. — `.codex/skills/`
- **audit** — This skill should be used when the user wants to "audit a plugin", "review a plugin's structure", "check multi-provider coverage", "do a deep plugin audit", or assess a plugin's governance and parity. Read-only; produces a severity-ranked report of adapter coverage, multi-provider parity, governance, prompt-defense presence, least-privilege, and self-sufficiency. — `.codex/skills/`
- **evolve** — This skill should be used when the user wants to "evolve this plugin", "update the plugin everywhere", "propagate a change to all providers", "mirror my change", or has edited the canonical source and wants it reflected across providers. Edits flow from the canonical source; the delta is re-projected to every provider with parity validation, SemVer bump, CHANGELOG and EVOLUTION ledger, and a conditional breaking-change migration. One human-gate before writing. — `.codex/skills/`
- **generate** — This skill should be used when the user wants to "create a plugin", "generate a plugin", "build a plugin from a briefing", "make a multi-provider plugin", or describes a plugin they want built from a natural-language description. Generates a complete multi-provider plugin from a single canonical source and projects it to every selected provider, with self-evolution injected. — `.codex/skills/`
- **harness-lens** — This skill should be used when the user wants to "explore the harness lens", "design a plugin's harness", "see what a plugin needs", "model my plugin idea", or wants help shaping a plugin before generating it. Opt-in walk through the 9-dimension compositional lens (Identity, Context, Memory, Skills, Protocols, Communication, Permission, Control, Observability) remapped to plugin vocabulary; can hand off to generate. — `.codex/skills/`
- **migrate** — This skill should be used when the user wants to "migrate this plugin", "apply pending migrations", "upgrade installed projections", or bring an already-installed copy of this plugin forward across breaking versions. Computes the pending migration chain from the installed version to HEAD and applies it with dry-run, verify, and rollback. — `.codex/skills/`
- **validate** — This skill should be used when the user wants to "validate a plugin", "check a plugin before shipping", "run the plugin validation gate", or verify a generated plugin is structurally sound. Fast pass/fail gate: schema-valid manifests, every projection round-trips, VERSION synced, CHANGELOG well-formed, prompt-defense present. — `.codex/skills/`

### Commands

- **adapt** — Adapt an existing single-provider plugin into a global multi-provider plugin, preserving 100% of its functionality. — `.codex/commands/`
- **audit** — Deep, read-only audit of a plugin — adapter coverage, multi-provider parity, governance, prompt-defense, least-privilege, and self-sufficiency. — `.codex/commands/`
- **evolve** — Evolve this plugin — mirror a canonical change to every provider with parity validation, SemVer bump, CHANGELOG, ledger, and a conditional breaking-change migration. One human-gate before writing. — `.codex/commands/`
- **generate** — Generate a complete multi-provider plugin from a natural-language briefing, projected to every selected provider with self-evolution built in. — `.codex/commands/`
- **harness-lens** — Opt-in exploration of the 9-dimension compositional harness lens for a plugin idea; can hand off to generate. — `.codex/commands/`
- **migrate** — Apply the pending migration chain to an already-installed copy of this plugin, with dry-run, verify, and rollback per migration. — `.codex/commands/`
- **validate** — Fast pass/fail validation gate for a plugin before shipping — manifests, projection round-trips, version sync, changelog, prompt-defense. — `.codex/commands/`
