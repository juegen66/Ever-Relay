# Monorepo Migration Design
Date: 2026-02-18
Status: Approved

## Overview
Migrate the existing Next.js application to a monorepo structure using pnpm workspaces. The goal is to support multiple applications (web app, API server) and share code (database, auth, UI) effectively.

## Architecture

### Structure
```text
.
├── apps/
│   ├── web/                # Current Next.js application (moved from root)
│   └── api/                # New Hono server (Node.js)
├── packages/
│   ├── db/                 # Shared: Database setup (SQLite) & Better Auth config
│   ├── ui/                 # Shared: Shadcn UI components & Tailwind config
│   ├── config/             # Shared: TSConfig, ESLint, other shared configs
│   └── types/              # (Optional) Shared TypeScript types/interfaces
├── pnpm-workspace.yaml     # Workspace definition
└── package.json            # Root scripts
```

### Components

#### 1. Database & Authentication (`packages/db`)
- **Responsibility**: Centralize database connection and authentication logic.
- **Implementation**:
    - Move `server/modules/auth/service.ts` and database initialization logic here.
    - Export `auth`, `db`, and schema definitions.
    - Use `better-sqlite3` and `better-auth`.
    - Ensure `DATABASE_URL` or `DB_PATH` env var points to the shared SQLite file in `data/`.

#### 2. Web App (`apps/web`)
- **Responsibility**: The existing frontend application.
- **Changes**:
    - Move root files to `apps/web`.
    - Update imports to use `@repo/db` and `@repo/ui`.
    - Adjust `next.config.mjs` and `tailwind.config.ts`.

#### 3. API Server (`apps/api`)
- **Responsibility**: New standalone backend service.
- **Technology**: Hono running on Node.js.
- **Implementation**:
    - Import `@repo/db` for database access and auth verification.
    - Run on a different port (e.g., 3001).

#### 4. Shared UI (`packages/ui`)
- **Responsibility**: Shared visual components.
- **Implementation**:
    - Extract generic components (Button, Input, etc.) from `components/`.
    - Export a Tailwind preset.

## Migration Strategy
1.  **Setup**: Initialize workspace configuration.
2.  **Extract DB**: Isolate database/auth logic into `packages/db`.
3.  **Move Web**: Relocate existing app to `apps/web`.
4.  **Create API**: Scaffold `apps/api` with Hono.
5.  **Extract UI**: Move shared components to `packages/ui`.
