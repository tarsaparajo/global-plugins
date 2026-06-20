# Changelog

All notable changes to this plugin are documented here.
Format: Keep a Changelog. Versioning: Semantic Versioning.

## [Unreleased]

## [0.3.0] - 2026-06-20

### Added

- Opt-in **rules layer** capability for generated child plugins: when a briefing asks for coding conventions/standards, `generate` authors a canonical `rules/*.md` layer. It reaches each provider faithfully — Claude Code copies the rules into `.claude/rules/` and ships `scripts/install-rules.mjs` + a README note (because `/plugin install` does not distribute rules), while Codex and OpenCode carry the rule content folded into `AGENTS.md`.
- Child templates for the capability: `templates/child/rules/`, `templates/child/scripts/install-rules.mjs` (list/dry-run/apply, project or `--user` scope), and `templates/child/commands/install-rules.md`.
- The `codex:agents-md` generator now folds a canonical `rules/` layer into `AGENTS.md` under a "Conventions / Rules" section.

### Fixed

- `detect-substrates.mjs` (script and child template) now scan only the three CLI dotfolders, removing the 11-provider residue.

## [0.2.0] - 2026-06-20

### Changed

- **Scope reduced to three CLI providers** — Claude Code, Codex, and OpenCode — for the plugin itself and every child plugin it generates. These three were kept for their superior harness capability and high-functionality compatibility.

### Removed

- The eleven IDE/single-file providers (cursor, gemini, qwen, zed, kiro, codebuddy, joycode, antigravity, trae, vscode/Copilot) and the `claude-project` adapter, along with their engine modules, adapter contracts, registry/manifest entries, and committed dotfolders. `.github/workflows/ci.yml` is retained (repo CI/CD, not a provider projection).
- Dead single-file/flatten generators and removed-provider path-owners from the engine.

### Added

- Per-provider harness knowledge base: `skills/_knowledge/{claude-code,codex,opencode}-harness.md`, each citing the provider's official repo as the first source of truth, documenting each plugin API and the in-process (OpenCode) vs out-of-process (Claude Code, Codex) coupling distinction.
- Opt-in provider enrichment in `generate`: deepen a child plugin's per-provider version using the documented harness surfaces (e.g. OpenCode's typed in-process hooks, custom tools, and compaction control).

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
