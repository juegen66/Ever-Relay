# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Start Development Server**: `pnpm dev` (uses Next.js Turbo)
- **Build for Production**: `pnpm build`
- **Start Production Server**: `pnpm start`
- **Lint Code**: `pnpm lint`
- **Install Dependencies**: `pnpm install`

### Mastra Commands
- **Start Mastra API (Dev Server)**: `pnpm mastra:dev` (serves Mastra API on port `4111`)
- **Start Mastra Studio**: `pnpm mastra:studio` (Studio UI on port `4112`, connected to API port `4111`)
- **Startup Order**: run `pnpm mastra:dev` first, then `pnpm mastra:studio`

### Database Commands (Drizzle & PostgreSQL)
- **Generate Migrations**: `pnpm db:generate`
- **Apply Migrations**: `pnpm db:migrate`
- **Open Drizzle Studio**: `pnpm db:studio` (GUI for database management)

## Architecture

- **Framework**: Next.js 16 (App Router) with TypeScript.
- **Styling**: Tailwind CSS with `shadcn/ui` components (Radix UI).
- **Backend**: Hono server integrated into Next.js Route Handlers (`app/api/[[...route]]/route.ts`).
  - Hono handles all API requests dynamically (nodejs runtime, force-dynamic).
  - Server code resides in the `server/` directory.
  - The main Hono application is exported from `server/app.ts`.
  - API routes are organized by domains in `server/modules/` (e.g., auth, canvas, files, health, image-processing).
  - Middleware is in `server/middlewares/` (includes logging, request IDs, error handling).
- **Authentication**: `better-auth` used for auth.
- **State Management**: `zustand` for client-side state.
- **Database**: PostgreSQL with `drizzle-orm`. Migrations are in the `drizzle/` directory and schemas are in `server/db/schema.ts`.
- **Utilities**: Shared utilities in `lib/`.

## Code Style & Conventions

- **Imports**: Use `@/` alias for imports from the project root.
- **Components**: Functional components using React hooks.
- **API Responses**: Standardized JSON responses using helper functions (e.g., `fail()` from `server/lib/http/response`).
- **Types**: Strict TypeScript usage (strict mode enabled).
- **Package Manager**: `pnpm`.
