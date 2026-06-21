# Changelog

All notable changes to this plugin are documented here.
Format: Keep a Changelog. Versioning: Semantic Versioning.

## [Unreleased]

## [0.8.1] - 2026-06-21

### Fixed

- **Codex install command nested the dotfolder instead of merging it.** The README told Codex users to run `cp -r .codex ~/.codex`, but when `~/.codex` already exists (it always does after running Codex once) `cp -r SRC DEST` copies SRC *inside* DEST — creating `~/.codex/.codex/config.toml`, `~/.codex/.codex/skills/`, etc. — so Codex never found its config and the install silently failed. Corrected to `mkdir -p ~/.codex && cp -R .codex/. ~/.codex/` (the trailing `/.` merges contents into the existing home dotfolder), matching the OpenCode pattern fixed in 0.4.1. Applied across `README.md` and all 13 localized READMEs; also aligned the OpenCode block's `cp -r` → `cp -R` for consistency, and corrected stale prose in the Codex section (`agents/*.toml` roles → the `[agents.<name>]` tables in `config.toml`, which is how Codex actually carries agents).

### Added

- **Generated child plugins now ship a correct Installation section.** `templates/governance/README.md.tmpl` gains an `## Installation` section (new `{{plugin.install}}` slot), and `skills/generate/SKILL.md` step 7 composes it from the child's resolved provider targets only — Claude Code marketplace, and for Codex/OpenCode the safe `mkdir -p <home> && cp -R <dotfolder>/. <home>/` merge form (never the nesting `cp -r`). Previously the child README template had no install instructions at all. `adapters/providers/codex-home.md` now documents the install command, mirroring the OpenCode contract.

## [0.8.0] - 2026-06-21

### Fixed

- **OpenCode agent colors are back — the real bug was an unquoted hex, not the color.** The engine rewrites a named Claude color → hex for OpenCode, but it emitted the hex **bare** (`color: #06B6D4`). In YAML a `#` after `: ` starts a comment, so the value parsed empty and OpenCode rejected the agent — which is why colors had previously seemed to need dropping. `engine/frontmatter.js` `needsYamlQuoting` now quotes any `#`-leading scalar, so OpenCode colors emit as **`color: "#06B6D4"`** (valid). Theme tokens (no `#`) stay unquoted; Claude keeps named colors; Codex still drops per-agent color. Committed `.opencode` agents regenerated accordingly; the projection-drift guard and `engine/compliance.js` now require a hex `color` to be quoted.

### Added

- **Owner-identity for OpenCode/Codex capabilities** — neither CLI namespaces like Claude's `/plugin:cmd` (Codex issue #22626 is an open collision report), and both show the frontmatter `description` in the `/` palette, so the owning plugin is now made visible by three self-standardized conventions, all derived deterministically from the plugin slug (`.claude-plugin/plugin.json` → fallback `package.json` `name`) at projection time and inherited by generated children:
  - **`[plugin-name] ` description prefix** on every projected skill/command/agent for OpenCode **and** Codex (SKILL.md/command frontmatter, the Codex `[agents.<name>]` table descriptions, and the `AGENTS.md` index). Claude is left unprefixed (it already namespaces). Idempotent; stripped on `adapt` (reverse).
  - **OpenCode filename/name owner-prefix** — the invocable NAME carries the owner: command/agent files become `<plugin>-<name>.md` (`/<plugin>-adapt`), and a skill's directory AND its `name:` frontmatter become `<plugin>-<name>`. `_knowledge` reference docs are NOT prefixed. **This changes OpenCode invocation strings** (`/adapt` → `/global-plugins-adapt`).
  - **Codex `AGENTS.md` owner-grouping** — the capability index is grouped under a `### <plugin>` heading (per-type sections demote to `####`).
- New engine helpers `pluginLabel`/`prefixDescription`/`prefixName`/`stripOwnershipPrefix` (`engine/helpers.js`), a YAML-scalar decoder so a prefixed-then-requoted description never nests escapes (`engine/frontmatter.js` `decodeYamlScalar`; `engine/providers/_base.js` `readFrontmatter` now unescapes too), and `ownerPrefixedCopy` (`engine/providers/_base.js`) wired into the OpenCode adapter. Doctrine updated across `provider-matrix.md`, `opencode-harness.md`, `codex-harness.md`, the two provider contracts, and the child-generation agents; reverse-strip rules added to `capability-extractor`. Tests: 59/59 (added color-quoting, `[plugin]`-prefix idempotency, owner-rename, and Codex-grouping coverage); `npm run validate` → `{ ok: true }`; strict PyYAML/tomllib validate all projected frontmatter + `config.toml`.

## [0.7.1] - 2026-06-20

### Fixed

- **Codex `prompt_defense_baseline` leaked into the `[desktop]` table instead of resolving at root.** The `codex:config-toml` generator (`engine/builder.js`) emitted the baseline as a **bare root key** (`prompt_defense_baseline = """…"""`). A bare root key is position-dependent in TOML: when the generated `config.toml` is appended/merged into an existing `~/.codex/config.toml` that already ends in tables (e.g. `[desktop]`), the trailing key falls under the last table and Codex reads it as `desktop.prompt_defense_baseline`. It is now emitted under a **dedicated `[prompt_defense]` table** (`baseline = "…"`, a single escaped basic string via `tomlString()`) — a table header re-scopes everything after it, so the baseline resolves at `prompt_defense.baseline` regardless of merge position. This also drops the brittle `"""…"""` triple-quote form (which would terminate early if the baseline ever contained `"""`). Verified by appending the generated config after a real `[desktop]` block and parsing with `tomllib`: baseline at root, no `[desktop]` leak, all 7 agent tables intact.
- **Codex skipped skills: invalid YAML in `SKILL.md` frontmatter (`mapping values are not allowed in this context`).** `engine/frontmatter.js` `serialize()` wrote `description: <raw>` **unquoted**, but a description containing `: ` (e.g. `validate`: *"Fast pass/fail gate: schema-valid manifests…"*) is parsed by a YAML reader as a nested mapping, so Codex skipped the skill (`⚠ Skipped loading 1 skill(s) due to invalid SKILL.md files`). `serialize()` now double-quotes any scalar a YAML reader would misparse (the `: ` mapping trap and surrounding whitespace), escaping inner `\` and `"`. The quoter is deliberately narrow so the established bare forms stay byte-stable: hex colors (`#RRGGBB`), theme tokens, names, and inline tools arrays/objects are untouched. The single offending canonical description (`skills/validate/SKILL.md`) is also quoted at the source so the value is valid YAML for **every** provider (Claude/Codex/OpenCode), not just where the adapter rewrites. Strict-YAML validation (PyYAML) of all 56 projected frontmatter blocks now passes; previously the lone `validate` skill failed at line 3, col 223.
- **Both fixes propagate to generated child plugins automatically** — they live in `engine/builder.js` + `engine/frontmatter.js`, and children ship a copy of `engine/` and re-project through it. Codex doctrine/contract docs updated to describe the `[prompt_defense]` table (`adapters/providers/codex-home.md`, `skills/_knowledge/codex-harness.md`, `skills/_knowledge/governance.md`). All committed `.claude`/`.codex`/`.opencode` projections regenerated via `node scripts/evolve/project.mjs --apply`; the projection-drift guard confirms committed output is byte-identical to a fresh projection. Tests: 54/54 (incl. new colon-quoting round-trip + `[prompt_defense]`-table assertions); `npm run validate` → `{ ok: true }`.

## [0.7.0] - 2026-06-20

### Fixed

- **Committed provider projections were stale and broke OpenCode install.** The engine has dropped `model:` and rewritten a named Claude color → hex for OpenCode since 0.5.1/0.6.0, but the committed `.claude`/`.opencode`/`.codex` files were never regenerated — they still carried a preset `model:` and an invalid named `color:` (e.g. `color: cyan`), so OpenCode rejected every agent on install (`Expected a string matching /^#[0-9a-fA-F]{6}$/ … got "cyan"`). The stale `_knowledge` doctrine projections (`provider-matrix.md`, `opencode-harness.md`, `claude-code-harness.md`) still described the OLD model=keep / color=keep rules. All committed projections were regenerated via `node scripts/evolve/project.mjs --apply`: OpenCode agents now carry hex colors (e.g. `#06B6D4`) and no `model:`; Claude agents keep their named color and carry no `model:`.
- **The projector copied claude-only infrastructure into every provider dotfolder.** `engine/providers/_base.js` `planFromModules` verbatim-copied any canonical dir with no explicit provider handler, so `engine/`, `adapters/`, `manifests/`, `config/`, `templates/`, and `docs/` were projected into `.claude`/`.opencode`/`.codex`, bloating each install with the engine source. It now projects ONLY dirs a provider explicitly handles (`agents`/`skills`/`commands`/`rules`/`mcp`/`hooks`); an unhandled dir is skipped, not copied. Additionally, `engine/registry.js` `planScaffold` now honors each module's `targets[]` compatibility registry (`manifests/modules.json`) so a provider-restricted module never projects to a provider it does not target. The three dotfolders are back to their intended surface (`agents`/`skills`/`commands`, plus OpenCode's compiled `dist/`).

### Added

- **Projection-drift guard so committed output can never silently diverge again.** New `tests/test_projection_drift.js` re-projects the real canonical source into a temp root and asserts every committed `.claude`/`.opencode`/`.codex` file is BYTE-IDENTICAL to a fresh projection (catching ANY field drift), with targeted checks for the two symptoms that bit users (no stale `model:`, no invalid OpenCode `color:`) and a check that no infrastructure dir leaks into a dotfolder — each failing with `run: node scripts/evolve/project.mjs --apply`. `engine/compliance.js` `audit()` gains a `projection-drift` finding (stale `model:` / invalid OpenCode color) so `npm run validate`, the `/audit` skill, and CI all catch it. Root cause of the recurrence: `engine/parity.js` only re-runs the planner in memory and `audit()` never inspected the committed bytes, so prior fixes touched the engine but the broken committed files kept shipping uncaught.

## [0.6.0] - 2026-06-20

### Changed

- **Agents no longer carry a preset `model:` — on any provider.** Model is a CLI/runtime choice the user makes; the plugin never bakes one into an agent. `engine/frontmatter.js` now **drops** `model` for **every** target (claude, opencode, codex) instead of keeping it (claude) / rewriting it to `provider/model` (opencode). The claude projection is now also run through the frontmatter adapter (`engine/providers/_base.js` `frontmatterTargetFor` no longer skips claude) solely so a stray authored `model:` is stripped there too; with no `model:` present the claude output stays byte-identical. The `model` line was removed from all 7 canonical agents (`agents/*.md`) and both child templates (`templates/child/agents/*.md`).
- **Child plugins generated by this plugin also omit `model`.** `plugin-architect` and `canonical-projector` now instruct that generated/projected agents MUST NOT include a `model:` field.
- `CLAUDE_TO_OPENCODE_MODEL` is retained and still exported for back-compat but is no longer consulted internally (the adapter drops `model` rather than mapping it).
- Updated doctrine to match: `skills/_knowledge/provider-matrix.md` (model row → drop/drop/drop + determinism boundary + reverse-transform), `skills/_knowledge/opencode-harness.md`, `skills/_knowledge/claude-code-harness.md`, `adapters/providers/opencode-home.md`, and the engine comments in `builder.js`/`executor.js`.
- Tests updated/added (`tests/test_frontmatter.js`, `tests/_fixture.js`, `tests/providers/test_all_providers.js`): every projection now asserts the **absence** of `model:`; fixtures retain a stray `model:` input to prove the drop is active on all three providers. 44/44 pass.

## [0.5.1] - 2026-06-20

### Fixed

- **OpenCode projection emitted an invalid `color` field, breaking install.** OpenCode's `color` schema accepts ONLY a hex `#RRGGBB` or one of 7 theme tokens (`primary`/`secondary`/`accent`/`success`/`warning`/`error`/`info`); a bare Claude color name (`cyan`, `red`, `green`, `magenta`, `orange`, `yellow`, …) is in neither set. The engine had been keeping the named color verbatim (0.5.0 documented it as "`color` kept"), so every projected OpenCode agent failed validation, e.g. `Configuration is invalid at .../agents/provider-detector.md — Expected a string matching the RegExp /^#[0-9a-fA-F]{6}$/, got "cyan"`. `engine/frontmatter.js` now **rewrites** a named Claude color to its hex `#RRGGBB` (via the `CLAUDE_TO_OPENCODE_COLOR` table); an already-hex value or a valid theme token is kept; an unrecognized name is dropped rather than emitted invalid. Verified against the official OpenCode docs (June 2026: agent `color` = hex or theme token).
- Corrected the matching doctrine that encoded the wrong "named tokens kept as-is" assumption: `skills/_knowledge/provider-matrix.md` (color row + determinism boundary), `skills/_knowledge/opencode-harness.md`, and the `adapters/providers/opencode-home.md` contract.

## [0.5.0] - 2026-06-20

### Added

- **Frontmatter adaptation** — projecting a canonical (Claude-shaped) agent/skill/command to a non-Claude provider now ADAPTS its frontmatter to that provider's real schema instead of copying it verbatim. New engine module `engine/frontmatter.js` applies the deterministic verbs — **keep / rewrite / drop** — per the cross-referenced field matrix; the agentic **re-express** verb (e.g. a named color → a Codex `interface.brand_color` hex) is owned by the `canonical-projector`. Wired into the executor via a `frontmatterTarget` op tag set in `engine/providers/_base.js` for the `agents`/`skills`/`commands` dirs. Claude projection is unchanged (canonical IS the Claude shape).
  - **OpenCode:** agent `tools` array → object (`{ read: true, … }`), `model` alias → `provider/model` (e.g. `anthropic/claude-sonnet-4-5`; `inherit` → dropped), `color` kept, `argument-hint` dropped.
  - **Codex:** `color` / `tools` / `model` / `argument-hint` dropped (no Codex frontmatter slot); a skill's `SKILL.md` frontmatter is reduced to `name` + `description`.
- New doctrine section **"Frontmatter field adaptation"** in `skills/_knowledge/provider-matrix.md` (the per-field matrix + verbs + determinism boundary + casing landmines), consulted by `canonical-projector`, `capability-extractor`, and `plugin-architect` so generated CHILD plugins adapt frontmatter correctly too.

### Fixed

- **Codex projection emitted invalid frontmatter.** Agents were flattened to `.codex/agents/<name>.toml` by a rename-only transform, so each file was Claude YAML+markdown (a `tools` array, a `model` alias, a `color` field) renamed `.toml` — none of which exist in real Codex. Agents are now re-expressed as native `[agents.<name>]` tables in `config.toml` (carrying Codex's real `description` field) and named in the `AGENTS.md` index; no per-agent `.toml` file is emitted. Verified against the official Codex docs (June 2026): `SKILL.md` frontmatter is `name` + `description` only; per-agent `color`/`tools`/`model` have no Codex frontmatter slot.
- Corrected the Codex/OpenCode knowledge + adapter docs and the `capability-extractor` reverse-transform, which had described Codex agents as standalone `.toml` files with `tools`/`model` frontmatter (wrong model).

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
