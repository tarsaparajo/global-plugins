'use strict';

// Frontmatter adaptation. "Adaptar não é copiar" — a canonical agent/skill/command
// carries Claude-shaped YAML frontmatter, but each provider's real schema is
// different. When the engine projects a model-facing .md into a non-Claude
// provider it must adapt the frontmatter, not copy it verbatim. The deterministic
// verbs live here:
//
//   keep    — the field exists with the same shape on the target (no change).
//   rewrite — the field exists but its SHAPE differs; transform the value
//             (e.g. Claude tools array -> OpenCode tools object; model alias ->
//             provider/model).
//   drop    — the field has NO frontmatter slot on the target; remove it (it is
//             either re-expressed in a native non-frontmatter structure by the
//             agentic projector, or simply not representable).
//
// A fourth verb — re-express (color -> openai.yaml interface.brand_color, tools ->
// dependencies.tools) — is NOT mechanical: it requires placing data in a separate
// native structure and is handled by the agentic layer (canonical-projector),
// guided by skills/_knowledge/provider-matrix.md. This module never invents those
// structures; it only keeps/rewrites/drops within the .md frontmatter so the
// emitted file validates against the target's real frontmatter schema.
//
// Field matrix (cross-referenced against official docs, June 2026):
//
//   field          claude                opencode                     codex
//   name           keep                  keep                         keep
//   description    keep                  keep                         keep
//   tools (array)  keep                  rewrite -> {name:true} object DROP (native: openai.yaml dependencies.tools)
//   model          DROP                  DROP                          DROP (CLI/runtime choice; never preset)
//   color (named)  keep (named enum)     rewrite -> hex #RRGGBB         DROP (native: openai.yaml interface.brand_color)
//   argument-hint  keep                  DROP (commands use template)  DROP (SKILL.md = name+description only)
//   (unknown)      keep                  keep                          DROP unless name/description

// Claude named color -> OpenCode hex "#RRGGBB". OpenCode's `color` schema
// accepts ONLY a hex "#RRGGBB" or one of 7 theme tokens (primary, secondary,
// accent, success, warning, error, info) — Claude's named colors are in NEITHER
// set, so passing them through verbatim makes OpenCode reject the agent file
// ("Expected a string matching /^#[0-9a-fA-F]{6}$/ ... got 'cyan'"). We map each
// Claude name to its hex equivalent so the projected file validates AND keeps the
// agent's actual visual color (the 7 theme tokens carry no stable hue). Values
// that are already hex or already a valid OpenCode token pass through unchanged.
const CLAUDE_TO_OPENCODE_COLOR = Object.freeze({
  red: '#EF4444',
  orange: '#F97316',
  yellow: '#EAB308',
  green: '#22C55E',
  blue: '#3B82F6',
  cyan: '#06B6D4',
  purple: '#A855F7',
  magenta: '#D946EF',
  pink: '#EC4899',
});

// OpenCode's fixed theme-token enum. A canonical color already set to one of
// these is a deliberate, valid OpenCode value — keep it.
const OPENCODE_THEME_TOKENS = Object.freeze([
  'primary', 'secondary', 'accent', 'success', 'warning', 'error', 'info',
]);

// Claude model alias -> OpenCode "provider/model". RETAINED for back-compat and
// external callers ONLY: the adapter no longer rewrites `model` — it DROPS it for
// every target (model is a CLI/runtime choice the user makes, never preset in a
// projection). This map is no longer consulted internally; kept so any external
// importer keeps working and to document the historical alias→id mapping.
const CLAUDE_TO_OPENCODE_MODEL = Object.freeze({
  opus: 'anthropic/claude-opus-4-5',
  sonnet: 'anthropic/claude-sonnet-4-5',
  haiku: 'anthropic/claude-haiku-4-5',
  inherit: null, // OpenCode inherits the global model when omitted.
});

// Parse a leading YAML frontmatter block into an ordered list of { key, raw }
// entries plus the trailing body. We keep the RAW value text per key so a "keep"
// is byte-stable and we never depend on a YAML library. Only the small, flat
// frontmatter shapes this plugin emits are handled (scalars + inline arrays).
function parse(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { hasFrontmatter: false, entries: [], body: content };
  }
  const block = match[1];
  const body = content.slice(match[0].length);
  const entries = [];
  for (const line of block.split('\n')) {
    const kv = /^([A-Za-z0-9_-]+):\s?(.*)$/.exec(line);
    if (!kv) {
      // Continuation / nested line — attach to the previous entry raw so we do
      // not silently drop multi-line values.
      if (entries.length) {
        entries[entries.length - 1].raw += `\n${line}`;
      }
      continue;
    }
    entries.push({ key: kv[1], raw: kv[2] });
  }
  return { hasFrontmatter: true, entries, body };
}

// Decode an inline YAML array ("[\"a\", \"b\"]" or "[a, b]") into string[].
// Returns null if the raw value is not an inline array.
function decodeInlineArray(raw) {
  const trimmed = raw.trim();
  if (!(trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return null;
  }
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) {
    return [];
  }
  return inner.split(',').map(part => part.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
}

// Strip surrounding quotes from a scalar raw value.
function decodeScalar(raw) {
  return raw.trim().replace(/^["']|["']$/g, '');
}

// True when a raw value is already a structured form the rest of the engine
// produces and round-trips on its own — an inline array ([ … ] / { … }, used by
// the opencode tools rewrite) or an already-quoted scalar. These must NOT be
// re-quoted (it would corrupt them / break byte-stability).
function isAlreadyStructured(raw) {
  const t = raw.trim();
  if (decodeInlineArray(raw) !== null) {
    return true; // [a, b] inline array.
  }
  if (t.startsWith('{') && t.endsWith('}')) {
    return true; // { k: v } inline table (opencode tools object).
  }
  if ((t.startsWith('"') && t.endsWith('"') && t.length >= 2)
    || (t.startsWith("'") && t.endsWith("'") && t.length >= 2)) {
    return true; // already a quoted scalar.
  }
  return false;
}

// True when a plain (unquoted) scalar would be MISPARSED by a YAML reader and so
// must be emitted double-quoted. The bug this guards: a description like
// "Fast pass/fail gate: schema-valid manifests" has a `: ` that YAML reads as a
// nested mapping ("mapping values are not allowed in this context"), and Codex
// then SKIPS the skill. Kept deliberately NARROW — the `: ` mapping trap and
// surrounding whitespace are the only cases this engine actually emits — so the
// established bare forms this plugin relies on stay byte-stable: hex colors
// (`#RRGGBB`), theme tokens, names, and inline arrays/objects are untouched.
function needsYamlQuoting(raw) {
  if (raw === '' || isAlreadyStructured(raw)) {
    return false;
  }
  if (/:(\s|$)/.test(raw)) {
    return true; // "x: y" or trailing ":" — the mapping-value trap (the real bug).
  }
  if (raw !== raw.trim()) {
    return true; // leading/trailing whitespace is lost by a plain scalar.
  }
  return false;
}

// Quote a scalar as a YAML double-quoted string, escaping \ and " so the value
// is preserved verbatim. Only called when needsYamlQuoting is true.
function yamlQuote(raw) {
  return `"${raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

// Serialize entries back into a frontmatter block (--- ... ---\n). Entries with
// raw === null are dropped. Scalar values that a YAML reader would misparse
// (notably a description containing `: `) are emitted double-quoted so every
// projected SKILL/agent file has valid frontmatter; already-structured values
// (inline arrays/objects, already-quoted scalars) pass through unchanged so the
// per-provider rewrites stay byte-stable.
function serialize(entries, body) {
  const kept = entries.filter(e => e.raw !== null);
  if (!kept.length) {
    // No frontmatter survives — return the body alone.
    return body;
  }
  const lines = kept.map((e) => {
    if (e.raw === '') {
      return `${e.key}:`;
    }
    const value = needsYamlQuoting(e.raw) ? yamlQuote(e.raw) : e.raw;
    return `${e.key}: ${value}`;
  });
  return `---\n${lines.join('\n')}\n---\n${body}`;
}

// Per-target rewrite of a parsed entry list. Mutates entry.raw (null => drop).
function rewriteEntries(entries, target) {
  for (const entry of entries) {
    const { key } = entry;

    if (key === 'name' || key === 'description') {
      continue; // keep everywhere.
    }

    if (key === 'model') {
      // Model is a CLI/runtime choice — the user selects it in the CLI. It is
      // NEVER preset in any projection, for ANY provider (including Claude). The
      // canonical agents carry no `model:`; this drop is defense-in-depth so a
      // stray authored `model:` can never leak into an emitted file.
      entry.raw = null;
      continue;
    }

    if (target === 'claude') {
      continue; // canonical IS Claude-shaped; keep all (except model, dropped above).
    }

    if (target === 'opencode') {
      if (key === 'tools') {
        const arr = decodeInlineArray(entry.raw);
        if (arr) {
          // Claude array of names -> OpenCode object of name:true (enable-only;
          // omission already means "inherit", and a deny is expressed via
          // permission, not here).
          entry.raw = `{ ${arr.map(n => `${camelTool(n)}: true`).join(', ')} }`;
        }
      } else if (key === 'color') {
        // OpenCode's color schema accepts ONLY hex "#RRGGBB" or one of 7 theme
        // tokens. Rewrite a Claude named color to its hex; keep an already-hex
        // value or an already-valid theme token; anything else is dropped so the
        // file still validates (better no color than an invalid one).
        const value = decodeScalar(entry.raw);
        if (/^#[0-9a-fA-F]{6}$/.test(value) || OPENCODE_THEME_TOKENS.includes(value)) {
          // Already a valid OpenCode color — keep as-is.
        } else if (Object.prototype.hasOwnProperty.call(CLAUDE_TO_OPENCODE_COLOR, value.toLowerCase())) {
          entry.raw = CLAUDE_TO_OPENCODE_COLOR[value.toLowerCase()];
        } else {
          entry.raw = null; // unknown color name -> drop rather than emit invalid.
        }
      }
      // argument-hint: not part of OpenCode's command schema -> drop.
      else if (key === 'argument-hint') {
        entry.raw = null;
      }
      continue;
    }

    if (target === 'codex') {
      // Codex SKILL.md frontmatter is name + description ONLY; agents are
      // [agents.<name>] config.toml tables. color/tools/model/argument-hint have
      // NO Codex frontmatter slot. color -> interface.brand_color and tools ->
      // dependencies.tools are re-expressed by the agentic layer in openai.yaml;
      // here we drop them from the markdown so the file validates.
      entry.raw = null;
      continue;
    }
  }
  return entries;
}

// Claude tool names are PascalCase (Read, Grep); OpenCode tool keys are
// lowercase (read, grep, webfetch). Map the known core tools; unknown names
// (e.g. MCP tools) are lowercased as a best-effort default.
const CLAUDE_TO_OPENCODE_TOOL = Object.freeze({
  Read: 'read', Write: 'write', Edit: 'edit', Bash: 'bash',
  Grep: 'grep', Glob: 'glob', WebFetch: 'webfetch', WebSearch: 'websearch',
  Task: 'task', Skill: 'skill', Agent: 'task',
});
function camelTool(name) {
  return CLAUDE_TO_OPENCODE_TOOL[name] || name.toLowerCase();
}

// Public: adapt a model-facing .md's frontmatter for a target provider. Claude is
// canonical == Claude shape, so it is a no-op EXCEPT that a `model:` is always
// dropped (model is never preset on any provider — a CLI/runtime choice). To stay
// byte-stable, claude content with no `model:` is returned untouched; only when a
// stray `model:` is present does it get serialized through the drop. Returns the
// content with adapted (or dropped) frontmatter fields; the body is untouched.
function adapt(content, target) {
  if (!target) {
    return content;
  }
  const parsed = parse(content);
  if (!parsed.hasFrontmatter) {
    return content;
  }
  if (target === 'claude' && !parsed.entries.some(e => e.key === 'model')) {
    return content; // true no-op: nothing to drop, keep byte-identical.
  }
  const entries = rewriteEntries(parsed.entries, target);
  return serialize(entries, parsed.body);
}

module.exports = {
  adapt,
  parse,
  serialize,
  decodeInlineArray,
  CLAUDE_TO_OPENCODE_MODEL,
  CLAUDE_TO_OPENCODE_TOOL,
  CLAUDE_TO_OPENCODE_COLOR,
  OPENCODE_THEME_TOKENS,
};
