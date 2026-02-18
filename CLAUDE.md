# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Start Development Server**: `pnpm dev` (uses Turbo)
- **Build**: `pnpm build`
- **Start Production Server**: `pnpm start`
- **Lint**: `pnpm lint`
- **Install Dependencies**: `pnpm install`

## Architecture

- **Framework**: Next.js 16 (App Router) with TypeScript.
- **Styling**: Tailwind CSS with `shadcn/ui` components (Radix UI).
- **Backend**: Hono server integrated into Next.js Route Handlers (`app/api/[[...route]]/route.ts`).
  - Server code resides in the `server/` directory.
  - API routes are defined in `server/modules/`.
  - Middleware is in `server/middlewares/`.
- **Authentication**: `better-auth` used for auth.
  - Server configuration: `server/modules/auth/service.ts` (exposed via `lib/auth.ts`).
  - Client client: `lib/auth-client.ts`.
- **State Management**: `zustand` for client-side state.
- **Database**: `better-sqlite3` (implied by dependencies).
- **Utilities**: Shared utilities in `lib/`.

## Code Style & Conventions

- **Imports**: Use `@/` alias for imports from the project root.
- **Components**: Functional components using React hooks.
- **API**: Uses Hono for API logic instead of standard Next.js API routes.
- **Types**: strict TypeScript usage (strict mode enabled).
- **Package Manager**: `pnpm`.
