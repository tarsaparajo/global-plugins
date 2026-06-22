#!/usr/bin/env node
// migrate-apply.mjs — dry-run, apply, or rollback a migration chain. Computes the
// pending chain (migrations whose `from` range contains the installed version up
// to HEAD) and EXECUTES each migration's structured steps with dry-run, verify,
// and snapshot-based rollback.
//
// A migration's `steps[]` are STRUCTURED (a `kind` the runner interprets), never
// a shell string — so execution is deterministic and injection-free. Supported
// kinds:
//   - relocate-nonstandard-dirs { scope:[codex,opencode] }
//       For each provider config root under the install, enumerate top-level dirs
//       via the SAME classifier the projector uses (engine/helpers
//       classifyTopLevelDir + the provider's pinnedToRoot from the registry) and
//       move every PRIVATE dir into the plugin's bundle `_<slug>/<dir>/`. No
//       hand-listed dirs — the classifier is the single source of truth, so the
//       migration can never diverge from projection.
//   - remove-path { paths:[...], onlyWhen?:"bundleExists" }
//       Delete provider-root-relative paths under each scoped provider root if
//       present (idempotent: absent paths are a no-op). `onlyWhen:bundleExists`
//       skips the removal unless the new `_<slug>/` bundle is already in place, so
//       the old flat layout is removed only after the namespaced one exists.
//
// Forward applies the steps; verify asserts the post-state; a failed apply/verify
// rolls back from a pre-apply snapshot and halts the chain. Dry-run never writes.
//
// Usage: node scripts/evolve/migrate-apply.mjs [--dry-run|--apply|--rollback] [pluginRoot]

import { existsSync, readdirSync, readFileSync, mkdirSync, rmSync, renameSync, statSync, writeFileSync, lstatSync, readlinkSync, symlinkSync, cpSync } from 'node:fs';
import { join, dirname, relative, resolve as resolvePath } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const mode = args.find((a) => a.startsWith('--'))?.slice(2) || 'dry-run';
// Resolve to an ABSOLUTE path: a relative root like "." would make
// join(root,'engine') a bare specifier ("engine") that require() mis-resolves as
// a node_modules package instead of the bundled engine dir.
const root = resolvePath(args.find((a) => !a.startsWith('--')) || process.cwd());

// --- Shared engine helpers (single source of truth for classification) --------
// The runner classifies installed dirs with the SAME function the projector uses,
// so a relocate step can never decide differently from a fresh projection.
const enginePath = join(root, 'engine');
let classifyTopLevelDir;
let listProviders;
let privateBundleDir;
try {
  ({ classifyTopLevelDir, privateBundleDir } = require(join(enginePath, 'helpers.js')));
  ({ listProviders } = require(join(enginePath, 'registry.js')));
} catch {
  // No bundled engine (e.g. a bare install). Relocation steps need it; remove-path
  // steps do not. We degrade gracefully: a relocate step with no engine reports an
  // error rather than guessing.
}

// --- Migration chain discovery ------------------------------------------------
const migrationsDir = join(root, 'migrations');
const files = existsSync(migrationsDir)
  ? readdirSync(migrationsDir).filter((f) => /^\d+\.\d+\.\d+\.md$/.test(f)).sort()
  : [];

// Parse YAML frontmatter: scalar fields + the structured `steps:` block.
function parse(file) {
  const text = readFileSync(join(migrationsDir, file), 'utf8');
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  const body = fm ? fm[1] : '';
  const get = (k) => (fm ? (body.match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?`, 'm')) || [])[1] : undefined);
  return { file, migration: get('migration'), from: get('from'), steps: parseSteps(body) };
}

// Parse the `steps:` list into structured objects. Each list item is a `- id: …`
// block; we read `id`, `kind`, `scope` (inline array), `paths` (inline array),
// and `onlyWhen`. Hand-rolled so the runner has no YAML dependency.
function parseSteps(fmBody) {
  const lines = fmBody.split('\n');
  const start = lines.findIndex((l) => /^steps:\s*$/.test(l) || /^steps:\s*\[\]/.test(l));
  if (start === -1 || /^steps:\s*\[\]/.test(lines[start])) {
    return [];
  }
  const steps = [];
  let cur = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!/^\s/.test(line) && line.trim() !== '') {
      break; // dedented out of the steps block
    }
    const item = line.match(/^\s*-\s+id:\s*(.+?)\s*$/);
    if (item) {
      if (cur) steps.push(cur);
      cur = { id: item[1].replace(/^["']|["']$/g, '') };
      continue;
    }
    if (!cur) continue;
    const kv = line.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (/^\[.*\]$/.test(val)) {
      val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, '');
    }
    cur[key] = val;
  }
  if (cur) steps.push(cur);
  return steps;
}

const chain = files.map(parse);

// --- SemVer gating: compute the PENDING chain from the installed version -------
// The migration runner applies only migrations whose `from` range contains the
// installed version up to HEAD (the real "pending chain"), instead of running
// every migration and leaning on idempotence alone. The installed version is read
// from the per-install provenance stamp; absent (a pre-stamp install) -> treat as
// the lowest possible version so the whole chain applies.
function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(String(v || '').trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
function cmpSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) { if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1; }
  return 0;
}
// Test a version against one comparator (`>=1.0.0`, `<1.1.0`, `1.0.0`, `*`).
function satisfiesComparator(version, comp) {
  comp = comp.trim();
  if (!comp || comp === '*') return true;
  const m = /^(>=|<=|>|<|=)?\s*(\d+\.\d+\.\d+.*)$/.exec(comp);
  if (!m) return true;
  const op = m[1] || '=';
  const c = cmpSemver(version, m[2]);
  if (op === '>=') return c >= 0;
  if (op === '<=') return c <= 0;
  if (op === '>') return c > 0;
  if (op === '<') return c < 0;
  return c === 0;
}
// A `from` range is a space-separated AND of comparators (e.g. ">=1.0.0 <1.1.0").
function satisfiesRange(version, range) {
  if (!range || !version) return true; // no range / no known version -> applies
  return String(range).trim().split(/\s+/).every((comp) => satisfiesComparator(version, comp));
}
// Read the installed version from the provenance stamp, then the bundled lock,
// else null (pre-stamp). installRoot is where the provider dotfolders live.
function readInstalledVersion(installRoot) {
  for (const target of ['claude', 'codex', 'opencode']) {
    const adapter = adapterFor(target);
    if (!adapter || typeof adapter.getInstallStatePath !== 'function') continue;
    try {
      const p = adapter.getInstallStatePath({ repoRoot: installRoot, projectRoot: installRoot, homeDir: installRoot });
      const j = JSON.parse(readFileSync(p, 'utf8'));
      if (j && j.schemaVersion) return String(j.schemaVersion);
    } catch { /* try next provider */ }
  }
  try {
    const j = JSON.parse(readFileSync(join(installRoot, '.evolution', 'baseline', 'projection.lock.json'), 'utf8'));
    if (j && j.version) return String(j.version);
  } catch { /* fall through */ }
  return null;
}
// The HEAD version (target of the chain) — the migrations bring an install up to
// this. Used to re-stamp the install after a successful apply.
function headVersion(installRoot) {
  try { return readFileSync(join(installRoot, 'VERSION'), 'utf8').trim() || null; } catch { return null; }
}
// Re-stamp every provider's install-state schemaVersion to `version` after apply.
function restampVersion(installRoot, version) {
  if (!version) return;
  for (const target of ['claude', 'codex', 'opencode']) {
    const adapter = adapterFor(target);
    if (!adapter || typeof adapter.getInstallStatePath !== 'function') continue;
    let p;
    try { p = adapter.getInstallStatePath({ repoRoot: installRoot, projectRoot: installRoot, homeDir: installRoot }); } catch { continue; }
    if (!existsSync(p)) continue;
    try {
      const j = JSON.parse(readFileSync(p, 'utf8'));
      j.schemaVersion = version;
      writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`);
    } catch { /* leave stamp as-is on parse failure */ }
  }
}

// --- Filesystem snapshot / rollback (mirrors engine/executor.js) --------------
// A snapshot maps an absolute path to its prior state: null (absent → delete on
// rollback), { link } (a symlink → restore the link), { dir } (a recursive
// manifest of {relfile: content} → reconstruct the tree), or a string (file
// content → rewrite). Rollback restores each entry, in any order.
function snapshotPath(abs) {
  if (!existsSync(abs) && !isSymlink(abs)) {
    return null;
  }
  if (isSymlink(abs)) {
    return { link: readlinkSync(abs) };
  }
  const st = statSync(abs);
  if (st.isDirectory()) {
    const manifest = {};
    for (const rel of listFilesRec(abs)) {
      manifest[rel] = readFileSync(join(abs, rel), 'utf8');
    }
    return { dir: manifest };
  }
  return readFileSync(abs, 'utf8');
}

function restorePath(abs, prior) {
  if (prior === null) {
    if (existsSync(abs) || isSymlink(abs)) rmSync(abs, { recursive: true, force: true });
    return;
  }
  if (prior && typeof prior === 'object' && 'link' in prior) {
    if (existsSync(abs) || isSymlink(abs)) rmSync(abs, { recursive: true, force: true });
    mkdirSync(dirname(abs), { recursive: true });
    symlinkSync(prior.link, abs);
    return;
  }
  if (prior && typeof prior === 'object' && 'dir' in prior) {
    if (existsSync(abs) || isSymlink(abs)) rmSync(abs, { recursive: true, force: true });
    mkdirSync(abs, { recursive: true });
    for (const [rel, content] of Object.entries(prior.dir)) {
      const dest = join(abs, rel);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, content);
    }
    return;
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, prior);
}

function isSymlink(abs) {
  try { return lstatSync(abs).isSymbolicLink(); } catch { return false; }
}

function listFilesRec(dir, prefix = '') {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...listFilesRec(join(dir, e.name), rel));
    else out.push(rel);
  }
  return out;
}

// --- Step resolution: a step → the concrete {move|remove} operations -----------
// Resolving is PURE (no writes), so dry-run can print the plan and apply/verify
// share the exact same resolution. installRoot is the user's home/config base
// where the provider dotfolders live; for a self-test it is the same as `root`.
function providerRoot(installRoot, target) {
  return join(installRoot, `.${target}`);
}

function adapterFor(target) {
  if (!listProviders) return null;
  return listProviders().find((a) => a.target === target) || null;
}

function resolveRelocate(step, installRoot, slug) {
  const ops = [];
  const errors = [];
  const scope = Array.isArray(step.scope) ? step.scope : [];
  for (const target of scope) {
    const adapter = adapterFor(target);
    if (!adapter || !classifyTopLevelDir) {
      errors.push(`relocate-nonstandard-dirs: no engine/registry for ${target}`);
      continue;
    }
    if (adapter.wholeRepoInstall) continue; // claude: nothing to relocate
    const dot = providerRoot(installRoot, target);
    if (!existsSync(dot)) continue;
    const pinnedToRoot = new Set(adapter.pinnedToRoot || []);
    const privBundleName = slug ? `_${slug}` : '';
    for (const name of readdirSync(dot, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()) {
      const verdict = classifyTopLevelDir(name, { pinnedToRoot, wholeRepo: false, privBundleName });
      if (verdict !== 'PRIVATE') continue;
      if (name === 'engine' || name === 'dist') continue; // bundle siblings, not source dirs
      const from = join(dot, name);
      const to = privBundleName ? join(dot, privBundleName, name) : join(dot, name);
      if (from === to) continue;
      ops.push({ type: 'move', from, to });
    }
  }
  return { ops, errors };
}

function resolveRemove(step, installRoot, slug) {
  const ops = [];
  const scope = Array.isArray(step.scope) ? step.scope : ['codex', 'opencode'];
  const paths = Array.isArray(step.paths) ? step.paths : (step.paths ? [step.paths] : []);
  for (const target of scope) {
    const dot = providerRoot(installRoot, target);
    if (!existsSync(dot)) continue;
    if (step.onlyWhen === 'bundleExists') {
      const bundle = slug ? join(dot, `_${slug}`) : null;
      if (!bundle || !existsSync(bundle)) continue;
    }
    for (const p of paths) {
      const abs = join(dot, p);
      if (existsSync(abs) || isSymlink(abs)) ops.push({ type: 'remove', path: abs });
    }
  }
  return { ops, errors: [] };
}

// Move a specific provider-root-relative SUBPATH into the plugin's bundle. Unlike
// relocate-nonstandard-dirs (which scans TOP-LEVEL dirs), this targets one known
// path that may be nested under a shared dir — e.g. `skills/_knowledge` → the
// bundle's `knowledge/`. `from` is provider-root-relative; `to` is bundle-relative
// (joined under `_<slug>/`). Idempotent: no op when `from` is absent (already
// moved). Claude (wholeRepoInstall) is skipped — its layout keeps repo-root paths.
function resolveRelocateSubpath(step, installRoot, slug) {
  const ops = [];
  const errors = [];
  const scope = Array.isArray(step.scope) ? step.scope : [];
  const fromRel = typeof step.from === 'string' ? step.from : null;
  const toRel = typeof step.to === 'string' ? step.to : null;
  if (!fromRel || !toRel) {
    return { ops, errors: [`relocate-subpath: needs from + to (id=${step.id})`] };
  }
  const privBundleName = slug ? `_${slug}` : '';
  for (const target of scope) {
    const adapter = adapterFor(target);
    if (adapter && adapter.wholeRepoInstall) continue; // claude: nothing to relocate
    const dot = providerRoot(installRoot, target);
    if (!existsSync(dot)) continue;
    const from = join(dot, fromRel);
    if (!existsSync(from)) continue; // already moved / never present
    const to = privBundleName ? join(dot, privBundleName, toRel) : join(dot, toRel);
    if (from === to) continue;
    ops.push({ type: 'move', from, to });
  }
  return { ops, errors };
}

// Rename a member INSIDE the plugin's bundle (e.g. `_engine` → `engine`). `from`
// and `to` are bundle-relative names. Idempotent: no op when the old name is gone
// or the new name already exists. Claude is skipped (no bundle — whole-repo).
function resolveRenameBundleMember(step, installRoot, slug) {
  const ops = [];
  const errors = [];
  const scope = Array.isArray(step.scope) ? step.scope : [];
  const fromName = typeof step.from === 'string' ? step.from : null;
  const toName = typeof step.to === 'string' ? step.to : null;
  if (!fromName || !toName) {
    return { ops, errors: [`rename-bundle-member: needs from + to (id=${step.id})`] };
  }
  const privBundleName = slug ? `_${slug}` : '';
  if (!privBundleName) return { ops, errors }; // no bundle (fixture) -> nothing to rename
  for (const target of scope) {
    const adapter = adapterFor(target);
    if (adapter && adapter.wholeRepoInstall) continue;
    const dot = providerRoot(installRoot, target);
    const bundle = join(dot, privBundleName);
    if (!existsSync(bundle)) continue;
    const from = join(bundle, fromName);
    const to = join(bundle, toName);
    if (!existsSync(from)) continue;       // already renamed
    if (existsSync(to)) continue;          // destination already present — leave it
    ops.push({ type: 'move', from, to });
  }
  return { ops, errors };
}

// Rebuild the OpenCode compiled dist after a bundle-member rename changed the
// `dist/tools → ../../engine` offset. Produces a `rebuild` op the executor runs
// via the bundled engine/build-opencode.js, so dist is regenerated deterministically
// against the new payload location. Scope is forced to opencode (the only provider
// with a compiled dist). Idempotent: re-running re-emits byte-identical dist.
function resolveRebuildOpencode(step, installRoot, slug) {
  const ops = [];
  if (!slug) return { ops, errors: [] };
  const dot = providerRoot(installRoot, 'opencode');
  if (!existsSync(dot)) return { ops, errors: [] };
  const buildScript = join(installRoot, 'engine', 'build-opencode.js');
  // The build writes into <installRoot>/.opencode/_<slug>/dist; build-opencode.js
  // takes <root> <slug> and resolves .opencode under it.
  if (!existsSync(buildScript)) {
    return { ops, errors: [`rebuild-opencode-dist: engine/build-opencode.js not found at install root`] };
  }
  ops.push({ type: 'rebuild', script: buildScript, root: installRoot, slug });
  return { ops, errors: [] };
}

function resolveStep(step, installRoot, slug) {
  if (step.kind === 'relocate-nonstandard-dirs') return resolveRelocate(step, installRoot, slug);
  if (step.kind === 'relocate-subpath') return resolveRelocateSubpath(step, installRoot, slug);
  if (step.kind === 'rename-bundle-member') return resolveRenameBundleMember(step, installRoot, slug);
  if (step.kind === 'rebuild-opencode-dist') return resolveRebuildOpencode(step, installRoot, slug);
  if (step.kind === 'remove-path') return resolveRemove(step, installRoot, slug);
  // Unknown kinds are reported, never executed.
  return { ops: [], errors: [`unknown step kind: ${step.kind || '(none)'} (id=${step.id})`] };
}

// Inverse of a relocate step for a STANDALONE --rollback (no snapshot): move every
// non-standard folder back OUT of the bundle to the provider root. We cannot
// re-derive it from the root (it's empty after apply), so we scan the bundle and
// move out every dir that is NOT a bundle infra sibling (`engine`/`dist`). A
// remove-path step has no snapshot-free inverse and is reported as non-invertible.
function resolveRelocateInverse(step, installRoot, slug) {
  const ops = [];
  const errors = [];
  const scope = Array.isArray(step.scope) ? step.scope : [];
  const privBundleName = slug ? `_${slug}` : '';
  if (!privBundleName) return { ops, errors };
  for (const target of scope) {
    const dot = providerRoot(installRoot, target);
    const bundle = join(dot, privBundleName);
    if (!existsSync(bundle)) continue;
    for (const name of readdirSync(bundle, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()) {
      if (name === 'engine' || name === 'dist') continue; // infra siblings stay in the bundle
      const from = join(bundle, name);
      const to = join(dot, name);
      ops.push({ type: 'move', from, to });
    }
  }
  return { ops, errors };
}

// Dispatch a step to its INVERSE for standalone --rollback. Kinds with no
// snapshot-free inverse (remove-path, rebuild) resolve to an empty op set (a
// reported no-op, never a guess).
function resolveInverseStep(step, installRoot, slug) {
  if (step.kind === 'relocate-nonstandard-dirs') return resolveRelocateInverse(step, installRoot, slug);
  if (step.kind === 'rename-bundle-member') {
    return resolveRenameBundleMember({ ...step, from: step.to, to: step.from }, installRoot, slug);
  }
  if (step.kind === 'relocate-subpath') return resolveInverseRelocateSubpath(step, installRoot, slug);
  // remove-path / rebuild-opencode-dist: no snapshot-free inverse -> reported no-op.
  if (step.kind === 'remove-path' || step.kind === 'rebuild-opencode-dist') return { ops: [], errors: [] };
  return { ops: [], errors: [`unknown step kind for inverse: ${step.kind || '(none)'} (id=${step.id})`] };
}

// Inverse of relocate-subpath: the bundled `to` (bundle-relative) moves back to
// the provider-root `from`. Built directly so the bundle-relative resolution
// matches the forward path computation.
function resolveInverseRelocateSubpath(step, installRoot, slug) {
  const ops = [];
  const scope = Array.isArray(step.scope) ? step.scope : [];
  const fromRel = typeof step.from === 'string' ? step.from : null; // provider-root rel
  const toRel = typeof step.to === 'string' ? step.to : null;       // bundle rel
  if (!fromRel || !toRel) return { ops, errors: [`relocate-subpath inverse: needs from + to (id=${step.id})`] };
  const privBundleName = slug ? `_${slug}` : '';
  for (const target of scope) {
    const adapter = adapterFor(target);
    if (adapter && adapter.wholeRepoInstall) continue;
    const dot = providerRoot(installRoot, target);
    if (!existsSync(dot)) continue;
    const bundled = privBundleName ? join(dot, privBundleName, toRel) : join(dot, toRel);
    if (!existsSync(bundled)) continue; // nothing to move back
    const back = join(dot, fromRel);
    if (bundled === back) continue;
    ops.push({ type: 'move', from: bundled, to: back });
  }
  return { ops, errors: [] };
}

// --- Execution ----------------------------------------------------------------
function applyOps(ops) {
  for (const op of ops) {
    if (op.type === 'move') {
      mkdirSync(dirname(op.to), { recursive: true });
      try {
        renameSync(op.from, op.to);
      } catch (e) {
        if (e && e.code === 'EXDEV') { // cross-device: copy then remove
          cpSync(op.from, op.to, { recursive: true });
          rmSync(op.from, { recursive: true, force: true });
        } else { throw e; }
      }
    } else if (op.type === 'remove') {
      rmSync(op.path, { recursive: true, force: true });
    } else if (op.type === 'rebuild') {
      // Regenerate the OpenCode compiled dist deterministically against the new
      // payload offset (engine/build-opencode.js <root> <slug>).
      execFileSync('node', [op.script, op.root, op.slug], { stdio: 'pipe' });
    }
  }
}

function verifyOps(ops) {
  const failures = [];
  for (const op of ops) {
    if (op.type === 'move') {
      if (!existsSync(op.to)) failures.push(`expected ${op.to} to exist after move`);
      if (existsSync(op.from)) failures.push(`expected ${op.from} to be gone after move`);
    } else if (op.type === 'remove') {
      if (existsSync(op.path)) failures.push(`expected ${op.path} to be removed`);
    } else if (op.type === 'rebuild') {
      // The build must have produced the compiled entry + tools resolving the new
      // `../../engine` offset under the bundle's dist/.
      const distIndex = join(op.root, '.opencode', `_${op.slug}`, 'dist', 'index.js');
      if (!existsSync(distIndex)) failures.push(`expected ${distIndex} after rebuild`);
    }
  }
  return failures;
}

function slugFromInstall(installRoot) {
  for (const rel of ['.claude-plugin/plugin.json', 'package.json']) {
    try {
      const j = JSON.parse(readFileSync(join(installRoot, rel), 'utf8'));
      if (j && typeof j.name === 'string' && j.name.trim()) return j.name.trim();
    } catch { /* try next */ }
  }
  // Fall back to the engine's resolver (handles the same precedence) if present.
  if (privateBundleDir) {
    const b = privateBundleDir(installRoot);
    if (b) return b.replace(/^_/, '');
  }
  return '';
}

// Run the chain in `mode`. installRoot defaults to root (self-install/test).
// The PENDING chain is gated by the installed version: only migrations whose
// `from` range contains it are applied (forward), up to HEAD. A rollback inverts
// the SAME pending set in reverse. Idempotence remains the safety net, but gating
// is the primary mechanism so a fresh-from-HEAD install is a clean no-op and an
// old install runs exactly the migrations it is missing.
function run(mode, installRoot) {
  const slug = slugFromInstall(installRoot);
  const installedVersion = readInstalledVersion(installRoot);
  const target = headVersion(installRoot);
  // Pending = migrations whose `from` range contains the installed version. A
  // pre-stamp install (installedVersion === null) -> every migration is pending.
  const pendingChain = chain.filter((c) => satisfiesRange(installedVersion, c.from));
  const skipped = chain.filter((c) => !pendingChain.includes(c)).map((c) => c.migration);
  const report = {
    mode,
    installedVersion: installedVersion || '(pre-stamp)',
    targetVersion: target || null,
    pending: pendingChain.map((c) => c.migration),
    skippedAlreadyApplied: skipped,
    files: pendingChain.map((c) => c.file),
    steps: [],
  };

  // Rollback applies migrations in REVERSE order (the inverse of forward).
  const ordered = mode === 'rollback' ? [...pendingChain].reverse() : pendingChain;
  for (const mig of ordered) {
    const steps = mode === 'rollback' ? [...mig.steps].reverse() : mig.steps;
    for (const step of steps) {
      // For rollback, resolve the INVERSE of the step; for dry-run/apply, resolve
      // the forward step. relocate-nonstandard-dirs inverts by scanning the bundle;
      // relocate-subpath and rename-bundle-member invert by swapping from<->to.
      const resolved = mode === 'rollback'
        ? resolveInverseStep(step, installRoot, slug)
        : resolveStep(step, installRoot, slug);
      const { ops, errors } = resolved;
      const planned = ops.map((o) => {
        if (o.type === 'move') return { move: { from: rel(installRoot, o.from), to: rel(installRoot, o.to) } };
        if (o.type === 'remove') return { remove: rel(installRoot, o.path) };
        if (o.type === 'rebuild') return { rebuild: `${rel(installRoot, '.opencode')}/_${o.slug}/dist` };
        return { unknown: o.type };
      });
      const entry = { migration: mig.migration, id: step.id, kind: step.kind, planned, errors };

      if (mode === 'dry-run') {
        report.steps.push(entry);
        continue;
      }
      if (errors.length) {
        entry.status = 'error';
        report.steps.push(entry);
        report.ok = false;
        return report; // halt the chain on an unresolved step
      }
      if (mode === 'rollback') {
        // Standalone --rollback: a relocate's inverse moves each bundled folder
        // back to the provider root (resolved above by scanning the bundle). A
        // remove-path has no snapshot-free inverse — its `planned` is empty, so it
        // is a reported no-op rather than a guess.
        const snap = {};
        for (const o of ops) { snap[o.from] = snapshotPath(o.from); snap[o.to] = snapshotPath(o.to); }
        try {
          applyOps(ops);
          entry.status = ops.length ? 'rolled-back' : 'noop';
        } catch (e) {
          for (const [p, prior] of Object.entries(snap)) restorePath(p, prior);
          entry.status = 'rollback-failed';
          entry.error = e.message;
          report.ok = false;
          report.steps.push(entry);
          return report;
        }
        report.steps.push(entry);
        continue;
      }
      // apply: snapshot → forward → verify → (on failure) rollback + halt.
      const touched = new Set();
      for (const o of ops) {
        if (o.type === 'move') { touched.add(o.from); touched.add(o.to); }
        else if (o.type === 'remove') { touched.add(o.path); }
        else if (o.type === 'rebuild') { touched.add(join(o.root, '.opencode', `_${o.slug}`, 'dist')); }
      }
      const snap = {};
      for (const p of touched) snap[p] = snapshotPath(p);
      try {
        applyOps(ops);
        const failures = verifyOps(ops);
        if (failures.length) throw new Error(`verify failed: ${failures.join('; ')}`);
        entry.status = 'applied';
      } catch (e) {
        for (const [p, prior] of Object.entries(snap)) restorePath(p, prior);
        entry.status = 'rolled-back-on-failure';
        entry.error = e.message;
        report.ok = false;
        report.steps.push(entry);
        return report;
      }
      report.steps.push(entry);
    }
  }
  if (mode === 'apply') {
    // Advance the install's recorded version to HEAD so a subsequent run is a
    // clean no-op (the pending chain becomes empty). Rollback leaves the stamp
    // alone — the operator is intentionally moving backward.
    restampVersion(installRoot, target);
    report.restampedTo = target || null;
  }
  if (mode !== 'dry-run') report.ok = true;
  return report;
}

function rel(base, abs) {
  const r = relative(base, abs);
  return r.startsWith('..') ? abs : r;
}

const result = run(mode, root);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exit(result.ok === false ? 1 : 0);
