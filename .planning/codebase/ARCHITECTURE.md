# Architecture

**Analysis Date:** 2026-03-17

## Overview

This workspace is a mono-repo of **six independent product applications**, each targeting a distinct HR/workforce management domain. They share common structural patterns but are deployed and versioned separately. Three architectural archetypes are present:

1. **Next.js 14 App Router SPA** — `total-rewards-hub/`, `unified-hr-platform/`
2. **React + Vite SPA** — `perf-mgmt/`, `shramik-platform/`
3. **Static Site / Vanilla JS** — `succession-planning-tool/`, `photoblog/`, `through-my-lens/`

---

## Archetype A: Next.js App Router (total-rewards-hub, unified-hr-platform)

### Pattern Overview

**Overall:** Layered Next.js App Router with role-based access control, in-memory data store, and server/client component split.

**Key Characteristics:**
- File-system routing via `src/app/` with route groups `(auth)` and `(dashboard)`
- Server components handle session reads; client components handle interactivity
- In-memory singleton store (`globalThis.__trh_store`) acts as the database layer
- Middleware enforces JWT authentication and role-gating before any page renders
- Four fixed user roles: `employee`, `manager`, `chro`, `admin`

### Layers

**Middleware Layer:**
- Purpose: Request-time auth and role enforcement before pages render
- Location: `middleware.ts` (project root)
- Contains: JWT verification, role-based redirect rules, public path allowlist
- Depends on: `src/lib/auth.ts`
- Used by: Every request matched by Next.js middleware config

**API Layer:**
- Purpose: REST endpoints for data read/write from client components
- Location: `src/app/api/`
- Contains: Route handlers (`route.ts`) organized by resource — `auth/`, `employees/`, `manager/`, `chro/`, `admin/`, `benchmarks/`
- Depends on: `src/lib/auth.ts`, `src/lib/store.ts`
- Used by: Client-side page components via `fetch()`

**Domain Layer:**
- Purpose: Type definitions and domain model
- Location: `src/domain/types/index.ts`
- Contains: `Employee`, `Compensation`, `Benefits`, `LTIGrant`, `Budget`, `AllocationProposal`, `Benchmark`, `AuthUser`, `UserRole` and all supporting interfaces
- Depends on: Nothing (pure types)
- Used by: All other layers

**Data Layer:**
- Purpose: In-memory singleton store with domain query helpers
- Location: `src/lib/store.ts`
- Contains: `AppStore` interface, `getStore()`, `seedStore()`, query helpers (`findEmployee`, `findCompensation`, `computeCompaRatio`, etc.)
- Depends on: `src/domain/types`
- Used by: API route handlers

**Auth Layer:**
- Purpose: JWT creation/verification, session reading, cookie management
- Location: `src/lib/auth.ts`
- Contains: `signToken`, `verifyToken`, `getSession`, `getSessionFromRequest`, `makeAuthCookie`, `hasRole`, `defaultRouteForRole`, `DEMO_USERS`
- Depends on: `jose` (JWT), `src/domain/types`
- Used by: Middleware, API routes, root layout

**UI Provider Layer:**
- Purpose: Client-side state for auth user and theme
- Location: `src/components/providers/Providers.tsx`
- Contains: `AuthContext`, `ThemeContext`, combined `Providers` wrapper
- Depends on: `src/domain/types`
- Used by: `src/app/layout.tsx`

**Page Layer:**
- Purpose: Role-scoped page views
- Location: `src/app/(dashboard)/`
- Contains: `employee/`, `manager/`, `chro/`, `admin/` (and `perf/` in unified-hr-platform)
- Depends on: `src/components/`, API endpoints
- Used by: Next.js file-system router

**Component Layer:**
- Purpose: Shared and domain-specific UI components
- Location: `src/components/`
- Contains: `ui/` (Card, Button, Badge, ProgressBar, MetricTile), `layout/` (Header, Sidebar), `charts/` (recharts wrappers), `manager/`, `employee/`, `chro/`, `tour/`
- Depends on: Nothing above component layer
- Used by: Page components

### Data Flow

**Authentication Flow:**
1. Request hits `middleware.ts`; JWT cookie (`trh_token`) is read and verified
2. On missing/invalid token → redirect to `/login`
3. On valid token, role is checked against route prefix allow-list
4. Unauthorized role → redirect to `defaultRouteForRole(role)`
5. `src/app/layout.tsx` calls `getSession()` server-side and passes `initialUser` to `<Providers>`
6. `AuthContext` in `Providers.tsx` exposes `user` to all client components

**Data Read Flow:**
1. Client component mounts; calls `fetch('/api/employees/[id]')` (or similar)
2. API route handler calls `getSessionFromRequest(req)` for auth check
3. Handler calls `ensureSeeded()` to lazy-load mock data into in-memory store
4. Handler calls store query helpers (`findEmployee`, `findCompensation`, etc.)
5. Handler returns JSON; client component renders data

**Data Write Flow:**
1. Client component submits form; calls `fetch('/api/...', { method: 'POST', body })`
2. API route validates session role
3. Handler calls store mutation helpers (`upsertAllocation`, `updateAllocation`)
4. Returns updated JSON; client re-renders

**State Management:**
- Server state: In-memory store (`src/lib/store.ts`) seeded once per process lifetime
- Client auth state: `AuthContext` initialized from server-read session via `Providers` prop
- Client theme state: `ThemeContext` reading `localStorage.trh_theme`
- No React Query or Zustand in Next.js projects (pure fetch + React state)

### Error Handling

**Strategy:** Return typed JSON errors with appropriate HTTP status codes from API routes; no global client-side error boundary observed.

**Patterns:**
- `return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })`
- `return NextResponse.json({ error: 'Forbidden' }, { status: 403 })`
- `return NextResponse.json({ error: 'Employee not found' }, { status: 404 })`
- `try/catch` around JSON parsing in API routes returning 500

---

## Archetype B: React + Vite SPA (perf-mgmt, shramik-platform)

### Pattern Overview

**Overall:** Client-only SPA with React Context (perf-mgmt) or Zustand (shramik-platform) for global state, React Router for navigation, and all data sourced from synthetic/mock files.

**Key Characteristics:**
- No server; all logic runs in the browser
- Role switching is in-app (no real authentication server)
- Data persisted to `localStorage` (perf-mgmt) or not persisted at all (shramik-platform)
- Feature pages are PascalCase directories under `src/pages/`

### Layers

**Entry Point:**
- Location: `src/main.tsx`
- Responsibilities: Mounts React root, wraps app in global context provider, renders `<App />`

**Router Layer:**
- Location: `src/App.tsx`
- Contains: `BrowserRouter`, `Routes`, role-based `ProtectedRoute` component (shramik-platform), `ROLE_ACCESS`/`ROLE_HOME` maps
- Depends on: Global state store (to read current user role)
- Used by: Browser navigation

**Global State (perf-mgmt):**
- Pattern: React Context + `useReducer` with `localStorage` persistence
- Location: `src/store/AppContext.tsx`
- State includes: employees, goals, feedbackNotes, ratings, feedback360, promotionCases, meritRecommendations, connectors, currentUser, syncStatus
- Action types: 20+ typed actions for CRUD on all domain entities
- Exposes: `useApp()` hook returning `state`, `dispatch`, and convenience helpers

**Global State (shramik-platform):**
- Pattern: Zustand stores (two separate stores)
- Location: `src/store/authStore.ts`, `src/store/uiStore.ts`
- `authStore`: current user, selected plant, login/logout actions
- `uiStore`: dark mode, mobile view toggle, notifications list, guided tour state
- Data fetching: React Query (`@tanstack/react-query`) wraps all data reads

**Data Layer:**
- perf-mgmt: `src/data/synthetic.ts` (employees, goals, ratings, etc.), `src/data/goalLibrary.ts`, `src/data/connectorData.ts`, `src/data/competencyMap.ts`
- shramik-platform: `src/data/mockData.ts`
- All data is hardcoded mock — no real API calls

**Page Layer:**
- Location: `src/pages/`
- Each subdirectory is a route; contains `index.tsx` (or named tsx)
- Pages consume global state via `useApp()` or Zustand hooks directly

**Component Layer:**
- Location: `src/components/`
- perf-mgmt: `ui/` (atomic), `layout/` (AppShell, Sidebar, TopBar, BottomNav), `charts/` (ECharts wrappers)
- shramik-platform: Single `Layout.tsx` shared across all pages

**Hooks Layer (perf-mgmt):**
- Location: `src/hooks/`
- Contains: `useChartTheme.ts` (ECharts dark/light), `useDarkMode.ts`

### Data Flow

**Perf-mgmt State Flow:**
1. `main.tsx` wraps app in `<AppProvider>`; `buildInitialState()` reads `localStorage` or falls back to synthetic data
2. Pages call `useApp()` to access `state` and `dispatch`
3. Mutations dispatch typed actions → reducer produces next state → `useEffect` persists to `localStorage`
4. Connector sync: `runDataSync()` simulates async fetch, updates KPI actuals via `FINISH_SYNC` action

**Shramik-platform State Flow:**
1. `useAuthStore` holds current user; login/logout update store
2. `useUIStore` manages dark mode, mobile view, notifications, tour steps
3. Pages read data via React Query with mock data functions; no real network calls
4. Role-gated navigation via `ROLE_ACCESS` map in `App.tsx`

---

## Archetype C: Static / Vanilla JS (succession-planning-tool, photoblog, through-my-lens)

### Pattern Overview

**succession-planning-tool:**
- Single `index.html` with modular JS files under `js/`
- JS modules: `app.js`, `data.js`, `dashboard.js`, `ninebox.js`, `pipeline.js`, `performance.js`, `assessments.js`, `analytics.js`, `manufacturing.js`, `development.js`, `manager-view.js`, `employee-view.js`, `admin.js`
- No build step; deployed directly to Netlify

**through-my-lens:**
- Eleventy (11ty) static site generator
- Config: `.eleventy.js` defines collections (`photos`, `categories`) and filters
- Input: `src/` (Nunjucks/Markdown templates + photo content files)
- Output: `_site/` (generated static HTML)
- Admin panel: `admin/` (Netlify CMS)

**photoblog:**
- Vanilla HTML/CSS/JS
- `index.html` as entry point; `photos.json` as data source; `js/` for scripts; `css/` for styles
- `site.json` for site configuration; `scripts/` for build utilities

---

## Key Abstractions

**UserRole / RBAC:**
- Purpose: Controls which routes, data, and UI elements are accessible
- Next.js projects: `UserRole = 'employee' | 'manager' | 'chro' | 'admin'` in `src/domain/types/index.ts`
- Shramik-platform: `UserRole = 'CMD' | 'CHRO' | 'PlantHR' | 'PayrollAdmin' | 'Supervisor' | 'ContractorPortal' | 'WorkerSelfService' | 'GateAdmin'` in `src/types/index.ts`
- Enforcement: middleware (Next.js), `ProtectedRoute` component (Vite SPAs)

**AppProvider / Context:**
- Purpose: Single source of truth for all application state in SPA projects
- perf-mgmt: `src/store/AppContext.tsx` — React Context + useReducer
- unified-hr-platform dashboard: `src/lib/perf/AppContext.tsx` — same pattern re-used inside Next.js dashboard layout
- Pattern: `export function useApp()` hook that throws if used outside provider

**In-Memory Store (Next.js projects):**
- Purpose: Simulates a database; designed to be swappable with Prisma/SQLite
- Location: `src/lib/store.ts`
- Pattern: `globalThis.__trh_store` singleton; `getStore()` / `seedStore()` / `resetStore()` API
- `ensureSeeded()` in `src/lib/utils.ts` called by API routes before any query

**Domain Types:**
- Purpose: Central type system for all HR domain entities
- Location: `src/domain/types/index.ts` (Next.js projects), `src/lib/perf/types.ts` (perf module), `src/types/index.ts` (shramik-platform)
- India-specific fields in types: INR currency, Indian financial year (Apr–Mar), PF/ESIC/HRA statutory fields, metro/non-metro HRA flag

---

## Entry Points

**Next.js projects (total-rewards-hub, unified-hr-platform):**
- Location: `src/app/layout.tsx`
- Triggers: Next.js server renders root layout on every request
- Responsibilities: Reads JWT session, passes user to `<Providers>`, sets metadata/viewport

**Vite SPA projects (perf-mgmt, shramik-platform):**
- Location: `src/main.tsx`
- Triggers: Browser loads `index.html`; Vite/React mounts on `#root`
- Responsibilities: Wraps app in global providers, initialises state

**Middleware (Next.js projects):**
- Location: `middleware.ts`
- Triggers: Every matched request before page rendering
- Responsibilities: JWT auth check, role-based redirect, public path bypass

---

## Cross-Cutting Concerns

**Logging:** No structured logging library; uses `console.error` in catch blocks within API routes.

**Validation:** Input validation is minimal; API routes validate session role but do not validate request body shape beyond parsing.

**Authentication:**
- Next.js: JWT in httpOnly cookie (`trh_token`), 7-day expiry, HS256, verified in middleware and API routes via `jose` library
- Vite SPAs: Simulated auth; user selected from hardcoded list; no real token/session

**Dark Mode:**
- Next.js projects: `ThemeContext` in `Providers.tsx`, reads/writes `localStorage.trh_theme`, toggles `dark` class on `document.documentElement`
- perf-mgmt: `useDarkMode.ts` hook with same pattern
- shramik-platform: `useUIStore.toggleDark()` with same class toggle

**Responsive Layout:**
- All projects use Tailwind CSS with responsive breakpoints
- Next.js/unified projects: `Sidebar` hidden on mobile (`hidden lg:flex`), `BottomNav` shown on mobile, hamburger overlay sidebar
- Shramik-platform: `useUIStore.mobileView` toggle for demo purposes

---

*Architecture analysis: 2026-03-17*
