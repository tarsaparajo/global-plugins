# Changelog

All notable changes to this plugin are documented here.
Format: Keep a Changelog. Versioning: Semantic Versioning.

## [Unreleased]

## [0.4.2] - 2026-06-20

### Fixed

- OpenCode agent projection emitted Claude-native frontmatter (an array `tools`, a keyword `color`, a bare `model` alias) that OpenCode's schema rejects, failing install with `Configuration is invalid` on `.opencode/agents/*.md`. Agents are now rewritten into OpenCode's agent shape: `tools` as an object map, `mode: subagent`, a provider-prefixed `model`, and no `color`.
- Codex agent projection renamed `*.md` to `*.toml` but copied the markdown body verbatim, producing invalid TOML. Per-agent files are now emitted as real TOML (`name`/`description`/`tools` keys plus a multi-line `instructions` block); the `AGENTS.md` capability index and the `config.toml` baseline are unchanged.

### Added

- `engine/frontmatter.js`: a dependency-free YAML-subset frontmatter parser/serializer plus per-provider agent mappers (`toOpenCodeAgent`, `toCodexAgentToml`).
- A `transform-agent` projection operation and a `transformAgents` planning helper, so adapters rewrite agent frontmatter/format for their target instead of copying bytes verbatim. Generated child plugins inherit the fix automatically (they bundle the engine whole); the child `project.mjs` now fails loudly if a required engine module — including `frontmatter.js` — is missing from the bundled copy.
- Tests covering the frontmatter transforms and schema-validity assertions for the OpenCode and Codex agent outputs.

## [0.4.1] - 2026-06-20

### Fixed

- README Install section was unfollowable for Codex and opencode: the `cp`/build commands are relative to a cloned repo, but no `git clone` step was given. Added explicit `git clone` + `cd` steps for both, and clarified that Codex/opencode have no marketplace install (unlike Claude Code).
- opencode install pointed at `~/.opencode`, but opencode reads its global config from `~/.config/opencode/` (XDG) — the plugin would silently never load. Corrected the command (`mkdir -p ~/.config/opencode` + `cp -r .opencode/. ~/.config/opencode/`), the Provider Matrix (new "Repo folder" + "Installs to" columns), and the `opencode-home` adapter contract. Propagated across the English README and all 13 locales.

## [0.4.0] - 2026-06-20

### Added

- Opt-in **universal substrate** capability for generated child plugins: when a child has instruction files (`AGENTS.md`, at any level), `generate` can universalize the substrate across the three providers by emitting a sibling `CLAUDE.md` symlinked to each `AGENTS.md`. Codex and OpenCode read `AGENTS.md` natively; Claude Code reads `CLAUDE.md`; OpenCode resolves `CLAUDE.md` as a fallback — so one edit is shared by all three and work continues across providers.
- New engine `symlink` operation kind: the executor creates relative symlinks (ordered after their targets, snapshotted/rolled back as links), and `listRelativeFiles`/parity coverage are symlink-aware.
- The capability is hierarchical (one link per instruction file at every level), imposes nothing (only links instruction files the child already has, only when opted in), and surfaces the symlink portability trade-offs (Windows Developer Mode, `git core.symlinks`) before creating. Wired into `generate` and the `plugin-architect` amplify-gate.

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
