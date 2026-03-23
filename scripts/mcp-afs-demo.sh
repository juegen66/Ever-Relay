#!/usr/bin/env bash
# Cursor MCP: use this script's path so cwd and tsx come from the sibling test-mcp-afs workspace.
set -euo pipefail
# GUI apps (Cursor, Claude Desktop) often spawn MCP with a minimal PATH; Node is usually
# under Homebrew or /usr/local, not /usr/bin.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/local/sbin:${PATH:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEVKIT_ROOT="$(cd "$ROOT/.." && pwd)/everrelay-third-party-sdk"
MCP_DIR="$DEVKIT_ROOT/tools/test-mcp-afs"
if [ ! -d "$MCP_DIR" ]; then
  echo "afs MCP: missing sibling repo at $DEVKIT_ROOT. Create ../everrelay-third-party-sdk and run pnpm install there." >&2
  exit 1
fi
cd "$MCP_DIR"
if ! command -v node >/dev/null 2>&1; then
  echo "afs MCP: \`node\` not found. Install Node 22+ or extend PATH (e.g. nvm/fnm) in this script." >&2
  exit 127
fi
exec node "$MCP_DIR/node_modules/tsx/dist/cli.mjs" "$MCP_DIR/src/index.ts"
