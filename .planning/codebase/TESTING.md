# Testing Patterns

**Analysis Date:** 2026-03-17

## Test Framework

**Runner:** None — no test framework is installed in any project.

- `perf-mgmt/package.json`: No test dependencies or scripts
- `total-rewards-hub/package.json`: No test dependencies or scripts
- `shramik-platform/package.json`: No test dependencies or scripts
- `unified-hr-platform/package.json`: No test dependencies or scripts
- `succession-planning-tool/package.json`: No test dependencies or scripts

No `jest.config.*`, `vitest.config.*`, or equivalent config files are present.

**Assertion Library:** Not applicable — no test framework installed.

**Run Commands:** No test commands exist in any `package.json` scripts.

## Test File Organization

**Location:** No test files exist anywhere in the codebase.

**Naming:** No test files present — no `.test.*` or `.spec.*` files found.

## Test Structure

No test structure exists. There are no unit, integration, or end-to-end tests in any project.

## Mocking

**Framework:** Not applicable.

No mocking patterns are established. However, the codebase uses a consistent pattern of **in-memory synthetic/mock data** in lieu of tests:

- `perf-mgmt/src/data/synthetic.ts` — large in-memory dataset used as app state seed
- `shramik-platform/src/data/mockData.ts` — static mock data imported directly by components
- `total-rewards-hub/src/data/seed/` — seed modules (`employees.ts`, `compensation.ts`, `benchmarks.ts`) seeded into an in-memory store via `src/lib/store.ts`

These data files function as development fixtures but are not used in any test setup.

## Fixtures and Factories

**Test Data:** No test fixtures or factory functions exist.

**Development Seed Data:**
```
perf-mgmt/src/data/
  synthetic.ts        # EMPLOYEES, GOALS, RATINGS, FEEDBACK_NOTES etc.
  goalLibrary.ts      # GOAL_LIBRARY template data
  connectorData.ts    # Connector KPI mappings

total-rewards-hub/src/data/seed/
  employees.ts        # Employee + Role seed records
  compensation.ts     # Compensation, benefits, LTI, tax, rewards, budgets
  benchmarks.ts       # Market benchmark data
  index.ts            # Re-exports all seed collections

shramik-platform/src/data/
  mockData.ts         # Workers, contractors, attendance, payroll
```

## Coverage

**Requirements:** None enforced — no coverage tooling configured.

**View Coverage:** Not available.

## Test Types

**Unit Tests:** Not present.

**Integration Tests:** Not present.

**E2E Tests:** Not present.

## Recommendations for Adding Tests

When tests are introduced, the following patterns would fit this codebase:

**Recommended Framework:** Vitest (already compatible with Vite projects; works with Next.js too)

**Suggested Config (Vite projects like perf-mgmt, shramik-platform):**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

**High-value test targets (pure functions already in codebase):**
- `perf-mgmt/src/utils/csvParser.ts` — `parseCSV()` is a pure function with no side effects; ideal for unit tests
- `perf-mgmt/src/store/AppContext.tsx` — `computeKPIScore()` and `reducer()` are pure functions testable without React
- `total-rewards-hub/src/lib/formatters.ts` — All formatting functions are pure; e.g., `formatINR()`, `formatLPA()`, `bandPosition()`, `compaRatioLabel()`
- `total-rewards-hub/src/lib/auth.ts` — `hasRole()`, `defaultRouteForRole()` are pure and easily testable
- `total-rewards-hub/src/lib/utils.ts` — `initials()`, `slugify()`, `paginate()` are pure utility functions

**Example test structure to follow (once Vitest is added):**
```typescript
// src/utils/csvParser.test.ts
import { describe, it, expect } from 'vitest'
import { parseCSV } from './csvParser'

describe('parseCSV', () => {
  it('returns empty headers and rows for empty input', () => {
    expect(parseCSV('')).toEqual({ headers: [], rows: [] })
  })

  it('parses a simple CSV correctly', () => {
    const result = parseCSV('name,age\nAlice,30')
    expect(result.headers).toEqual(['name', 'age'])
    expect(result.rows).toEqual([{ name: 'Alice', age: '30' }])
  })
})
```

**Placement convention to adopt:**
- Co-locate test files alongside source: `src/utils/csvParser.test.ts` next to `src/utils/csvParser.ts`
- Component tests: `src/components/ui/Button.test.tsx` next to `src/components/ui/Button.tsx`

---

*Testing analysis: 2026-03-17*
