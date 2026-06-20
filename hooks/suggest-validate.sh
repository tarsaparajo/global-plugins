#!/usr/bin/env bash
# Stop-hook reminder: suggest validating a freshly generated or adapted plugin.
# Non-blocking, advisory only. Reads the hook JSON from stdin (ignored) and emits
# a systemMessage. Always exits 0 so it never blocks the session.

set -euo pipefail

# Drain stdin (hook input) without failing if empty.
cat >/dev/null 2>&1 || true

printf '%s\n' '{"systemMessage":"If this session generated or adapted a plugin under a new directory, you can run /global-plugins:validate <path> to confirm manifests, projection parity, version sync, and the Prompt Defense Baseline before shipping."}'

exit 0
