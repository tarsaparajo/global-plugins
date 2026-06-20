# Changelog

All notable changes to this plugin are documented here.
Format: Keep a Changelog. Versioning: Semantic Versioning.

## [Unreleased]

## [0.1.2] - 2026-06-20

### Fixed

- Single-file and consolidating providers (gemini, qwen, codex, vscode/Copilot) were projecting empty instruction files — only a duplicated Prompt Defense Baseline and an empty `<!-- section -->` marker — so none of the agents, skills, or commands reached them.
- The consolidating generators now read the canonical source and emit a real Capability Index naming every agent, skill, and command; the bodies are materialized as sibling files (`.qwen/`, `.gemini/`, `.codex/`) or inlined under headings (Copilot), with the Prompt Defense Baseline kept exactly once.
- codex now projects skills and commands (previously dropped) alongside its agent TOML files.

### Changed

- Provider tests now assert real consolidated content (capability index, single baseline, materialized bodies, no empty markers) instead of mere file existence, locking the no-empty-projection contract.

## [0.1.1] - 2026-06-20

### Changed

- Install section rewritten with per-provider, one-by-one steps: Claude Code first (`/plugin` marketplace + install), then each other provider with its real copy command and auto-detection note.
- Usage table now surfaces the self-hosted `/global-plugins:evolve` and `/global-plugins:migrate` commands.
- Added the `/plugin marketplace add` + `/plugin install` snippet for Claude Code.
- All Install, Usage, and badge updates propagated across the English README and all thirteen locales.

## [0.1.0] - 2026-06-20

### Added

- Canonical-source projection engine with fourteen provider adapters (claude, claude-project, codex, opencode, cursor, kiro, gemini, qwen, zed, codebuddy, joycode, antigravity, trae, vscode).
- Three-tier manifest layering: profiles, modules, components.
- Engine agents: plugin-architect (with the compositional harness lens), provider-detector, capability-extractor, canonical-projector, compliance-validator, plus the injected evolution-propagator and migration-analyzer.
- Surface skills: generate, adapt, audit, validate, harness-lens, plus the injected evolve and migrate.
- Mirrored self-evolution and conditional migration engine injected into every generated plugin.
- Self-hosting: global-plugins projects itself to all fourteen providers (committed dotfolders) and ships its own evolve/migrate surface, kept in parity across every target.
- Governance: SemVer sync, Keep-a-Changelog, Prompt Defense Baseline, self-sufficiency guard, parity validation.
- GitHub Actions CI: a test matrix across Ubuntu, Windows, and macOS on Node 18/20/22, plus a compliance and version-sync gate.
- Rich marketplace manifest template with an interface block for marketplace distribution of generated plugins.
- README localization across fourteen languages, with fully translated documents for every non-English locale.
