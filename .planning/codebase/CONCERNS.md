# Codebase Concerns

**Analysis Date:** 2026-03-17

---

## Tech Debt

**All Projects: Zero Test Coverage**
- Issue: No test files exist anywhere in the codebase (`*.test.*`, `*.spec.*` — none found).
- Files: All source trees under `perf-mgmt/src/`, `shramik-platform/src/`, `total-rewards-hub/src/`, `unified-hr-platform/src/`, `succession-planning-tool/js/`
- Impact: Every refactor, bug fix, or feature addition carries silent regression risk. Business logic in `AppContext.tsx`, `computeKPIScore`, `csvParser.ts`, and the merit-cycle lock flow is completely untested.
- Fix approach: Add Vitest (already in stack for some projects) with unit tests for pure utility functions first (`src/utils/csvParser.ts`, `src/lib/perf/AppContext.tsx` helpers), then component smoke tests with React Testing Library.

---

**Hardcoded Fallback JWT Secret in Production Auth**
- Issue: Both `total-rewards-hub` and `unified-hr-platform` fall back to a static, known-public JWT secret string `'total-rewards-hub-dev-secret-key-min-32-chars!!'` when `JWT_SECRET` env var is absent.
- Files: `total-rewards-hub/src/lib/auth.ts:8`, `unified-hr-platform/src/lib/auth.ts:8`
- Impact: If deployed without setting `JWT_SECRET`, any attacker who reads the source can forge valid session tokens for any role including `admin`. This is a critical credential leakage risk.
- Fix approach: Remove the fallback value entirely. Throw an error at startup if `JWT_SECRET` is absent in non-test environments. Add an `env.mjs` validation module using `zod` or manual check.

---

**Hardcoded Demo Passwords in Source-Tracked Auth Module**
- Issue: `DEMO_USERS` array with cleartext passwords (`'demo123'`) is defined directly in `auth.ts` and tracked in git.
- Files: `total-rewards-hub/src/lib/auth.ts:12-29`, `unified-hr-platform/src/lib/auth.ts:12-29`
- Impact: If this code is ever deployed with real user data substituted in, the passwords are permanently exposed in git history. Even in demo context, plaintext password comparison (`u.password === password`) is an unsafe pattern that could be cargo-culted into production auth.
- Fix approach: Move demo users to a seeded in-memory store. Hash passwords with `bcrypt`/`argon2` even for demos to establish correct patterns.

---

**perf-mgmt: Entire App State Serialised to localStorage on Every Render**
- Issue: `AppContext.tsx` serialises the complete `AppState` (20 employees, all goals, ratings, feedback, 360s, merit recs) to `localStorage` on every state change via an unthrottled `useEffect`.
- Files: `perf-mgmt/src/store/AppContext.tsx:267-270`, `unified-hr-platform/src/lib/perf/AppContext.tsx:270-273`
- Impact: As the dataset grows (e.g., after CSV import), every dispatch triggers a blocking full-JSON-stringify of the entire state graph. This causes UI jank and can exceed `localStorage` 5MB quota, silently dropping data.
- Fix approach: Debounce the persist effect (e.g., 500ms), serialise only mutated slices, or migrate to IndexedDB. At minimum, add a try/catch around the `setItem` call to handle quota errors gracefully.

---

**Massive Monolithic Page Components**
- Issue: Multiple page-level components exceed 500–875 lines and contain business logic, data transforms, chart config, and local state all inline.
- Files:
  - `shramik-platform/src/pages/CMDDashboard.tsx` — 875 lines
  - `shramik-platform/src/pages/AIAgents.tsx` — 728 lines
  - `shramik-platform/src/pages/CHRODashboard.tsx` — 683 lines
  - `total-rewards-hub/src/components/manager/BudgetPlanner.tsx` — 760 lines
  - `unified-hr-platform/src/components/manager/BudgetPlanner.tsx` — 760 lines
  - `perf-mgmt/src/pages/Admin/index.tsx` — 591 lines
- Impact: These files are hard to navigate, impossible to unit test, and cause merge conflicts on any UI work. Adding features compounds the problem.
- Fix approach: Extract data-transform helpers to `utils/`, chart config to separate `chartConfig.ts` files, and sub-sections to named child components. Target < 250 lines per page component.

---

**exact Code Duplication Across Projects**
- Issue: `total-rewards-hub` and `unified-hr-platform` contain byte-for-byte identical copies of core files, confirmed by MD5 hash comparison. `perf-mgmt` logic is substantially duplicated in `unified-hr-platform/src/lib/perf/`. `synthetic.ts` (1513 lines) appears in both `perf-mgmt` and `unified-hr-platform` with minor drift.
- Files:
  - `total-rewards-hub/src/lib/auth.ts` === `unified-hr-platform/src/lib/auth.ts` (identical)
  - `total-rewards-hub/src/components/manager/BudgetPlanner.tsx` === `unified-hr-platform/src/components/manager/BudgetPlanner.tsx` (identical)
  - `perf-mgmt/src/data/synthetic.ts` vs `unified-hr-platform/src/lib/perf/data/synthetic.ts` (diverged copies)
  - `perf-mgmt/src/store/AppContext.tsx` vs `unified-hr-platform/src/lib/perf/AppContext.tsx` (diverged copies)
- Impact: Bug fixes and security patches must be applied twice (or more). The two copies of `auth.ts` already carry the JWT fallback secret vulnerability and will drift unless changed in both places.
- Fix approach: Extract shared logic to a local package (monorepo with `packages/shared`) or at minimum establish a canonical source and use symlinks/copier scripts with explicit ownership.

---

**AI Coach is Permanently in Rule-Based Demo Mode**
- Issue: The `ai-coach` Netlify function contains a full LLM integration path but it is commented out. The handler always calls `generateWithRules()`. The frontend displays a "Demo / Rule-based" badge.
- Files: `perf-mgmt/netlify/functions/ai-coach.ts:172-211` (commented LLM block), `perf-mgmt/netlify/functions/ai-coach.ts:247`
- Impact: The AI Coach feature is effectively a static template generator. Users who expect AI-generated coaching will get pre-written scripts. No `ANTHROPIC_API_KEY` integration is wired.
- Fix approach: Uncomment the `generateWithLLM` block, add `ANTHROPIC_API_KEY` to Netlify env vars, toggle via `process.env.LLM_ENABLED` flag so rule-based remains available as fallback.

---

**Connectors Are Simulated — No Real API Integration**
- Issue: Both the frontend connector UI and the Netlify `connectors.ts` function use in-memory hardcoded mock data. No real ERP/CRM/MES connections exist. KPI sync (`runDataSync`) uses a 1.8-second `setTimeout` and shuffles fake values.
- Files: `perf-mgmt/src/data/connectorData.ts`, `perf-mgmt/netlify/functions/connectors.ts`, `perf-mgmt/src/store/AppContext.tsx:381-402`
- Impact: The connectors feature is entirely non-functional in a production context. Users importing real data via CSV get real numbers, but the connector sync path always returns synthetic values.
- Fix approach: Implement a real connector adapter interface. Replace `getConnectorValue()` with actual HTTP calls to the Netlify function, which in turn needs real credentials and API endpoints per source system.

---

**Import Feature Simulated in total-rewards-hub / unified-hr-platform**
- Issue: The Imports admin page uses `alert()` to simulate file uploads instead of implementing actual file handling.
- Files: `total-rewards-hub/src/app/(dashboard)/admin/imports/ImportsClient.tsx:59`, `total-rewards-hub/src/app/(dashboard)/admin/imports/ImportsClient.tsx:98`, `unified-hr-platform/src/app/(dashboard)/admin/imports/ImportsClient.tsx:59`
- Impact: Admin users attempting to upload employee/compensation data receive a browser alert. Data import is completely non-functional.
- Fix approach: Implement `<input type="file">` with Papa Parse or xlsx, validate against zod schema using the existing `/api/admin/validate` endpoint, then seed the in-memory store.

---

## Security Considerations

**No Rate Limiting on Authentication Endpoint**
- Risk: The `/api/auth/login` route has no rate limiting. Automated brute-force attacks against demo credentials (or real credentials in a production deploy) are unrestricted.
- Files: `total-rewards-hub/src/app/api/auth/login/route.ts`, `unified-hr-platform/src/app/api/auth/login/route.ts`
- Current mitigation: Netlify may apply edge-level limits; no application-level protection exists.
- Recommendations: Add Upstash Redis-based rate limiting via `@upstash/ratelimit` or Netlify Edge middleware. Limit to 10 attempts per IP per 15 minutes.

**No CSRF Protection on State-Mutating API Routes**
- Risk: API routes (`/api/manager/budget`, `/api/admin/seed`, `/api/admin/validate`) rely on JWT cookies with `sameSite: 'lax'`. While `lax` provides some protection, there is no explicit CSRF token or `Origin` header validation.
- Files: `total-rewards-hub/src/lib/auth.ts:75`, `unified-hr-platform/src/lib/auth.ts:75`
- Current mitigation: `sameSite: lax` cookie attribute
- Recommendations: Add `Origin`/`Referer` header checks in API routes, or use `sameSite: strict` for the auth cookie.

**PII Stored in Plain Text in Client-Side Mock Data**
- Risk: `shramik-platform` generates and stores realistic Aadhaar numbers, PAN numbers, UAN numbers, IFSC codes, and bank account numbers as plain-text strings in JavaScript module scope (client-side accessible).
- Files: `shramik-platform/src/data/mockData.ts:36-53`, `shramik-platform/src/data/mockData.ts:188-193`
- Current mitigation: Data is synthetic/generated, not real. View-layer masking is applied in `WorkerSelfServicePage.tsx`.
- Recommendations: Even with synthetic data, ensure the masking pattern (e.g., `aadhaar.slice(-4)`) is the only access path. If ever connected to real data, the entire data layer must be moved server-side with field-level access controls.

**Passwords Compared in Plaintext**
- Risk: Login route compares `u.password === password` directly. No hashing.
- Files: `total-rewards-hub/src/app/api/auth/login/route.ts:9`, `unified-hr-platform/src/app/api/auth/login/route.ts:9`
- Current mitigation: Passwords are demo values only (`demo123`)
- Recommendations: Use `bcrypt.compare()` even for demo passwords to establish the correct implementation pattern before any real users are added.

**No `error.tsx` / `not-found.tsx` Error Pages in Next.js Projects**
- Risk: Next.js app router projects (`total-rewards-hub`, `unified-hr-platform`) have no `error.tsx` or `not-found.tsx` files. Unhandled errors will expose Next.js default error UI (which may reveal stack traces in dev and confuse users in production).
- Files: `total-rewards-hub/src/app/`, `unified-hr-platform/src/app/`
- Current mitigation: None
- Recommendations: Add `src/app/error.tsx` and `src/app/not-found.tsx` with appropriate user-facing messages.

---

## Performance Bottlenecks

**Full State Serialisation on Every Dispatch**
- Problem: The `useEffect` that writes to `localStorage` in `AppContext.tsx` fires synchronously after every state change, serialising potentially megabytes of data on each user interaction.
- Files: `perf-mgmt/src/store/AppContext.tsx:267-270`, `unified-hr-platform/src/lib/perf/AppContext.tsx:270-273`
- Cause: No debouncing, no selector-based partial serialisation, no diff checking before write.
- Improvement path: Wrap `localStorage.setItem` in a debounce of 300-500ms. Consider only persisting changed slices using a per-key approach.

**Large Synthetic Data File Parsed at Import Time**
- Problem: `synthetic.ts` (1,513 lines) is a static TypeScript module with large pre-built object arrays. It is imported at startup and fully evaluated before any component renders.
- Files: `perf-mgmt/src/data/synthetic.ts`, `unified-hr-platform/src/lib/perf/data/synthetic.ts`
- Cause: No lazy loading, no code splitting at the data level.
- Improvement path: Convert to a JSON file and use dynamic `import()` or load from API on first request. This would also remove it from the main JS bundle.

**30-second `setInterval` Polling in AIAgents**
- Problem: `shramik-platform/src/pages/AIAgents.tsx` uses a `setInterval` that fires every 30 seconds to trigger a re-render tick for all agent statuses.
- Files: `shramik-platform/src/pages/AIAgents.tsx:547`
- Cause: Simulated live-update UI with no real backend; uses wall-clock ticks as a proxy.
- Improvement path: Replace with React `useTransition` + intentional refresh button, or use `useSWR` with a configurable refresh interval that can be suspended when the tab is not visible.

---

## Fragile Areas

**In-Memory Store Lost on Server Restart (total-rewards-hub, unified-hr-platform)**
- Files: `total-rewards-hub/src/lib/store.ts`, `unified-hr-platform/src/lib/store.ts`
- Why fragile: All data lives in a `globalThis.__trh_store` Node.js module-level variable. Any cold start, serverless function spin-down, or deploy wipes all user-entered data silently. The store uses JavaScript `Map` objects which are not serialisable to JSON without custom logic.
- Safe modification: Always call `ensureSeeded()` at the top of every API route before reading data. Never add state to the store without updating the seed function.
- Test coverage: None. No tests verify seed idempotency or store reset behaviour.

**`window.confirm()` Used for Destructive Actions**
- Files:
  - `perf-mgmt/src/pages/MeritCycle/index.tsx:308`
  - `perf-mgmt/src/pages/Admin/index.tsx:333`
  - `unified-hr-platform/src/app/(dashboard)/perf/merit-cycle/page.tsx:309`
  - `unified-hr-platform/src/app/(dashboard)/perf/admin-settings/page.tsx:334`
- Why fragile: `window.confirm()` is synchronous and blocks the main thread. It cannot be styled, is suppressed in some embedded browser contexts, and returns `undefined` (not `false`) in certain environments. The "finalise merit cycle" action is irreversible.
- Safe modification: Replace with a custom `<ConfirmModal>` component that uses async/await and is already present in the UI component library (`src/components/ui/Modal.tsx`).

**`useEffect` Dependencies Suppressed in TourGuide**
- Files: `total-rewards-hub/src/components/tour/TourGuide.tsx:365`, `total-rewards-hub/src/components/tour/TourGuide.tsx:372` (`eslint-disable-line react-hooks/exhaustive-deps`)
- Why fragile: Suppressed dependency array warnings indicate the effect depends on values not listed, causing stale closures. This can result in the tour rendering against the wrong step target after navigation.
- Safe modification: Audit actual dependencies and refactor with `useCallback` + stable refs rather than suppressing the lint rule.

**Seeded Random in `mockData.ts` Resets on Module Re-import**
- Files: `shramik-platform/src/data/mockData.ts:60-64`
- Why fragile: A module-level `seed = 42` variable controls the seeded random number generator. Because the module is evaluated once per process, the seed is consumed in order on each import. If the import order changes, or if additional calls are inserted, all generated IDs, names, Aadhaar numbers, and bank accounts shift, breaking any UI that depends on stable IDs across reloads.
- Safe modification: Use a proper deterministic PRNG library (e.g., `seedrandom`) with an explicit seed per entity type, or pre-generate the data once and check it in as static JSON.

---

## Missing Critical Features

**No Real Database**
- Problem: All three web app projects (`total-rewards-hub`, `unified-hr-platform`, `perf-mgmt`) use client-side localStorage or server-side in-memory `globalThis` stores. There is no persistent database layer.
- Blocks: Multi-user collaboration, data persistence across sessions/deploys, real HR workflows requiring audit trails, any production use case.

**No Email / Notification Delivery**
- Problem: The `notify()` function in `perf-mgmt` and `unified-hr-platform` adds in-app toast notifications. No email, Slack, or push notification system exists anywhere.
- Files: `perf-mgmt/src/store/AppContext.tsx:310-321`
- Blocks: Performance review deadline reminders, promotion approval notifications, merit cycle communications.

**No Real File Upload / CSV Export Backend**
- Problem: `total-rewards-hub` and `unified-hr-platform` import UI uses `alert()` as a stub. `perf-mgmt` implements CSV parsing client-side only with no server validation or persistence.
- Files: `total-rewards-hub/src/app/(dashboard)/admin/imports/ImportsClient.tsx`, `perf-mgmt/src/pages/Import/index.tsx`
- Blocks: Admin data loading workflows for real HR deployments.

---

## Test Coverage Gaps

**All Business Logic**
- What's not tested: KPI score computation (`computeKPIScore`), merit cycle locking, promotion state machine, CSV parsing, year-end finalisation, JWT auth flow, role-based access checks.
- Files: `perf-mgmt/src/store/AppContext.tsx`, `perf-mgmt/src/utils/csvParser.ts`, `total-rewards-hub/src/lib/auth.ts`, `total-rewards-hub/src/app/api/`
- Risk: Regressions in core HR calculations go undetected. The KPI score logic (`computeKPIScore`) uses non-trivial "lower is better" heuristics based on keyword matching in KPI descriptions — a change to any KPI description string silently breaks the inversion logic.
- Priority: High

**Auth and Middleware**
- What's not tested: JWT sign/verify round-trip, middleware role guard redirects, cookie expiry handling, fallback secret warning.
- Files: `total-rewards-hub/src/lib/auth.ts`, `total-rewards-hub/middleware.ts`, `unified-hr-platform/middleware.ts`
- Risk: A regression in the middleware could grant unauthorised access to admin routes or lock all users out.
- Priority: High

**In-Memory Store Operations**
- What's not tested: Seed idempotency, reset behaviour, Map serialisation, concurrent access patterns.
- Files: `total-rewards-hub/src/lib/store.ts`, `unified-hr-platform/src/lib/store.ts`
- Risk: Silent data loss on server restart or concurrent requests are not detectable without tests.
- Priority: Medium

---

*Concerns audit: 2026-03-17*
