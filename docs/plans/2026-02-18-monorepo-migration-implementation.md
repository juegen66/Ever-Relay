# Monorepo Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate existing Next.js app to a pnpm monorepo with a standalone Hono API server and shared database logic.

**Architecture:** pnpm workspaces with `apps/web` (Next.js), `apps/api` (Hono), and `packages/db` (Shared Auth/DB).

**Tech Stack:** TypeScript, pnpm, Next.js, Hono, Better Auth, Better SQLite3.

---

### Task 1: Create Monorepo Structure

**Files:**
- Create: `pnpm-workspace.yaml`
- Modify: `package.json`
- Create: `apps/`
- Create: `packages/`

**Step 1: Create directories**

```bash
mkdir -p apps packages
```

**Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 3: Update root package.json**

Only keep devDependencies related to repo management (turbo, typescript, etc) and scripts. Remove dependencies that will move to apps.

```json
{
  "name": "monorepo-root",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r dev",
    "lint": "pnpm -r lint"
  },
  "devDependencies": {
    "typescript": "5.7.3",
    "turbo": "latest"
  }
}
```

**Step 4: Commit**

```bash
git add pnpm-workspace.yaml package.json apps packages
git commit -m "chore: initialize monorepo structure"
```

---

### Task 2: Extract Shared Database Package

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/src/auth.ts`
- Create: `packages/db/src/schema.ts`

**Step 1: Create package directory**

```bash
mkdir -p packages/db/src
```

**Step 2: Create package.json for db**

```json
{
  "name": "@repo/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint ."
  },
  "dependencies": {
    "better-sqlite3": "^12.6.2",
    "better-auth": "^1.4.18",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/node": "^22.0.0",
    "typescript": "5.7.3"
  }
}
```

**Step 3: Migrate DB/Auth Logic**

Copy logic from `server/modules/auth/service.ts` to `packages/db/src/auth.ts`.
Ensure database path is resolved correctly (likely using process.env.DB_PATH or relative to cwd if consistent).

**Step 4: Create index.ts export**

```typescript
export * from "./auth";
// export * from "./schema"; // if applicable
```

**Step 5: Commit**

```bash
git add packages/db
git commit -m "feat(db): create shared database package"
```

---

### Task 3: Migrate Next.js App to apps/web

**Files:**
- Move: Root files to `apps/web`
- Modify: `apps/web/package.json`
- Modify: `apps/web/next.config.mjs`
- Modify: `apps/web/tsconfig.json`

**Step 1: Move files**

```bash
mkdir -p apps/web
# Move all project files except apps, packages, pnpm-workspace.yaml, .git, node_modules
# (Be careful with the move command to not move the destination into itself)
git mv app components lib public server styles hooks data next-env.d.ts next.config.mjs postcss.config.mjs tailwind.config.ts tsconfig.json tsconfig.tsbuildinfo apps/web/
# Move original package.json to apps/web/ (we created a new root one in Task 1, but we need the deps from the old one)
# NOTE: In Task 1 we modified root package.json. We should have kept a copy of the old one for apps/web.
# For this plan, assume we reconstruct apps/web/package.json from the original project state.
```

**Step 2: Update apps/web/package.json**

- Change name to `@repo/web`
- Add dependency: `"@repo/db": "workspace:*"`
- Remove `better-sqlite3`, `better-auth` from dependencies (if fully moved to db package, though client auth might still need it)
- Ensure scripts run from correct directory context.

**Step 3: Update Imports**

Replace imports of `@/server/modules/auth/service` with `@repo/db`.

**Step 4: Verify Web App**

Run `pnpm install` and `pnpm dev --filter @repo/web` to check if it starts.

**Step 5: Commit**

```bash
git add apps/web
git commit -m "refactor(web): move next.js app to apps/web"
```

---

### Task 4: Create Hono API Server

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`

**Step 1: Create directory**

```bash
mkdir -p apps/api/src
```

**Step 2: Create package.json**

```json
{
  "name": "@repo/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@repo/db": "workspace:*",
    "@hono/node-server": "^1.13.7",
    "hono": "^4.6.14",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.2",
    "typescript": "5.7.3"
  }
}
```

**Step 3: Create Hono Server**

```typescript
// apps/api/src/index.ts
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { auth } from '@repo/db'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/me', async (c) => {
    // Example using shared auth
    const session = await auth.api.getSession({
        headers: c.req.raw.headers
    })
    return c.json({ session })
})

const port = 3001
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
```

**Step 4: Commit**

```bash
git add apps/api
git commit -m "feat(api): create hono api server"
```

---

### Task 5: Shared UI (Optional/Later)

For now, we focus on getting the structure and DB sharing working.
Shared UI extraction can be a follow-up task.

---
