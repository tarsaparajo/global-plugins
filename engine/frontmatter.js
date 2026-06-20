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
//   model (alias)  keep                  rewrite -> "provider/model"   DROP (runtime/config concern)
//   color (named)  keep (named enum)     rewrite -> hex/theme (kept)   DROP (native: openai.yaml interface.brand_color)
//   argument-hint  keep                  DROP (commands use template)  DROP (SKILL.md = name+description only)
//   (unknown)      keep                  keep                          DROP unless name/description

// Claude model alias -> OpenCode "provider/model". Anthropic models are the
// canonical default; unknown/explicit ids pass through unchanged (already
// provider-qualified or a full id the agentic layer can refine).
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

// Serialize entries back into a frontmatter block (--- ... ---\n). Entries with
// raw === null are dropped.
function serialize(entries, body) {
  const kept = entries.filter(e => e.raw !== null);
  if (!kept.length) {
    // No frontmatter survives — return the body alone.
    return body;
  }
  const lines = kept.map(e => (e.raw === '' ? `${e.key}:` : `${e.key}: ${e.raw}`));
  return `---\n${lines.join('\n')}\n---\n${body}`;
}

// Per-target rewrite of a parsed entry list. Mutates entry.raw (null => drop).
function rewriteEntries(entries, target) {
  for (const entry of entries) {
    const { key } = entry;

    if (key === 'name' || key === 'description') {
      continue; // keep everywhere.
    }

    if (target === 'claude') {
      continue; // canonical IS Claude-shaped; keep all.
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
      } else if (key === 'model') {
        const alias = decodeScalar(entry.raw);
        if (Object.prototype.hasOwnProperty.call(CLAUDE_TO_OPENCODE_MODEL, alias)) {
          const mapped = CLAUDE_TO_OPENCODE_MODEL[alias];
          entry.raw = mapped === null ? null : mapped; // inherit -> drop.
        }
        // Unknown / already-qualified ids pass through unchanged.
      }
      // color: OpenCode supports a color field (hex or theme name). Named Claude
      // colors are valid theme-style tokens, so keep. argument-hint: not part of
      // OpenCode's command schema -> drop.
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
// a no-op (canonical == Claude shape). Returns the content with adapted (or
// dropped) frontmatter fields; the body is untouched.
function adapt(content, target) {
  if (!target || target === 'claude') {
    return content;
  }
  const parsed = parse(content);
  if (!parsed.hasFrontmatter) {
    return content;
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
};
