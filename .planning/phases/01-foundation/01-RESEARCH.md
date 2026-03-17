# Phase 1: Foundation - Research

**Researched:** 2026-03-17
**Domain:** Auth (Clerk), Neon DB schema (Drizzle), envelope encryption (AES-256-GCM), multi-tenant isolation, AST-level query validation gate
**Confidence:** HIGH (stack confirmed from npm registry + official docs; cryptography pattern from live WebSearch)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up and log in with email + password | Clerk `@clerk/nextjs` v7.0.4 handles this with `<SignIn>` component and `clerkMiddleware()` |
| AUTH-02 | Sessions persist across reloads | Clerk manages session persistence via HttpOnly cookies + JWT; no custom session code needed |
| AUTH-03 | Per-user data and dashboard isolation (multi-tenant, 2-10 users) | Drizzle schema with `user_id` FK on every resource table + row-level WHERE filter pattern |
| NLQ-03 | All AI-generated queries pass through AST-level DML filter before execution | `sqlglot` (Python) AST node check for `exp.Select` — rejects anything containing DML keywords |
| DS-03 | Database credentials stored with envelope encryption — never plaintext | `cryptography` v47.0.0 `AESGCM` class, 256-bit key from env var, nonce+ciphertext stored as blob |

</phase_requirements>

---

## Summary

Phase 1 establishes the security and identity foundations that cannot be retrofitted. The three hardest pieces are (1) Clerk integration with a Next.js 16 App Router, (2) the Drizzle + Neon schema migration that every subsequent phase reads from, and (3) two non-negotiable security primitives: envelope encryption for credentials and an AST-level query validation gate.

Clerk v7.0.4 integrates via `clerkMiddleware()` in `middleware.ts` and `<ClerkProvider>` wrapping the root layout. All routes are public by default — route protection must be explicitly opted into via `auth().protect()` in server components or `createRouteMatcher` in middleware. The `@clerk/nextjs/server` import (not `@clerk/nextjs`) is required for all server-side auth calls.

The Drizzle + Neon setup is straightforward: install `drizzle-orm @neondatabase/serverless`, define schema using `pgTable()`, run `npx drizzle-kit generate && npx drizzle-kit migrate`. The schema must include all six Phase 1 tables (users, data_sources, datasets, dashboards, queries, results_cache) with `user_id` foreign keys enforcing per-user isolation. The query validation gate should use `sqlglot` rather than `sqlparse` — sqlglot provides a full AST and explicit `exp.Select` node check, making it impossible for nested DML in CTEs or subqueries to bypass the filter.

**Primary recommendation:** Build in this strict order — Clerk auth → Drizzle schema migration → encryption utility → DML validation gate. Do not build any endpoint that touches user data before auth middleware is confirmed working. The DML filter must be a standalone Python function unit-tested before the query pipeline references it.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@clerk/nextjs` | 7.0.4 | Clerk React components + client hooks | Official Next.js SDK; provides `<ClerkProvider>`, `<SignIn>`, `useAuth()` |
| `@clerk/nextjs/server` | 7.0.4 (same pkg) | Server-side auth — `auth()`, `clerkMiddleware()` | Required for App Router route handlers and server components |
| `drizzle-orm` | 0.45.1 | TypeScript-first ORM, query builder | Pure TS, no binary engine, works in Vercel Edge/serverless |
| `drizzle-kit` | 0.31.9 | CLI for schema migrations (`generate`, `migrate`, `push`) | Companion CLI to drizzle-orm; generates SQL diffs |
| `@neondatabase/serverless` | 1.0.2 | Neon HTTP/WebSocket driver for Next.js | Serverless-safe; no persistent TCP connection |
| `cryptography` (Python) | 47.0.0 | AES-256-GCM envelope encryption | PyCA standard; `AESGCM` class with authenticated encryption |
| `sqlglot` (Python) | latest | SQL AST parser for DML validation gate | Full AST (not just token-level); `exp.Select` check survives nested CTEs |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `python-dotenv` | 1.x | Load env vars in FastAPI dev | Local dev only; prod uses Render env vars |
| `zod` | 3.x | Validate request body shapes in Next.js API routes | Any POST endpoint receiving user input |
| `dotenv` (Node) | auto via Next.js | Load `.env.local` in Next.js | Built-in; no explicit install needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `sqlglot` | `sqlparse` | sqlparse is token-level only; fails on nested DML in CTEs; sqlglot provides full AST |
| Clerk | Auth.js v5 | Auth.js requires manual session/DB adapter/provider wiring; 2-3 week build vs 30 min with Clerk |
| Drizzle | Prisma | Prisma binary engine (~40MB) conflicts with Vercel Edge; cold start penalty; overkill for 6 tables |
| `cryptography` (AESGCM) | `PyCryptodome` | Both viable; PyCA `cryptography` is the more widely adopted production choice in 2025 |

**Installation:**

```bash
# Next.js frontend
npm install @clerk/nextjs drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# FastAPI backend
pip install cryptography sqlglot python-dotenv
```

**Version verification (confirmed 2026-03-17):**
```
@clerk/nextjs       — 7.0.4  (npm registry)
drizzle-orm         — 0.45.1 (npm registry)
drizzle-kit         — 0.31.9 (npm registry)
@neondatabase/serverless — 1.0.2 (npm registry)
cryptography (PyCA) — 47.0.0 (confirmed via WebSearch, cryptography.io docs)
sqlglot             — latest available via pip (version pinned at install time)
```

---

## Architecture Patterns

### Recommended Project Structure

```
insightengine/                  ← Next.js frontend root
├── src/
│   ├── app/
│   │   ├── layout.tsx          ← ClerkProvider wraps entire app here
│   │   ├── (auth)/
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   └── (dashboard)/
│   │       └── page.tsx        ← Protected; reads auth() server-side
│   ├── db/
│   │   ├── schema.ts           ← All Drizzle table definitions
│   │   ├── client.ts           ← Neon + Drizzle client singleton
│   │   └── index.ts            ← Re-exports db + schema
│   └── middleware.ts            ← clerkMiddleware() — project root level
├── drizzle/                    ← Generated SQL migration files
├── drizzle.config.ts
└── .env.local

backend/                        ← FastAPI Python service
├── app/
│   ├── main.py
│   ├── security/
│   │   ├── encryption.py       ← AES-256-GCM envelope utility
│   │   └── query_validator.py  ← AST-level DML filter (sqlglot)
│   └── routers/
│       └── data_sources.py
```

### Pattern 1: Clerk Middleware (clerkMiddleware)

**What:** `middleware.ts` at the Next.js project root wraps all requests with Clerk auth. Routes are public by default — explicit protection is required.

**When to use:** All Next.js App Router projects using Clerk. Must be in project root, not inside `src/`.

```typescript
// middleware.ts  (project root — NOT src/middleware.ts)
// Source: https://clerk.com/docs/reference/nextjs/clerk-middleware
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/data-sources(.*)',
  '/api/dashboards(.*)',
  '/api/queries(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

### Pattern 2: Clerk Provider + Sign-In/Sign-Up Pages

**What:** Root layout wraps everything in `<ClerkProvider>`. Catch-all routes serve Clerk's pre-built UI.

```typescript
// src/app/layout.tsx
// Source: https://clerk.com/docs/nextjs/getting-started/quickstart
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

```typescript
// src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'
export default function SignInPage() {
  return <SignIn />
}
```

### Pattern 3: Server-Side Auth + User ID Extraction

**What:** In server components and route handlers, use `auth()` from `@clerk/nextjs/server` to get the current user ID. This ID is the tenant key for all DB queries.

```typescript
// src/app/(dashboard)/page.tsx (Server Component)
// Source: https://clerk.com/docs/reference/nextjs/app-router/auth
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // userId is the tenant key for all DB reads
  const dataSources = await db
    .select()
    .from(dataSourcesTable)
    .where(eq(dataSourcesTable.userId, userId))

  return <Dashboard dataSources={dataSources} />
}
```

### Pattern 4: Drizzle Schema — All Phase 1 Tables

**What:** Define all six schema tables in `src/db/schema.ts`. Every resource table has `user_id` as a non-nullable foreign key.

```typescript
// src/db/schema.ts
// Source: https://orm.drizzle.team/docs/get-started/neon-new
import { pgTable, text, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),           // Clerk userId (e.g., "user_2abc...")
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const dataSources = pgTable('data_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),          // 'file' | 'database'
  encryptedCredential: text('encrypted_credential'), // AES-256-GCM blob; NULL for file sources
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const datasets = pgTable('datasets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dataSourceId: uuid('data_source_id').notNull().references(() => dataSources.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  schema: jsonb('schema'),               // Inferred column definitions
  rowCount: text('row_count'),
  storageKey: text('storage_key'),       // Vercel Blob key for uploaded files
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const dashboards = pgTable('dashboards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  shareToken: text('share_token').unique(),
  isShared: boolean('is_shared').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const queries = pgTable('queries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  datasetId: uuid('dataset_id').notNull().references(() => datasets.id, { onDelete: 'cascade' }),
  naturalLanguage: text('natural_language').notNull(),
  generatedSql: text('generated_sql'),
  vizType: text('viz_type'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const resultsCache = pgTable('results_cache', {
  id: uuid('id').defaultRandom().primaryKey(),
  queryId: uuid('query_id').notNull().references(() => queries.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  resultJson: jsonb('result_json').notNull(),
  cachedAt: timestamp('cached_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
})
```

### Pattern 5: Neon Client + Drizzle Initialization

```typescript
// src/db/client.ts
// Source: https://neon.com/docs/guides/drizzle
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle({ client: sql, schema })
```

```typescript
// drizzle.config.ts
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

### Pattern 6: AES-256-GCM Envelope Encryption (Python)

**What:** Encrypt a connection string before storing. Decrypt only in memory at query time — never write plaintext to DB or logs.

```python
# backend/app/security/encryption.py
# Source: https://cryptography.io/en/latest/hazmat/primitives/aead/
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# CREDENTIAL_KEY must be a 32-byte (256-bit) base64-encoded env var
# Generate once: base64.b64encode(os.urandom(32)).decode()

def _get_key() -> bytes:
    raw = os.environ.get("CREDENTIAL_ENCRYPTION_KEY", "")
    if not raw:
        raise RuntimeError("CREDENTIAL_ENCRYPTION_KEY env var is not set")
    return base64.b64decode(raw)

def encrypt_credential(plaintext: str) -> str:
    """Returns base64(nonce + ciphertext) suitable for DB storage."""
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)          # 96-bit nonce — required per GCM spec
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ciphertext).decode()

def decrypt_credential(blob: str) -> str:
    """Decrypts a blob produced by encrypt_credential. Raises on tamper."""
    key = _get_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(blob)
    nonce, ciphertext = raw[:12], raw[12:]
    return aesgcm.decrypt(nonce, ciphertext, None).decode()
```

### Pattern 7: AST-Level DML Validation Gate (Python — sqlglot)

**What:** Parse every AI-generated query through sqlglot's full AST before execution. Reject anything that is not a top-level SELECT.

```python
# backend/app/security/query_validator.py
import sqlglot
import sqlglot.expressions as exp
from dataclasses import dataclass

FORBIDDEN_NODE_TYPES = (
    exp.Insert, exp.Update, exp.Delete, exp.Drop,
    exp.Create, exp.Alter, exp.Truncate,
)

@dataclass
class ValidationResult:
    valid: bool
    reason: str = ""

def validate_query(sql: str) -> ValidationResult:
    """
    Returns ValidationResult(valid=True) only if sql is a pure SELECT statement.
    Rejects DDL, DML, and multi-statement inputs.
    """
    try:
        statements = sqlglot.parse(sql)
    except sqlglot.errors.ParseError as e:
        return ValidationResult(valid=False, reason=f"SQL parse error: {e}")

    if len(statements) != 1:
        return ValidationResult(
            valid=False,
            reason=f"Multi-statement queries are not allowed (got {len(statements)} statements)"
        )

    statement = statements[0]

    # Must be a SELECT at the top level
    if not isinstance(statement, exp.Select):
        return ValidationResult(
            valid=False,
            reason=f"Only SELECT statements are permitted; got {type(statement).__name__}"
        )

    # Walk the full AST — reject if any DML/DDL node appears anywhere (e.g., in a CTE)
    for node in statement.walk():
        if isinstance(node, FORBIDDEN_NODE_TYPES):
            return ValidationResult(
                valid=False,
                reason=f"Query contains forbidden operation: {type(node).__name__}"
            )

    return ValidationResult(valid=True)
```

### Anti-Patterns to Avoid

- **Using regex alone for DML detection:** Regex (`\bDROP\b`) can be bypassed by SQL comments (`DR/**/OP`), case variants, or DML nested inside a CTE. Use sqlglot AST walking, not regex, as the primary gate. (Regex can be a quick pre-check but never the sole check.)
- **Importing from `@clerk/nextjs` on the server:** Always use `@clerk/nextjs/server` for `auth()`, `clerkMiddleware()`, and `currentUser()` in server components and API routes. The wrong import silently returns undefined and breaks protection.
- **Storing Clerk `userId` as the primary key in the `users` table using `uuid()`:** Clerk's user IDs are strings like `"user_2abc..."`. Use `text('id').primaryKey()` not `uuid()`.
- **Running `drizzle-kit push` in production:** `push` skips migration file generation and applies schema changes directly. Use `generate` + `migrate` in any shared or production environment.
- **Logging decrypted credentials:** After `decrypt_credential()`, never pass the result to a logger. Python f-strings in error messages are a common accidental leak vector.
- **Not upgrading Next.js past 14.2.24:** CVE-2025-29927 (CVSS 9.1) allows middleware bypass by spoofing the `x-middleware-subrequest` header. Start on Next.js 16.1.7 (confirmed current) — not affected. Confirm the version in `package.json` before trusting middleware auth.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email/password auth + session persistence | Custom JWT + bcrypt + session middleware | Clerk (`@clerk/nextjs`) | Password reset, email verification, social login, CSRF protection, httpOnly cookie management all handled; 2-3 week build otherwise |
| SQL query parsing / validation | Regex matching on SQL strings | `sqlglot` AST walker | Regex fails on comments, case variants, nested DML in CTEs; sqlglot is a complete parser |
| AES-GCM nonce management | Custom crypto implementation | `cryptography.AESGCM` | GCM nonce uniqueness is a hard correctness requirement; PyCA handles this correctly; hand-rolled code almost always has nonce reuse bugs |
| Database migrations | Raw SQL files committed to git | Drizzle Kit (`drizzle-kit generate` + `migrate`) | Auto-diff, rollback support, type-safe schema, migration history |
| Multi-tenant row filtering | Global DB middleware / proxy | Explicit `WHERE user_id = ?` in every query with Drizzle's type-safe `eq()` | Middleware approaches miss edge cases; explicit per-query filter is auditable and testable |

**Key insight:** The auth and encryption layers are not differentiating product work. They are existential infrastructure. Using battle-tested libraries (Clerk, PyCA cryptography) eliminates entire vulnerability classes and lets Phase 1 be completed in days, not weeks.

---

## Common Pitfalls

### Pitfall 1: Clerk Middleware in Wrong Location

**What goes wrong:** `middleware.ts` placed inside `src/` does not run. All routes remain unprotected.

**Why it happens:** Next.js middleware must be at the project root level alongside `package.json`, not inside `src/`.

**How to avoid:** Place `middleware.ts` at the same level as `package.json` and `next.config.js`. Verify with `npx next build` output showing middleware route.

**Warning signs:** Unauthenticated requests reach protected API routes without a 401/redirect.

---

### Pitfall 2: Forgetting to Export `config` from middleware.ts

**What goes wrong:** Without the `config.matcher` export, Clerk middleware runs on every request including static assets, causing 404s and performance issues.

**How to avoid:** Always export both the `default` middleware function and the `config` matcher from `middleware.ts`. The standard matcher pattern from Clerk docs (see Pattern 1 above) skips `_next`, images, and fonts.

---

### Pitfall 3: AES-GCM Nonce Reuse

**What goes wrong:** Encrypting two different credentials with the same nonce under the same key completely breaks AES-GCM's security — an attacker can recover the XOR of plaintexts.

**Why it happens:** Developers store the nonce as a constant or derive it from non-random data (e.g., timestamp).

**How to avoid:** Always generate the nonce with `os.urandom(12)` inside the encrypt function, every single call. The implementation in Pattern 6 above does this correctly.

**Warning signs:** A fixed 12-byte prefix appearing in multiple stored encrypted blobs.

---

### Pitfall 4: Missing `user_id` Filter on Data Retrieval

**What goes wrong:** A data_sources or datasets lookup returns all rows regardless of `user_id`. User A can see User B's data sources by guessing/enumerating UUIDs.

**Why it happens:** Developer writes `db.select().from(dataSources).where(eq(dataSources.id, id))` without also filtering by `userId`.

**How to avoid:** Every query on a user-owned resource MUST include both the resource ID AND the `user_id` filter:
```typescript
.where(and(eq(dataSources.id, id), eq(dataSources.userId, userId)))
```
The integration test for AUTH-03 (User A cannot access User B's resource) catches this.

**Warning signs:** No `userId` in WHERE clause of resource-retrieval queries.

---

### Pitfall 5: Trusting sqlparse Token-Level Check Alone

**What goes wrong:** A query like `WITH x AS (INSERT INTO foo ...) SELECT * FROM x` passes a regex/token-level DML check because the outer statement starts with `WITH ... SELECT`. The INSERT is nested and bypasses naive filters.

**Why it happens:** Token-level parsers see the first keyword; they don't walk the full tree.

**How to avoid:** Use sqlglot's `.walk()` to traverse the entire AST. Pattern 7 above walks every node in the parsed tree.

---

### Pitfall 6: CVE-2025-29927 on Self-Hosted Next.js

**What goes wrong:** If deploying Next.js < 14.2.25 to a self-hosted server (not Vercel/Netlify), the `x-middleware-subrequest` header can bypass all `clerkMiddleware()` auth checks.

**How to avoid:** Start on Next.js 16.1.7 (already confirmed unaffected). Do not downgrade. If any future dependency forces a downgrade below 14.2.25, this vulnerability reappears. Vercel and Netlify deployments are not affected (platforms strip the header).

---

### Pitfall 7: Drizzle Schema Type Mismatch with Clerk userId

**What goes wrong:** Using `uuid('id')` for the users table `id` column causes type errors when inserting Clerk's string user IDs (`"user_2abc..."`). Drizzle will fail silently or throw a DB error.

**How to avoid:** Use `text('id').primaryKey()` for the `users.id` column. Clerk IDs are opaque strings, not UUIDs.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Auth.js / NextAuth manual session wiring | Clerk hosted auth with `clerkMiddleware()` | 2023-2024 | Drops 2-3 weeks of auth boilerplate for small-team apps |
| Prisma as default ORM for Next.js | Drizzle ORM preferred for Edge/serverless | 2023-2024 | No binary engine, faster cold starts, works in all Next.js deployment modes |
| `sqlparse` for query validation | `sqlglot` for full AST validation | 2024 | sqlglot provides complete AST; handles CTEs, subqueries, and dialect differences |
| PyCrypto for encryption | PyCA `cryptography` library `AESGCM` | 2018+ | PyCrypto abandoned; `cryptography` is the maintained PyCA standard |
| `Fernet` for simple encryption | `AESGCM` with explicit nonce | 2020+ | `Fernet` uses AES-128-CBC; `AESGCM` provides authenticated encryption with 256-bit keys |

**Deprecated/outdated:**

- **PyCrypto**: Abandoned, do not use. Use `cryptography` (PyCA).
- **Fernet** (from `cryptography` library): Uses AES-128-CBC, not AES-256-GCM. Do not use for credential encryption where AES-256 is required.
- **sqlparse for security validation**: Inadequate for AST-level filtering. Use for formatting/display only.
- **Next.js Pages Router for new projects**: Use App Router. Clerk's `auth()` helper is App Router-only.

---

## Open Questions

1. **Clerk `userId` sync to Neon `users` table**
   - What we know: Clerk manages the auth record; Neon stores application metadata linked by userId
   - What's unclear: Whether to use Clerk webhooks to sync user creation to the Neon `users` table, or create the row lazily on first authenticated request
   - Recommendation: Lazy creation on first authenticated request is simpler and eliminates webhook infra for v1. Check if `user_id` exists in `users` table on every authed request; INSERT if missing.

2. **`CREDENTIAL_ENCRYPTION_KEY` key rotation strategy**
   - What we know: The encryption key must be an env var; if rotated, all existing encrypted blobs become unreadable
   - What's unclear: No key rotation mechanism is scoped in Phase 1
   - Recommendation: Document this as a known gap. For Phase 1, a single env var key is sufficient. Note in comments that re-encryption of all blobs is required on key rotation.

3. **sqlglot version pinning**
   - What we know: sqlglot is actively developed with frequent releases
   - What's unclear: Whether latest version at install time will have breaking API changes between Phase 1 and Phase 4
   - Recommendation: Pin sqlglot in `requirements.txt` at install time (e.g., `sqlglot==25.x.x`) and update intentionally.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest (Python backend) + Vitest (Next.js frontend) |
| Config file | `pytest.ini` (Wave 0 — does not yet exist) / `vitest.config.ts` (Wave 0 — does not yet exist) |
| Quick run command (backend) | `pytest backend/tests/ -x -q` |
| Quick run command (frontend) | `npx vitest run --reporter=verbose` |
| Full suite command | `pytest backend/tests/ -v && npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User can sign up + log in with email/password | smoke (manual) | Manual — Clerk UI renders, form submits, session cookie set | Wave 0 infra needed |
| AUTH-02 | Session persists across browser reloads | smoke (manual) | Manual — reload page, verify user still authed via `useAuth()` | Wave 0 infra needed |
| AUTH-03 | User A cannot access User B's data source (403) | integration | `pytest backend/tests/test_tenant_isolation.py -x` | Wave 0 — create file |
| NLQ-03 | DML query rejected by validator before execution | unit | `pytest backend/tests/test_query_validator.py -x` | Wave 0 — create file |
| DS-03 | encrypt + decrypt round-trips to original plaintext | unit | `pytest backend/tests/test_encryption.py -x` | Wave 0 — create file |

**Notes on manual-only tests:**
- AUTH-01 and AUTH-02 require a real Clerk account and browser. No mock can fully replicate Clerk's session lifecycle. Verify manually after integration, then treat as "done" for Phase 1 gate.

### Sampling Rate

- **Per task commit:** `pytest backend/tests/test_query_validator.py backend/tests/test_encryption.py -x -q`
- **Per wave merge:** `pytest backend/tests/ -v && npx vitest run`
- **Phase gate:** Full suite green + AUTH-01/AUTH-02 manual smoke pass before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/test_encryption.py` — covers DS-03 (encrypt/decrypt round-trip, wrong key raises, nonce uniqueness)
- [ ] `backend/tests/test_query_validator.py` — covers NLQ-03 (SELECT passes, INSERT/UPDATE/DELETE/DROP/CTE-with-DML rejected, multi-statement rejected, parse error handled)
- [ ] `backend/tests/test_tenant_isolation.py` — covers AUTH-03 (User A request for User B's data_source_id returns 403 or empty; not the resource)
- [ ] `backend/tests/conftest.py` — shared fixtures (test DB connection, test user IDs, sample encrypted blobs)
- [ ] `pytest.ini` — pytest config (testpaths, asyncio_mode if using async FastAPI tests)
- [ ] Framework install: `pip install pytest pytest-asyncio httpx` (httpx for FastAPI TestClient)
- [ ] Schema migration applied to test DB: `DATABASE_URL=<test_neon_url> npx drizzle-kit migrate`

---

## Sources

### Primary (HIGH confidence)

- npm registry — `@clerk/nextjs` 7.0.4, `drizzle-orm` 0.45.1, `drizzle-kit` 0.31.9, `@neondatabase/serverless` 1.0.2, `node-sql-parser` 5.4.0 (verified 2026-03-17)
- [Clerk Next.js Quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart) — `clerkMiddleware()` setup, `ClerkProvider`, catch-all route pattern
- [Clerk clerkMiddleware Reference](https://clerk.com/docs/reference/nextjs/clerk-middleware) — matcher config, `createRouteMatcher`, route protection opt-in
- [PyCA cryptography AESGCM docs](https://cryptography.io/en/latest/hazmat/primitives/aead/) — `AESGCM` class, nonce requirements, v47.0.0 confirmed
- [Drizzle ORM + Neon tutorial](https://orm.drizzle.team/docs/get-started/neon-new) — `drizzle-orm/neon-http`, `drizzle.config.ts` structure
- [Neon Drizzle migrations guide](https://neon.com/docs/guides/drizzle-migrations) — `generate` + `migrate` workflow

### Secondary (MEDIUM confidence)

- [WebSearch: CVE-2025-29927](https://www.vercel.com/blog/postmortem-on-next-js-middleware-bypass) — Vercel/Netlify deployments not affected; Next.js 16.1.7 unaffected (middleware bypass patched in 14.2.25, 15.2.3)
- [sqlglot GitHub](https://github.com/tobymao/sqlglot) — Full AST parsing, `exp.Select` node, `.walk()` traversal — confirmed via WebSearch summary; direct docs access not performed
- [sqlparse readthedocs](https://sqlparse.readthedocs.io/) — Token-level DML detection limitation confirmed; used only for formatting, not security gating

### Tertiary (LOW confidence)

- Training data: sqlglot version number — version pinned at install time; check `pip show sqlglot` after install
- Training data: Clerk webhook vs lazy user sync — recommendation is from established patterns, not verified against Clerk's current recommended approach for small-team apps

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — All package versions verified from npm registry on 2026-03-17
- Clerk integration: HIGH — Official docs accessible, `clerkMiddleware()` API confirmed
- Drizzle + Neon: HIGH — Official Drizzle and Neon docs confirmed setup pattern
- Encryption (PyCA): HIGH — cryptography.io docs confirmed v47.0.0 AESGCM API
- Query validator (sqlglot): MEDIUM — Pattern confirmed from WebSearch; sqlglot version not pinned from registry
- Architecture patterns: HIGH — Established patterns from production NL-to-SQL systems

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (Clerk and Drizzle ship frequently; re-verify versions if planning is delayed)
