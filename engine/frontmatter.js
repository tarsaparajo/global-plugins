'use strict';

// Frontmatter transforms for agent files. Canonical agents carry Claude-native
// YAML frontmatter (a `tools` array, a `color` keyword, a bare `model` alias).
// Other providers reject that shape, so the OpenCode and Codex adapters route
// agents through here instead of copying bytes verbatim. Dependency-free: a
// minimal YAML-subset parser (the only shapes agent frontmatter ever uses —
// scalars, quoted strings, inline `[a, b]` arrays) plus per-provider emitters.

// --- Parsing ---------------------------------------------------------------

// Split a markdown document into { data, body }. `data` is the parsed
// frontmatter object (empty when no frontmatter block is present); `body` is
// everything after the closing `---`.
function parse(content) {
  const text = String(content == null ? '' : content);
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!match) {
    return { data: {}, body: text };
  }
  return { data: parseYamlBlock(match[1]), body: match[2] };
}

// Parse the YAML-subset used by agent frontmatter. Supports `key: scalar`,
// `key: "quoted"`, `key: [a, "b", c]`, booleans/numbers, and a single level of
// indented block mapping (`key:` followed by `  child: value` lines — the form
// used for an OpenCode `tools:` map). Blank/comment lines are ignored. Anything
// unrecognized is kept as a raw string so no information is silently dropped.
function parseYamlBlock(block) {
  const data = {};
  const lines = String(block).split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i].replace(/\s+$/, '');
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) {
      continue;
    }
    // Top-level keys have no leading indentation; indented lines are consumed
    // by the block-mapping branch below.
    if (/^\s/.test(rawLine)) {
      continue;
    }
    const sep = rawLine.indexOf(':');
    if (sep === -1) {
      continue;
    }
    const key = rawLine.slice(0, sep).trim();
    const rawValue = rawLine.slice(sep + 1).trim();
    if (!key) {
      continue;
    }
    if (rawValue === '' && isBlockMapping(lines, i + 1)) {
      const { map, next } = parseBlockMapping(lines, i + 1);
      data[key] = map;
      i = next - 1;
      continue;
    }
    data[key] = parseScalarOrArray(rawValue);
  }
  return data;
}

// True when the next line begins an indented `child: value` block.
function isBlockMapping(lines, start) {
  const line = lines[start];
  return typeof line === 'string' && /^\s+\S+\s*:/.test(line);
}

// Consume contiguous indented `child: value` lines into an object. Returns the
// map and the index of the first non-member line.
function parseBlockMapping(lines, start) {
  const map = {};
  let i = start;
  for (; i < lines.length; i += 1) {
    const line = lines[i].replace(/\s+$/, '');
    if (line.trim() === '' || line.trim().startsWith('#')) {
      continue;
    }
    if (!/^\s/.test(line)) {
      break;
    }
    const sep = line.indexOf(':');
    if (sep === -1) {
      break;
    }
    const childKey = line.slice(0, sep).trim();
    const childValue = line.slice(sep + 1).trim();
    map[childKey] = parseScalar(childValue);
  }
  return { map, next: i };
}

function parseScalarOrArray(raw) {
  if (raw === '') {
    return '';
  }
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1).trim();
    if (!inner) {
      return [];
    }
    return splitInlineList(inner).map(parseScalar);
  }
  return parseScalar(raw);
}

// Split `a, "b, c", d` on top-level commas, honoring quoted segments.
function splitInlineList(inner) {
  const items = [];
  let current = '';
  let quote = null;
  for (const ch of inner) {
    if (quote) {
      current += ch;
      if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === ',') {
      items.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) {
    items.push(current.trim());
  }
  return items;
}

function parseScalar(token) {
  const t = String(token).trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t !== '' && !Number.isNaN(Number(t)) && /^-?\d+(\.\d+)?$/.test(t)) {
    return Number(t);
  }
  return t;
}

// --- Serialization ---------------------------------------------------------

// Serialize a frontmatter object + body back into a markdown document. `order`
// fixes key order for deterministic, diff-friendly output; remaining keys
// follow in insertion order.
function serialize(data, body, order = []) {
  const keys = [];
  for (const k of order) {
    if (k in data) keys.push(k);
  }
  for (const k of Object.keys(data)) {
    if (!keys.includes(k)) keys.push(k);
  }
  const lines = ['---'];
  for (const key of keys) {
    const value = data[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Block mapping: `key:` then one indented `child: value` line each. This
      // is the canonical YAML form for an OpenCode `tools:` map and round-trips
      // through parse() above.
      lines.push(`${key}:`);
      for (const [childKey, childValue] of Object.entries(value)) {
        lines.push(`  ${childKey}: ${serializeYamlScalar(childValue)}`);
      }
      continue;
    }
    lines.push(`${key}: ${serializeYamlValue(value)}`);
  }
  lines.push('---');
  const tail = body == null ? '' : String(body);
  // Preserve a single blank line between frontmatter and body for readability.
  return `${lines.join('\n')}\n${tail.startsWith('\n') ? tail : `\n${tail}`}`;
}

function serializeYamlValue(value) {
  if (Array.isArray(value)) {
    return `[${value.map(serializeYamlScalar).join(', ')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value).map(([k, v]) => `${k}: ${serializeYamlScalar(v)}`);
    return `{ ${entries.join(', ')} }`;
  }
  return serializeYamlScalar(value);
}

function serializeYamlScalar(value) {
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  const s = String(value);
  // Quote when the scalar contains YAML-significant characters.
  if (s === '' || /[:#\[\]{},&*!|>'"%@`]/.test(s) || /^\s|\s$/.test(s)) {
    return JSON.stringify(s);
  }
  return s;
}

// --- Provider-specific mappers ---------------------------------------------

// Map a canonical Claude tool name to an OpenCode permission/tool key. OpenCode
// keys are lowercase (read, edit, glob, grep, list, bash, write, task, webfetch,
// websearch, ...). Unknown tools are lowercased as a best effort.
const OPENCODE_TOOL_MAP = Object.freeze({
  read: 'read',
  write: 'write',
  edit: 'edit',
  bash: 'bash',
  grep: 'grep',
  glob: 'glob',
  ls: 'list',
  list: 'list',
  webfetch: 'webfetch',
  websearch: 'websearch',
  task: 'task',
  todowrite: 'todowrite',
});

function toOpenCodeToolKey(name) {
  const lower = String(name).trim().toLowerCase();
  return OPENCODE_TOOL_MAP[lower] || lower;
}

// Map a bare canonical model alias to an OpenCode `provider/model` string. The
// canonical agents use Anthropic aliases (sonnet/opus/haiku). When no confident
// mapping exists, return null so the caller drops the field (OpenCode then uses
// its configured default model rather than rejecting an invalid value).
const OPENCODE_MODEL_MAP = Object.freeze({
  sonnet: 'anthropic/claude-sonnet-4-5',
  opus: 'anthropic/claude-opus-4-1',
  haiku: 'anthropic/claude-haiku-4-5',
});

function toOpenCodeModel(model) {
  if (model == null || model === '') {
    return null;
  }
  const s = String(model).trim();
  // Already a provider/model identifier — pass through untouched.
  if (s.includes('/')) {
    return s;
  }
  return OPENCODE_MODEL_MAP[s.toLowerCase()] || null;
}

// Transform a canonical agent document into an OpenCode-valid agent markdown
// file. Drops Claude-only cosmetic fields (color) that OpenCode's schema
// rejects, converts the tools array into a tools object, normalizes the model,
// and stamps mode: subagent (the role every projected canonical agent plays).
function toOpenCodeAgent(content) {
  const { data, body } = parse(content);
  const out = {};

  if ('description' in data) {
    out.description = data.description;
  }
  out.mode = data.mode || 'subagent';

  const model = toOpenCodeModel(data.model);
  if (model) {
    out.model = model;
  }

  if (Array.isArray(data.tools) && data.tools.length > 0) {
    const tools = {};
    for (const tool of data.tools) {
      tools[toOpenCodeToolKey(tool)] = true;
    }
    out.tools = tools;
  } else if (data.tools && typeof data.tools === 'object') {
    out.tools = data.tools;
  }

  // `color`, `name`, and any other Claude-only fields are intentionally not
  // carried: OpenCode derives the agent name from the file name, and `color`
  // is not part of its agent schema.
  return serialize(out, body, ['description', 'mode', 'model', 'tools']);
}

// Transform a canonical agent document into a valid Codex TOML agent file.
// Codex agents are TOML, not markdown-with-frontmatter; the body becomes a
// multi-line `instructions` string and the frontmatter scalars become TOML
// keys. The `tools` array is preserved as a TOML array of lowercased names.
function toCodexAgentToml(content) {
  const { data, body } = parse(content);
  const lines = ['#:schema https://developers.openai.com/codex/agent-schema.json', ''];

  if ('name' in data) {
    lines.push(`name = ${tomlString(data.name)}`);
  }
  if ('description' in data) {
    lines.push(`description = ${tomlString(data.description)}`);
  }
  // The canonical `model` is an Anthropic alias (sonnet/opus/haiku). Codex runs
  // OpenAI models, so a bare Anthropic alias is meaningless there — carry the
  // model only when it is an explicit provider/slug, otherwise let Codex use
  // its configured default rather than emit a bogus value.
  if (typeof data.model === 'string' && data.model.includes('/')) {
    lines.push(`model = ${tomlString(data.model)}`);
  }
  if (Array.isArray(data.tools) && data.tools.length > 0) {
    const arr = data.tools.map(t => tomlString(String(t).toLowerCase())).join(', ');
    lines.push(`tools = [${arr}]`);
  }

  const instructions = String(body == null ? '' : body).trim();
  lines.push('');
  lines.push('instructions = """');
  lines.push(instructions);
  lines.push('"""');
  lines.push('');
  return lines.join('\n');
}

// Encode a TOML basic string. Escape backslashes and double quotes; keep it on
// one line (agent scalar fields never contain newlines).
function tomlString(value) {
  const s = String(value == null ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ');
  return `"${s}"`;
}

module.exports = {
  parse,
  serialize,
  toOpenCodeAgent,
  toOpenCodeModel,
  toOpenCodeToolKey,
  toCodexAgentToml,
};
