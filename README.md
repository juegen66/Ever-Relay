# EverRelay

EverRelay is a browser-based agent workspace built around a desktop shell, scoped copilots, workflow orchestration, and an Agentic File System (AFS).

This README is intentionally repository-focused. For the product overview and external-facing introduction, visit **https://www.everrelay.com**.

## Overview

This repository contains the main EverRelay application prototype and research implementation. In practical terms, it includes:

- A browser-based desktop UI built with Next.js
- A Hono API layer mounted through Next.js route handlers
- A Mastra-based multi-agent runtime for desktop, logo, coding, canvas, and third-party app flows
- AFS as a shared memory/history/skill substrate for agents
- Inngest-backed workflow orchestration for long-running jobs
- Third-party app and MCP integration experiments
- Thesis drafts, architecture notes, and supporting writeups in `article/`

## What's In This Repo

- `fronted/`
  The main web application. This is the repo's actual frontend app directory name.
- `server/`
  Hono routes, domain services, Mastra agents, tools, workflows, and backend logic.
- `shared/`
  Shared contracts and cross-runtime types used by frontend and backend code.
- `drizzle/`
  SQL migrations and schema evolution history.
- `article/`
  Research notes, thesis drafts, architecture diagrams, and long-form technical writing.
- `docs/`
  Internal planning docs and implementation specs.
- `scripts/`
  Utility scripts for article assembly and seed data setup.

## Architecture At A Glance

```text
Browser UI (Next.js in fronted/)
  -> Next.js route handler: fronted/app/api/[[...route]]/route.ts
  -> Hono server: server/app.ts
  -> Domain modules: auth, files, builds, canvas, copilot, third-party, AFS
  -> Mastra agents + workflows
  -> PostgreSQL via Drizzle
  -> Optional external services: Inngest, E2B, AWS, embedding providers, third-party MCP
```

Key architectural ideas in this repo:

- **Scoped agents**: separate agents for desktop, logo, canvas, coding, prediction, and third-party app contexts
- **AFS**: a path-based context layer for `Memory`, `History`, and `Skill`
- **Runtime handoff**: agent-to-agent context switching without reducing everything to one global assistant
- **Hybrid execution model**: interactive copilot flows plus background workflow orchestration
- **Third-party extensibility**: iframe-hosted app surfaces on the frontend and MCP-backed tools on the backend

## Tech Stack

| Layer | Main tools |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Radix UI, CopilotKit |
| Backend | Hono, Mastra, Zod |
| Data | PostgreSQL, Drizzle ORM |
| Workflows | Inngest |
| Agent infra | Mastra agents, dynamic skills, AFS, optional E2B workspaces |
| Integrations | Better Auth, AWS S3/SES, third-party MCP servers |

## Quickstart

### Prerequisites

- A recent Node.js LTS release
- `pnpm`
- PostgreSQL

### Minimum Environment

This repo does not currently ship a committed `.env.example`. At minimum, set:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-this-with-a-secure-secret-at-least-32-characters
```

Optional integrations can be enabled later:

- Google auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`
- AFS embeddings: `AFS_EMBEDDING_API_KEY`, `AFS_EMBEDDING_BASE_URL`, `AFS_EMBEDDING_MODEL`, `AFS_EMBEDDING_DIMENSIONS`
- Inngest: `INNGEST_DEV_URL`, `INNGEST_EVENT_KEY`
- AWS storage/email: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `AWS_SES_DEFAULT_FROM`, related region settings
- Image processing: `REMOVE_BG_API_KEY`
- Third-party MCP local development: `THIRD_PARTY_MCP_ALLOW_LOCALHOST=true`

### Install Dependencies

```bash
pnpm install
```

### Run Database Migrations

```bash
pnpm db:migrate
```

### Start The Web App

```bash
pnpm dev
```

The web app serves the desktop shell and mounts the Hono API through Next.js route handlers.

### Optional Development Processes

Run these when you need agent/workflow-specific local debugging:

```bash
pnpm mastra:dev
pnpm mastra:studio
pnpm inngest:dev
```

Notes:

- `pnpm mastra:dev` and `pnpm mastra:studio` are useful for Mastra runtime inspection and Studio workflows.
- `pnpm inngest:dev` is useful when testing event-driven workflows locally.
- Some features degrade gracefully without optional services, but workflow-heavy or integration-heavy flows will not be fully functional.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js app in development mode |
| `pnpm build` | Build the production app |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint for the frontend app |
| `pnpm test` | Run the Vitest suite |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm test:integration` | Run integration tests |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm mastra:dev` | Run the Mastra dev server |
| `pnpm mastra:studio` | Run Mastra Studio |
| `pnpm inngest:dev` | Run Inngest locally |
| `pnpm article:assemble` | Assemble markdown content under `article/` |

## Project Structure

```text
fronted/
  app/                  Next.js App Router entrypoints and route handlers
  features/             Desktop copilot, app-specific UI logic, tool mounts
  lib/                  Client utilities, stores, service wrappers

server/
  app.ts                Hono app registration
  modules/              Domain HTTP modules and controllers
  mastra/               Agents, tools, workflows, workspace setup
  afs/                  AFS core logic and skill loading
  db/                   Database schema definitions

shared/
  contracts/            Shared API contracts
  copilot/              Cross-runtime copilot constants and payloads

drizzle/
  *.sql                 Migration history

article/
  BOK1/                 Long-form architecture and system writeups
  11-submit-draft/      Thesis draft chapters and figures
```

## Related Writing

If you want the deeper system context behind this repo, start in `article/`. It contains:

- architecture essays on AFS, agent handoff, and third-party plugin design
- thesis draft chapters and generated figures
- product/system reasoning that is intentionally more detailed than this README

## Official Website

Full product introduction: **https://www.everrelay.com**
