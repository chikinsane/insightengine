---
phase: 01-foundation
verified: 2026-03-17T08:00:00Z
status: gaps_found
score: 4/5 success criteria verified
re_verification: false
gaps:
  - truth: "clerkMiddleware protects /dashboard and /api routes; public routes remain accessible"
    status: failed
    reason: "The middleware file is located at insightengine/src/proxy.ts — a path Next.js never loads as middleware. Next.js only picks up middleware.ts at the project root (insightengine/middleware.ts) or at insightengine/src/middleware.ts. Neither path exists. All protected routes are currently unprotected at the middleware layer."
    artifacts:
      - path: "insightengine/src/proxy.ts"
        issue: "File exists with correct clerkMiddleware logic but at an unrecognized path — Next.js will never execute it"
      - path: "insightengine/middleware.ts"
        issue: "MISSING — this is the file Next.js requires for middleware to run"
    missing:
      - "Move insightengine/src/proxy.ts to insightengine/middleware.ts (project root, alongside package.json)"
      - "Alternatively, rename/move to insightengine/src/middleware.ts (the one valid src/ location Next.js recognizes)"
human_verification:
  - test: "AUTH-01 + AUTH-02: Sign-up, login, session persistence"
    expected: "User signs up with email and password via Clerk UI at /sign-in and /sign-up, reaches /dashboard, and session persists across full browser reload without re-authentication prompt"
    why_human: "Requires real Clerk keys in .env.local and a running dev server; cannot verify programmatically that Clerk UI renders correctly and session cookie behavior works"
  - test: "AUTH-03: Cross-user isolation in the browser"
    expected: "Two test users each see only their own data sources; accessing another user's data source ID returns 403 or empty state, never the other user's content"
    why_human: "Requires two live Clerk sessions and a populated Neon database; the code enforces isolation correctly but end-to-end browser verification cannot be done statically"
  - test: "Middleware gap fix verification"
    expected: "After moving middleware.ts to the project root, navigating to /dashboard in an unauthenticated browser tab should redirect to /sign-in (not render the dashboard)"
    why_human: "Requires the fix from gaps above to be applied first, then tested in a running dev server"
---

# Phase 1: Foundation Verification Report

**Phase Goal:** The security and identity layer is complete — users can authenticate, every request is scoped to the right tenant, credentials are never stored in plaintext, and no AI-generated query can execute a mutating statement.
**Verified:** 2026-03-17T08:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can sign up and log in via Clerk; session persists across reloads | ? UNCERTAIN | Code structure supports it (ClerkProvider, sign-in/sign-up pages, dashboard auth()); requires human verification with real keys |
| 2 | Two test users each see only their own data — cross-user access returns 403 | ✓ VERIFIED | `[id]/route.ts` uses `and(eq(dataSources.id, id), eq(dataSources.userId, userId))` and returns 403 when not found; `route.ts` GET filters by `eq(dataSources.userId, userId)` |
| 3 | Credential encryption round-trips: encrypt then decrypt returns original plaintext | ✓ VERIFIED | `encryption.py` implements AES-256-GCM with 12-byte urandom nonce; all 6 encryption tests pass (24/24 total) |
| 4 | DML keywords in AI-generated queries are rejected by the validation gate | ✓ VERIFIED | `query_validator.py` uses sqlglot AST walk; INSERT/UPDATE/DELETE/DROP/TRUNCATE/ALTER/CREATE all rejected; CTE-nested DML caught; 18 query validator tests pass |
| 5 | Full Neon schema (6 tables) migrated and version-controlled via Drizzle | ✓ VERIFIED | `drizzle/0000_faulty_clea.sql` contains all 6 CREATE TABLE statements with user_id FKs and FK constraints |

**Score:** 4/5 truths verified (1 uncertain — middleware placement gap, 1 requires human)

---

## Must-Have Truths (from PLAN frontmatter)

### Plan 01-01 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Next.js 16 project exists at insightengine/ with App Router structure | ✓ VERIFIED | Project directory exists with src/app/ App Router structure |
| 2 | ClerkProvider wraps the root layout and Clerk sign-in/sign-up pages render | ✓ VERIFIED | `layout.tsx` wraps `<ClerkProvider>`; sign-in and sign-up pages exist with correct imports |
| 3 | clerkMiddleware protects /dashboard and /api routes; public routes remain accessible | ✗ FAILED | `src/proxy.ts` contains correct logic but is at an unrecognized path; `middleware.ts` is MISSING from project root AND from `src/`; Next.js will never execute it |
| 4 | Drizzle schema defines all 6 tables with user_id FKs | ✓ VERIFIED | `schema.ts` has 6 `pgTable(` calls; every non-users table has `text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' })` |
| 5 | Drizzle migration generates and applies successfully against Neon | ✓ VERIFIED (partial) | Migration SQL exists and is correct; actual application against Neon confirmed in Plan 03 Summary ("Neon migration applied, all 6 tables created") |
| 6 | Dashboard page reads auth().userId and redirects unauthenticated users | ✓ VERIFIED | Both `src/app/dashboard/page.tsx` and `src/app/(dashboard)/page.tsx` call `auth()` and `redirect('/sign-in')` |

### Plan 01-02 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | encrypt_credential + decrypt_credential round-trips to original plaintext | ✓ VERIFIED | `test_round_trip_connection_string` PASSED |
| 2 | encrypt_credential produces different ciphertext on each call | ✓ VERIFIED | `test_encrypt_produces_unique_ciphertext` PASSED; `os.urandom(12)` nonce per call |
| 3 | decrypt_credential with wrong key raises an exception | ✓ VERIFIED | `test_decrypt_with_wrong_key_raises` PASSED |
| 4 | validate_query accepts pure SELECT statements | ✓ VERIFIED | 6 SELECT variants all PASSED |
| 5 | validate_query rejects INSERT, UPDATE, DELETE, DROP, TRUNCATE, ALTER, CREATE | ✓ VERIFIED | All 7 DML/DDL types tested and rejected |
| 6 | validate_query rejects DML nested inside CTEs | ✓ VERIFIED | `test_cte_with_dml` PASSED |
| 7 | validate_query rejects multi-statement inputs | ✓ VERIFIED | `test_multi_statement_rejected` PASSED |
| 8 | validate_query returns structured ValidationResult with reason on rejection | ✓ VERIFIED | `test_invalid_result_has_reason` and `test_valid_result_has_empty_reason` PASSED |

### Plan 01-03 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every data-source API endpoint includes user_id in its WHERE clause | ✓ VERIFIED | `route.ts` uses `eq(dataSources.userId, userId)`; `[id]/route.ts` uses `and(eq(dataSources.id, id), eq(dataSources.userId, userId))` |
| 2 | GET /api/data-sources returns only the authenticated user's data sources | ✓ VERIFIED | Hard-filtered by `eq(dataSources.userId, userId)` in every GET |
| 3 | GET /api/data-sources/[id] returns 403 for a different user | ✓ VERIFIED | Returns `{ error: 'Not found' }` with status 403 when combined id+userId query returns 0 results |
| 4 | Tenant helper extracts userId from Clerk and is reused | ✓ VERIFIED | `tenant.ts` exports `getAuthenticatedUserId` and `ensureUserExists`; both routes import from `@/lib/tenant` |

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `insightengine/middleware.ts` | Clerk middleware at project root | ✗ MISSING | Does not exist at project root; logic displaced to `src/proxy.ts` which Next.js ignores |
| `insightengine/src/proxy.ts` | (Actual location of middleware logic) | ✗ WRONG PATH | Contains correct `clerkMiddleware` + `createRouteMatcher` logic but at an unrecognized path |
| `insightengine/src/db/schema.ts` | All 6 Drizzle table definitions | ✓ VERIFIED | 6 `pgTable(` calls, `text('id').primaryKey()` for users, user_id FKs on all resource tables |
| `insightengine/src/db/client.ts` | Neon + Drizzle client singleton | ✓ VERIFIED | `import { neon }` from `@neondatabase/serverless`; `drizzle({ client: sql, schema })` |
| `insightengine/src/app/layout.tsx` | Root layout with ClerkProvider | ✓ VERIFIED | Wraps `<ClerkProvider>` |
| `insightengine/src/lib/tenant.ts` | Tenant-scoped auth helper | ✓ VERIFIED | Exports `getAuthenticatedUserId` and `ensureUserExists` |
| `insightengine/src/app/api/data-sources/route.ts` | Data sources list with tenant filter | ✓ VERIFIED | Contains `eq(dataSources.userId, userId)` |
| `insightengine/src/app/api/data-sources/[id]/route.ts` | Single data source with dual filter | ✓ VERIFIED | Contains `and(eq(dataSources.id, id), eq(dataSources.userId, userId))` |
| `backend/app/security/encryption.py` | AES-256-GCM envelope encryption | ✓ VERIFIED | AESGCM, `os.urandom(12)` nonce, env-var key, correct base64 envelope |
| `backend/app/security/query_validator.py` | AST-level DML validation gate | ✓ VERIFIED | sqlglot.parse, isinstance(statement, exp.Select), full AST walk for FORBIDDEN_NODE_TYPES |
| `backend/tests/unit/test_encryption.py` | Encryption round-trip and edge tests | ✓ VERIFIED | 6 tests, all PASSED |
| `backend/tests/unit/test_query_validator.py` | Query validator unit tests | ✓ VERIFIED | 18 tests, all PASSED |
| `insightengine/drizzle/0000_faulty_clea.sql` | Migration SQL with all 6 tables | ✓ VERIFIED | All 6 CREATE TABLE + all FK constraints present |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `insightengine/src/proxy.ts` | `@clerk/nextjs/server` | clerkMiddleware import | ✓ WIRED (in file) | Import present but file never executed by Next.js |
| `insightengine/middleware.ts` | `@clerk/nextjs/server` | clerkMiddleware import | ✗ NOT_WIRED | File does not exist; middleware is dead |
| `insightengine/src/db/client.ts` | `@neondatabase/serverless` | neon driver import | ✓ WIRED | `import { neon } from '@neondatabase/serverless'` present |
| `insightengine/src/db/index.ts` | `./client` + `./schema` | re-export | ✓ WIRED | `export { db } from './client'` and `export * from './schema'` |
| `insightengine/src/app/api/data-sources/route.ts` | `insightengine/src/db/schema.ts` | dataSources import | ✓ WIRED | `import { dataSources } from '@/db/schema'` present |
| `insightengine/src/app/api/data-sources/route.ts` | `insightengine/src/lib/tenant.ts` | getAuthenticatedUserId | ✓ WIRED | Import and usage both present |
| `insightengine/src/app/api/data-sources/[id]/route.ts` | drizzle-orm | `and(eq(...))` operators | ✓ WIRED | `import { eq, and } from 'drizzle-orm'` and `and(eq(dataSources.id, id), eq(dataSources.userId, userId))` present |
| `backend/app/security/encryption.py` | `CREDENTIAL_ENCRYPTION_KEY` env var | `os.environ.get` | ✓ WIRED | `os.environ.get("CREDENTIAL_ENCRYPTION_KEY", "")` present |
| `backend/app/security/query_validator.py` | sqlglot | AST parsing | ✓ WIRED | `sqlglot.parse(sql)` and `statement.walk()` present |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUTH-01 | 01-01-PLAN | Sign up and log in with email + password | ? NEEDS HUMAN | ClerkProvider, sign-in/sign-up pages, and middleware logic all present; runtime behavior requires human verification |
| AUTH-02 | 01-01-PLAN | Sessions persist across reloads | ? NEEDS HUMAN | Clerk session persistence is handled by Clerk SDK; requires browser verification to confirm |
| AUTH-03 | 01-01-PLAN, 01-03-PLAN | Per-user data and dashboard isolation (multi-tenant) | ✓ SATISFIED | user_id FKs in schema; `and(eq(dataSources.id, id), eq(dataSources.userId, userId))` in API; 403 on cross-user access |
| NLQ-03 | 01-02-PLAN | AST-level DML filter on all AI-generated queries | ✓ SATISFIED | `validate_query` rejects all DML/DDL including TRUNCATE, CTE-nested DML, multi-statement; 18/18 tests pass |
| DS-03 | 01-02-PLAN | Envelope encryption for database credentials | ✓ SATISFIED | AES-256-GCM with fresh nonce per call; wrong key raises; missing key raises RuntimeError; 6/6 tests pass |

**Note:** AUTH-01 and AUTH-02 also have a hard dependency on the middleware gap being closed — without `middleware.ts` at the project root, unauthenticated users are not redirected to sign-in at the middleware layer (though the dashboard page itself does a fallback auth() check).

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `insightengine/src/proxy.ts` | 1-21 | Correct middleware logic at wrong path — `src/proxy.ts` instead of `middleware.ts` at project root | Blocker | Next.js never executes this file; all route protection is dead at the middleware layer |
| `insightengine/src/app/(dashboard)/page.tsx` | 1-14 | Route group `(dashboard)` resolves to `/` not `/dashboard` | Warning | The Plan 03 Summary notes this was fixed by adding `src/app/dashboard/page.tsx`; both files now exist and both do auth() checks — no route conflict since route groups don't affect URL path |
| `insightengine/src/lib/tenant.ts` | 27 | `email: \`${userId}@placeholder.local\`` placeholder email on user creation | Info | Noted in SUMMARY as a deliberate decision ("Will be updated on profile sync"); not a security issue but will require a sync mechanism in a future phase |

---

## Human Verification Required

### 1. Sign-up and Login Flow (AUTH-01)

**Test:** With real Clerk API keys in `.env.local`, start the dev server (`npm run dev`), navigate to `http://localhost:3000`. Sign up with a new test email and password.
**Expected:** Redirected to `/sign-in` on landing; after sign-up, redirected to `/dashboard` showing "Welcome, user user_2xxx..."
**Why human:** Requires live Clerk API keys and a running dev server; Clerk UI rendering cannot be verified statically.

### 2. Session Persistence (AUTH-02)

**Test:** After signing in, reload the browser tab (F5). Inspect DevTools > Application > Cookies for `__session` cookie.
**Expected:** Still on `/dashboard` without being redirected to sign-in; `__session` HttpOnly cookie present.
**Why human:** Session cookie behavior requires a running browser; cannot verify programmatically.

### 3. Cross-User Data Isolation (AUTH-03 end-to-end)

**Test:** Sign up as User A, create a data source (POST `/api/data-sources`). Note its UUID. Sign in as User B in an incognito window. Try `GET /api/data-sources/{uuid}`.
**Expected:** Returns 403 — User B cannot see User A's data source.
**Why human:** Requires two live Clerk sessions and a populated Neon database.

### 4. Middleware Fix Verification (after closing gap)

**Test:** After moving `src/proxy.ts` to project root as `middleware.ts`, open an incognito window and navigate to `http://localhost:3000/dashboard`.
**Expected:** Immediately redirected to `/sign-in` by the Clerk middleware (not by the page-level auth() fallback).
**Why human:** Requires the middleware gap fix to be applied first, then tested in a running server.

---

## Gaps Summary

One gap blocks the phase goal claim that "every request is scoped to the right tenant."

**Root cause:** The 01-03-SUMMARY.md notes that `middleware.ts` was renamed to `proxy.ts` as a "Next.js 16 renamed convention" fix. This is incorrect — Next.js has no `proxy.ts` convention. The actual fix documented was moving from `(dashboard)/page.tsx` to `dashboard/page.tsx` (route group resolution). The middleware file appears to have been moved to `src/proxy.ts` rather than kept or moved to `insightengine/middleware.ts` (project root) or `insightengine/src/middleware.ts` (the two locations Next.js recognizes).

**Practical impact:** Without the middleware, unauthenticated users are NOT redirected at the edge. The `/dashboard` page itself calls `auth()` and redirects, providing a fallback. However, `/api/data-sources`, `/api/dashboards`, and `/api/queries` routes have NO middleware protection — they rely entirely on `getAuthenticatedUserId()` throwing inside each handler. This is still functionally secure (handlers return 401), but the stated goal of middleware-level protection is not met.

**Fix required:** Move `insightengine/src/proxy.ts` to `insightengine/middleware.ts` (project root, same level as `package.json`). The file content is correct — only the path is wrong.

---

_Verified: 2026-03-17T08:00:00Z_
_Verifier: Claude (gsd-verifier)_
