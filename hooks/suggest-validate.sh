#!/usr/bin/env bash
# Stop-hook reminder: suggest validating a freshly generated or adapted plugin —
# but ONLY when a candidate plugin directory was actually produced. Stays silent
# otherwise so it does not nag on ordinary sessions.
#
# A candidate is a directory (other than this plugin's own root) that contains a
# .claude-plugin/plugin.json and was modified in the last 15 minutes. Detection
# is best-effort and bounded; on any uncertainty the hook stays silent.
# Always exits 0 so it never blocks the session.

set -euo pipefail

# Drain stdin (hook input) without failing if empty.
cat >/dev/null 2>&1 || true

emit() {
  printf '%s\n' "$1"
  exit 0
}

silent() {
  exit 0
}

root="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -d "$root" ] || silent

# Find a recently-touched plugin manifest under the project, excluding caches,
# node_modules, and VCS dirs. Cap the search so it stays fast.
candidate="$(
  find "$root" \
    -type d \( -name node_modules -o -name .git -o -name cache \) -prune -o \
    -type f -path '*/.claude-plugin/plugin.json' -mmin -15 -print 2>/dev/null \
  | head -1 || true
)"

[ -n "${candidate:-}" ] || silent

plugin_dir="$(cd "$(dirname "$candidate")/.." 2>/dev/null && pwd || true)"
[ -n "${plugin_dir:-}" ] || silent

# Do not nag about this plugin's own repository.
own_root="${CLAUDE_PLUGIN_ROOT:-}"
if [ -n "$own_root" ] && [ "$plugin_dir" = "$own_root" ]; then
  silent
fi

emit "{\"systemMessage\":\"A plugin directory was updated at ${plugin_dir}. You can run /global-plugins:validate ${plugin_dir} to confirm manifests, projection parity, version sync, and the Prompt Defense Baseline before shipping.\"}"
