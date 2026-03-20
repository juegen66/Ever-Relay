# Test MCP AFS (standalone)

Self-contained MCP server exposing AFS **Memory** and **Skill** via Mastra `MCPServer`. Uses **this folder’s own** `pnpm` install and **copied** AFS code under `src/afs`, `src/core`, `src/db` — not the parent repo’s `server/` modules.

This directory is listed in the parent repo’s `.gitignore` (local-only).

## Prerequisites

- Node **≥ 22.13** (required by `@mastra/mcp`)
- PostgreSQL with the same schema as the main app (`afs_memory`, `afs_skill`, etc.)
- `test-mcp-afs/.env` with at least `DATABASE_URL` (see below)

## Setup

```bash
cd test-mcp-afs
pnpm install
```

Link or copy env from the repo root (one-time):

```bash
ln -sf ../.env .env
# or: cp ../.env .env
```

## Run

From **this** directory:

```bash
pnpm mcp
# or watch mode:
pnpm dev
```

From the parent repo, you can still use the shell wrapper (uses **this** package’s `tsx`):

```bash
./scripts/mcp-afs-demo.sh
```

Process blocks on stdio; connect via Cursor or Claude Desktop MCP config.

### Cursor MCP config

Point `command` at [`scripts/mcp-afs-demo.sh`](../scripts/mcp-afs-demo.sh) (repo root) **or** at this package’s Node + entry:

```json
{
  "mcpServers": {
    "afs-demo": {
      "command": "/absolute/path/to/v0-apple-browser-app/test-mcp-afs/node_modules/.bin/tsx",
      "args": ["/absolute/path/to/v0-apple-browser-app/test-mcp-afs/src/index.ts"],
      "cwd": "/absolute/path/to/v0-apple-browser-app/test-mcp-afs",
      "env": {
        "AFS_MCP_USER_ID": "your-user-id-here"
      }
    }
  }
}
```

If `AFS_MCP_USER_ID` is set, tools use it when `userId` is omitted.

### Semantic search

Configure embedding env vars in `.env` (same names as main app): `AFS_EMBEDDING_API_KEY`, `AFS_EMBEDDING_BASE_URL`, `AFS_EMBEDDING_MODEL`, `AFS_EMBEDDING_MODEL_VERSION`, `AFS_EMBEDDING_DIMENSIONS`.

## Tools

- **Memory**: `afs_mcp_memory_list`, `afs_mcp_memory_read`, `afs_mcp_memory_write`, `afs_mcp_memory_search`, `afs_mcp_memory_delete`
- **Skill**: `afs_mcp_skill_list`, `afs_mcp_skill_read`, `afs_mcp_skill_upsert`

## Syncing AFS code from the main repo

When `server/afs/*` or AFS-related schema changes, copy the relevant files into `src/afs/` and `src/db/schema.ts` (AFS subset) and adjust imports to use `@/core/*`, `@/db/*`, `@/afs/*`.
