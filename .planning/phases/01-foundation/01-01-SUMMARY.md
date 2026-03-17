---
phase: 01-foundation
plan: 01
subsystem: auth
tags: [clerk, nextjs, drizzle, neon, postgresql, typescript, tailwind]

# Dependency graph
requires: []
provides:
  - Next.js 16 App Router project at insightengine/ with TypeScript and Tailwind
  - Clerk authentication with ClerkProvider, sign-in, sign-up pages, and clerkMiddleware
  - Protected /dashboard route with server-side auth() userId extraction
  - Drizzle ORM schema with 6 tables (users, data_sources, datasets, dashboards, queries, results_cache)
  - Neon+Drizzle client singleton using @neondatabase/serverless HTTP driver
  - Generated SQL migration file ready for application against Neon
affects: [02-data-ingestion, 03-nl-queries, 04-dashboards, 05-encryption, 06-deployment]

# Tech tracking
tech-stack:
  added:
    - "@clerk/nextjs 7.0.4 — Clerk auth React components and server SDK"
    - "drizzle-orm 0.45.1 — TypeScript-first ORM"
    - "drizzle-kit 0.31.9 — Migration CLI"
    - "@neondatabase/serverless 1.0.2 — Neon HTTP driver for serverless"
    - "dotenv — env var loading for drizzle.config.ts"
    - "Next.js 16.1.7 — App Router frontend framework"
    - "Tailwind CSS v4 — utility-first styling"
  patterns:
    - "clerkMiddleware with createRouteMatcher for explicit route protection (public by default)"
    - "ClerkProvider wrapping root layout for client-side auth context"
    - "Server-side auth() from @clerk/nextjs/server for userId extraction in server components"
    - "text('id').primaryKey() for users table to hold Clerk string IDs"
    - "user_id FK with cascade delete on every resource table for multi-tenant isolation"
    - "Drizzle neon-http driver with drizzle({ client: sql, schema }) initialization"

key-files:
  created:
    - insightengine/middleware.ts
    - insightengine/src/app/layout.tsx
    - insightengine/src/app/page.tsx
    - insightengine/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
    - insightengine/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
    - insightengine/src/app/(dashboard)/page.tsx
    - insightengine/src/db/schema.ts
    - insightengine/src/db/client.ts
    - insightengine/src/db/index.ts
    - insightengine/drizzle.config.ts
    - insightengine/drizzle/0000_faulty_clea.sql
    - insightengine/.env.local
  modified: []

key-decisions:
  - "Placed middleware.ts at project root (not src/) — Next.js requires this location; inside src/ it silently fails to run"
  - "Used text('id').primaryKey() for users table — Clerk IDs are opaque strings like user_2abc..., not UUIDs"
  - "Installed dotenv package for drizzle.config.ts — drizzle-kit requires explicit dotenv/config import to read .env.local"
  - "DATABASE_URL kept as placeholder in .env.local — drizzle-kit migrate NOT run; migration SQL is version-controlled and ready for user to apply with real Neon connection string"

patterns-established:
  - "Pattern: Always import auth(), clerkMiddleware() from @clerk/nextjs/server (not @clerk/nextjs) for server-side code"
  - "Pattern: Every resource table query must include WHERE user_id = userId alongside resource ID for tenant isolation"
  - "Pattern: drizzle-kit generate + migrate workflow (never push in production)"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 4min
completed: 2026-03-17
---

# Phase 1 Plan 1: InsightEngine Auth and Database Foundation Summary

**Next.js 16 + Clerk auth (provider, middleware, sign-in/sign-up pages) with Drizzle + Neon schema defining 6 multi-tenant tables and generated migration SQL**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T06:30:36Z
- **Completed:** 2026-03-17T06:34:47Z
- **Tasks:** 2
- **Files modified:** 22

## Accomplishments

- Next.js 16.1.7 project scaffolded with App Router, TypeScript, Tailwind v4, and all Clerk/Drizzle dependencies installed
- Clerk authentication structurally complete: ClerkProvider in root layout, sign-in/sign-up catch-all pages, clerkMiddleware protecting /dashboard and /api routes
- All 6 Drizzle tables defined with user_id FK cascade-delete relationships establishing multi-tenant isolation boundary
- Migration SQL generated and version-controlled; ready to apply when user provides Neon connection string

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 16 project with Clerk auth integration** - `18e6c83` (feat)
2. **Task 2: Define Drizzle schema and run migration against Neon** - `b7fb78d` (feat)

## Files Created/Modified

- `insightengine/middleware.ts` - Clerk middleware protecting /dashboard and /api routes via createRouteMatcher
- `insightengine/src/app/layout.tsx` - Root layout with ClerkProvider wrapping
- `insightengine/src/app/page.tsx` - Root page redirecting to /dashboard
- `insightengine/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` - Clerk SignIn component catch-all
- `insightengine/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` - Clerk SignUp component catch-all
- `insightengine/src/app/(dashboard)/page.tsx` - Protected dashboard with server-side auth() userId extraction
- `insightengine/src/db/schema.ts` - All 6 Drizzle table definitions with user_id FKs
- `insightengine/src/db/client.ts` - Neon HTTP + Drizzle client singleton
- `insightengine/src/db/index.ts` - Re-exports db and all schema tables
- `insightengine/drizzle.config.ts` - Drizzle Kit config pointing to schema and Neon URL
- `insightengine/drizzle/0000_faulty_clea.sql` - Generated migration SQL with all 6 CREATE TABLE statements
- `insightengine/.env.local` - Placeholder env vars for Clerk keys and DATABASE_URL

## Decisions Made

- **middleware.ts at project root** — Next.js only picks up middleware at the same level as package.json; placing it inside src/ causes all routes to remain unprotected silently. Verified placement per research Pitfall 1.
- **text('id').primaryKey() for users** — Clerk user IDs are opaque strings (e.g., `user_2abc...`), not UUIDs. Using `uuid()` type would cause type errors and DB insert failures.
- **Installed dotenv separately** — drizzle-kit requires `import 'dotenv/config'` in drizzle.config.ts; this requires the `dotenv` npm package which isn't bundled with Next.js.
- **Migration SQL generated but not applied** — DATABASE_URL is a placeholder; actual migration must run when user sets up their Neon project and provides a real connection string.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing dotenv dependency**
- **Found during:** Task 2 (Drizzle schema and migration)
- **Issue:** `drizzle.config.ts` imports `dotenv/config` but the `dotenv` package was not listed as a dependency; `npx drizzle-kit generate` failed with "Cannot find module 'dotenv/config'"
- **Fix:** Ran `npm install dotenv` inside insightengine/
- **Files modified:** insightengine/package.json, insightengine/package-lock.json
- **Verification:** `npx drizzle-kit generate` succeeded and generated the migration SQL
- **Committed in:** b7fb78d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency)
**Impact on plan:** Auto-fix necessary for drizzle-kit to run. No scope creep.

## Issues Encountered

None beyond the dotenv blocking issue documented above.

## User Setup Required

Before running the application, the following environment variables must be set in `insightengine/.env.local`:

1. **Clerk keys** — Create a Clerk application at https://clerk.com, then set:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — from Clerk dashboard API Keys section
   - `CLERK_SECRET_KEY` — from Clerk dashboard API Keys section

2. **Neon database** — Create a Neon project at https://neon.tech, then:
   - Set `DATABASE_URL` to the Neon connection string
   - Run `cd insightengine && npx drizzle-kit migrate` to apply the generated migration SQL

## Next Phase Readiness

- Next.js 16 project structure is in place; Phase 2 (file upload / data ingestion) can add routes under `src/app/(dashboard)/` immediately
- Drizzle schema and client are ready; Phase 2 can import `{ db, dataSources, datasets }` from `@/db` to write data
- Auth middleware is active; all new API routes under `/api/data-sources`, `/api/dashboards`, `/api/queries` are automatically protected
- Blockers: User must provide Clerk keys and Neon connection string before the app can run end-to-end; migration must be applied before any DB writes succeed

---
*Phase: 01-foundation*
*Completed: 2026-03-17*

## Self-Check: PASSED

All 8 key files confirmed present. Both task commits (18e6c83, b7fb78d) confirmed in git log.
