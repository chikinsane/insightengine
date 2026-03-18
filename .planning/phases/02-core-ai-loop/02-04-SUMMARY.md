---
phase: 02-core-ai-loop
plan: 04
subsystem: query-api-visualization
tags: [api-route, recharts, dark-ui, enrichment, duckdb, neon]
dependency_graph:
  requires:
    - 02-02  # nl-to-sql, enrichment, duckdb-client
    - 02-01  # blob-store, schema inference types
    - 01-01  # db/schema (queries, resultsCache tables)
  provides:
    - POST /api/datasets/[id]/query (NL → SQL → DuckDB → enrichment → response)
    - ChartRenderer dispatcher (bar, line, pie, scatter, table)
    - InsightPanel with collapsible SQL
    - FollowUpChips clickable question chips
  affects:
    - Any consumer of query API (future dashboard/query UI)
tech_stack:
  added: []
  patterns:
    - Recharts ResponsiveContainer for all chart types
    - Dark tooltip pattern (contentStyle: backgroundColor #0f0f1a)
    - Violet/indigo palette: #6366f1 (bars), #8b5cf6 (lines), palette for pie cells
    - Belt-and-suspenders tenant isolation (DB query filter + runtime check)
    - 422 on exhausted retries, 400 on unconfirmed schema, 401 on unauth
key_files:
  created:
    - insightengine/src/app/api/datasets/[id]/query/route.ts
    - insightengine/src/components/charts/ChartRenderer.tsx
    - insightengine/src/components/charts/BarChartView.tsx
    - insightengine/src/components/charts/LineChartView.tsx
    - insightengine/src/components/charts/PieChartView.tsx
    - insightengine/src/components/charts/ScatterChartView.tsx
    - insightengine/src/components/charts/TableView.tsx
    - insightengine/src/components/query/InsightPanel.tsx
    - insightengine/src/components/query/FollowUpChips.tsx
  modified: []
decisions:
  - "File type inferred from dataset.name extension (.xlsx → xlsx, else csv) — avoids storing a separate type field in the datasets table when the name already carries the extension"
  - "Belt-and-suspenders tenant isolation: DB WHERE clause filters by userId AND runtime check dataset.userId !== userId — defense in depth against ORM query bugs"
  - "ChartRenderer title rendered inside each chart sub-component (not as a wrapper layer) — allows per-chart layout flexibility while keeping the card wrapper consistent"
  - "PieChart uses xKey as nameKey and yKey as valueKey mapping from chartConfig — consistent with bar/line convention where xKey=category axis, yKey=value axis"
  - "TableView caps at 100 rows displayed with footer note — avoids large DOM serialization in browser while still showing meaningful results"
  - "FollowUpChips uses button disabled prop + cursor-wait class — prevents double-submission while parent is loading without needing extra state management"
metrics:
  duration: "~15 min"
  completed_date: "2026-03-18"
  tasks: 2
  files_created: 9
  files_modified: 0
---

# Phase 02 Plan 04: Query API + Visualization Components Summary

**One-liner:** POST query route wires NL-to-SQL → DuckDB → parallel enrichment → Neon cache; 5 Recharts chart types with unified dark theme and follow-up chips complete the AI loop output side.

## Tasks Completed

| # | Task | Status | Key Files |
|---|------|--------|-----------|
| 1 | Build query API route | Done | `src/app/api/datasets/[id]/query/route.ts` |
| 2 | Build chart renderer, insight panel, follow-up chips | Done | `src/components/charts/`, `src/components/query/` |

## What Was Built

### Task 1: Query API Route (`POST /api/datasets/[id]/query`)

Full pipeline in a single request:

1. Authenticate via `getAuthenticatedUserId()` + `ensureUserExists()`
2. Tenant isolation: DB filter (`dataset.userId = userId`) + runtime double-check
3. Schema confirmation gate: returns 400 if `schema.confirmed !== true`
4. Validates `question` (required string, 1–500 chars); `previousContext` optional for follow-up queries
5. File type inferred from `dataset.name` extension
6. Downloads file from Netlify Blobs via `downloadBlob(userId, id)`
7. Calls `executeWithRetry(question, columns, rowCount, fileBuffer, id, fileType)` — NL → SQL → DML validation → column validation → DuckDB execution with up to 3 retries
8. Returns 422 with user-friendly message if all 3 retries fail
9. Calls `runParallelEnrichment(result, question)` — parallel Haiku calls for insight, vizType, follow-up questions
10. Persists query record to `queries` table and result to `results_cache` table
11. Returns structured JSON: `{ queryId, sql, explanation, result, enrichment }`
12. `maxDuration = 60` for Netlify; no `runtime = 'edge'` (Node.js Lambda for DuckDB + Blobs)

### Task 2: Visualization Components

**ChartRenderer** (`src/components/charts/ChartRenderer.tsx`):
- `switch(vizType)` dispatches to correct chart component
- Wraps all charts in `bg-[#0f0f1a] border border-white/[0.06] rounded-2xl p-6` dark card

**BarChartView** — Recharts BarChart, `fill="#6366f1"`, radius `[4,4,0,0]`, dark tooltip

**LineChartView** — Recharts LineChart, `stroke="#8b5cf6"`, strokeWidth 2, dot `fill="#6366f1"` r=3

**PieChartView** — Recharts PieChart, 8-color violet palette, percentage labels inside segments, Legend

**ScatterChartView** — Recharts ScatterChart, `fill="#6366f1"`, numeric XAxis/YAxis

**TableView** — HTML table, max 100 rows, `bg-[#0f0f1a]` header, scrollable for wide data, row count footer

**InsightPanel** — Violet sparkle icon + `text-white/70` insight text; collapsible "Show SQL" section with monospace `text-white/30`

**FollowUpChips** — "Follow-up questions" label + pill buttons matching DashboardClient example query style; `disabled` prop shows cursor-wait + reduced opacity

## Deviations from Plan

None — plan executed exactly as written.

## Verification Checklist

- [x] `POST` and `maxDuration = 60` exported from route.ts
- [x] Schema confirmation checked before any query execution
- [x] `executeWithRetry` called with correct 6 arguments
- [x] `runParallelEnrichment` called after query success
- [x] Query saved to `queries` table, result saved to `results_cache` table
- [x] 422 response on "Could not generate a valid query after 3 attempts"
- [x] Tenant isolation: `dataset.userId === userId` check exists
- [x] No `export const runtime = 'edge'`
- [x] ChartRenderer has `case 'bar'`, `case 'line'`, `case 'pie'`, `case 'scatter'`, `case 'table'`/default
- [x] BarChartView: `fill="#6366f1"`
- [x] LineChartView: `stroke="#8b5cf6"`
- [x] PieChartView: violet palette `['#6366f1', '#8b5cf6', ...]`
- [x] TableView: max 100 rows + "Showing 100 of N rows" footer
- [x] InsightPanel: violet sparkle icon + insight text + collapsible SQL
- [x] FollowUpChips: `onQuestionClick` prop wired, `disabled` state handled
- [x] All components have `'use client'` directive
- [x] All components use `bg-[#0f0f1a]` / `bg-[#07070f]` dark styling
