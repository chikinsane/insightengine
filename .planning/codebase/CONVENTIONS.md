# Coding Conventions

**Analysis Date:** 2026-03-17

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` files — e.g., `AppShell.tsx`, `StatCard.tsx`, `NotificationToast.tsx`
- Page directories use `index.tsx` as the default export — e.g., `src/pages/Dashboard/index.tsx`
- Hooks: camelCase prefixed with `use` — e.g., `useDarkMode.ts`, `useChartTheme.ts`
- Utilities/lib: camelCase — e.g., `csvParser.ts`, `formatters.ts`, `utils.ts`
- Store files: camelCase with descriptive suffix — e.g., `AppContext.tsx`, `authStore.ts`
- Data files: camelCase — e.g., `synthetic.ts`, `goalLibrary.ts`, `mockData.ts`
- Type files: `index.ts` in a `types/` folder or `index.ts` in `domain/types/`

**Functions:**
- React components: PascalCase — e.g., `function AppShell()`, `function GoalCard()`
- Hooks: camelCase with `use` prefix — e.g., `useApp()`, `useDarkMode()`
- Regular functions: camelCase — e.g., `buildInitialState()`, `computeKPIScore()`, `formatINR()`
- Event handlers: `handle` prefix — e.g., `handleSave`, `handleClose`
- Helper/getter functions: `get` or descriptive prefix — e.g., `getEmployee()`, `getDirectReports()`
- Store actions: `useAuthStore`, `useUiStore` (Zustand convention)

**Variables:**
- camelCase for all local variables and state — e.g., `sidebarOpen`, `currentUser`, `sortField`
- SCREAMING_SNAKE_CASE for module-level constants — e.g., `RATING_LABELS`, `VARIANTS`, `SIZES`, `PAGE_SIZE`, `TOKEN_COOKIE`
- Reducer action types: SCREAMING_SNAKE_CASE strings — e.g., `'ADD_GOAL'`, `'UPDATE_RATING'`, `'FINISH_SYNC'`

**Types/Interfaces:**
- PascalCase for all type aliases and interfaces — e.g., `Employee`, `Goal`, `AppState`, `ButtonProps`
- Union string literal types use PascalCase or domain-appropriate casing — e.g., `'Active' | 'Draft'`, `'employee' | 'manager'`
- Generic utility types named descriptively — e.g., `AuthUser`, `AppContextValue`

## Code Style

**Formatting:**
- No Prettier config present in any project (formatting done by editor/defaults)
- 2-space indentation throughout
- Single quotes for strings in `total-rewards-hub` (Next.js project)
- Single quotes for strings in `perf-mgmt` (Vite/React project)
- Semicolons: omitted in `total-rewards-hub`, used in `perf-mgmt`
- Trailing commas used in multi-line structures

**Linting:**
- ESLint with `typescript-eslint` — configured in `shramik-platform/eslint.config.js`
- `eslint-plugin-react-hooks` enforced (react-hooks/rules-of-hooks)
- `eslint-plugin-react-refresh` for Vite HMR safety
- Next.js projects use `eslint-config-next` via `next lint`
- `strict: true` in all `tsconfig.json` files

## Import Organization

**Order (perf-mgmt / Vite projects):**
1. React and framework imports — `import { useState } from 'react'`
2. Third-party libraries — `import clsx from 'clsx'`, `import { format } from 'date-fns'`
3. Internal path-aliased imports — `import Card from '@/components/ui/Card'`
4. Type-only imports — `import type { Goal, KPI } from '@/types'`

**Order (total-rewards-hub / Next.js project):**
1. Next.js server imports — `import { NextRequest, NextResponse } from 'next/server'`
2. Internal lib imports — `import { getSessionFromRequest } from '@/lib/auth'`
3. Internal store/data imports — `import { findEmployee } from '@/lib/store'`

**Path Aliases:**
- `@/*` maps to `./src/*` in all projects (configured in `tsconfig.json` and `vite.config.ts`)

## Error Handling

**Patterns:**
- API route handlers wrap top-level logic in `try/catch`, returning `NextResponse.json({ error: '...' }, { status: ... })` for failures
- Auth errors return 401, permission errors return 403, not-found returns 404
- JWT verification failures swallow the error and return `null` — caller checks for null
- Context hooks throw a descriptive error if used outside the provider: `throw new Error('useApp must be used within AppProvider')`
- localStorage parse errors are silently swallowed with a fallback to defaults (see `buildInitialState` in `perf-mgmt/src/store/AppContext.tsx`)
- Async operations in serverless functions wrapped in `try/catch` with generic 500 fallback

**Example (API route):**
```typescript
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    // ... logic ...
    return NextResponse.json({ user: authUser, redirect })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Logging

**Framework:** No logging library — `console.*` calls are absent from application source code in all projects.

**Patterns:**
- User-facing feedback uses in-app notification system (`notify()` in perf-mgmt, `react-hot-toast` in shramik-platform)
- No structured logging to external services in any project

## Comments

**When to Comment:**
- Section dividers used extensively as visual separators with the `─────` pattern and a label
- JSDoc-style single-line descriptions on utility functions (especially in `formatters.ts`, `csvParser.ts`)
- Inline comments clarify business logic non-obvious from code — e.g., "For 'lower is better' KPIs (days, bugs, cost), invert the ratio"

**Section Divider Pattern (used in all projects):**
```typescript
// ─── Section Name ─────────────────────────────────────────────────────────────
```

**Function Documentation:**
```typescript
/** India-first formatting utilities (INR, Indian FY, Lakh/Crore notation) */

/** e.g. "₹42.5L" */
export function formatLPA(amount: number): string { ... }
```

## Function Design

**Size:** Functions are small and single-purpose. Reducer case handlers are typically 3–10 lines.

**Parameters:** Props interfaces extend HTML element attribute types where appropriate — e.g., `interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>`. Destructure at declaration site.

**Return Values:**
- Components always return JSX or `null`
- Utility functions return typed values without `any`
- Async API handlers always return `NextResponse`

## Module Design

**Exports:**
- React components: `export default function ComponentName()` for primary component; named exports for secondary exports from the same file (e.g., `export function CardHeader` alongside `export default Card`)
- Hooks: named exports — e.g., `export function useApp()`, `export function useDarkMode()`
- Store providers: named export — e.g., `export function AppProvider`
- Utilities: named exports only

**Barrel Files:**
- Types are centralized in `src/types/index.ts` (perf-mgmt) and `src/domain/types/index.ts` (total-rewards-hub)
- No barrel `index.ts` files in component directories; components imported by direct path

## Component Patterns

**UI Component Structure (all projects):**
- Variant/size maps defined as module-level `Record<..., string>` constants — e.g., `VARIANTS`, `SIZES`
- `clsx` (perf-mgmt, shramik-platform) or `cn` = `twMerge(clsx(...))` (total-rewards-hub) for conditional class composition
- Dark mode handled via Tailwind `dark:` prefix classes, not JS branching
- Icons from `lucide-react` only; sized via `size` prop — e.g., `<Target size={18} />`

**State Management:**
- `perf-mgmt`: React Context + `useReducer` with typed discriminated union `Action` type
- `total-rewards-hub`: Zustand for client state; Next.js API routes + `jose` JWT for server auth
- `shramik-platform`: Zustand stores per domain — e.g., `authStore.ts`, `uiStore.ts`

**Data Fetching:**
- `shramik-platform` uses TanStack Query (`@tanstack/react-query`) with `axios`
- `total-rewards-hub` uses native `fetch` in Next.js server components and client components
- `perf-mgmt` uses in-memory synthetic data with no network calls to a backend

---

*Convention analysis: 2026-03-17*
