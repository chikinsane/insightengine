---
phase: 02-core-ai-loop
plan: "02"
subsystem: query-engine
tags:
  - duckdb
  - anthropic
  - sql-validation
  - enrichment
  - tdd
dependency_graph:
  requires:
    - 02-01 (shared types query.ts — stub created here, will be replaced by Plan 01)
  provides:
    - query/query-validator: DML whitelist gate used by NL-to-SQL retry loop
    - query/duckdb-client: in-memory DuckDB executor over file buffers
    - query/result-formatter: QueryResult + statistical summaries
    - ai/anthropic-client: Anthropic SDK singleton
    - ai/prompts: system prompts + schema context builder
    - ai/nl-to-sql: NL → SQL with 3-attempt retry via structured outputs
    - ai/enrichment: parallel insight/viz/followups pipeline
  affects:
    - 02-03 (upload API route uses executeQueryOnFile + validateSQL)
    - 02-04 (query API route uses executeWithRetry + runParallelEnrichment)
tech_stack:
  added:
    - "@duckdb/node-api@^1.5.0 — in-memory DuckDB for server-side query execution"
    - "@anthropic-ai/sdk@^0.79.0 — NL-to-SQL + enrichment via Claude structured outputs"
    - "@netlify/blobs@^10.7.2 — persistent blob store for uploaded files"
    - "zod@^4.3.6 — structured output schema validation"
    - "vitest@^4.1.0 — test runner"
  patterns:
    - "TDD red-green for all pure logic (validator, guardrails)"
    - "zodOutputFormat with messages.parse() for guaranteed SQL schema"
    - "Promise.allSettled for parallel enrichment (graceful degradation)"
    - "Two-layer SQL validation: FORBIDDEN_DML regex then REQUIRE_SELECT regex"
key_files:
  created:
    - insightengine/src/types/query.ts
    - insightengine/src/lib/query/query-validator.ts
    - insightengine/src/lib/query/query-validator.test.ts
    - insightengine/src/lib/query/duckdb-client.ts
    - insightengine/src/lib/query/result-formatter.ts
    - insightengine/src/lib/ai/anthropic-client.ts
    - insightengine/src/lib/ai/prompts.ts
    - insightengine/src/lib/ai/nl-to-sql.ts
    - insightengine/src/lib/ai/nl-to-sql.test.ts
    - insightengine/src/lib/ai/enrichment.ts
    - insightengine/src/lib/ai/enrichment.test.ts
  modified:
    - insightengine/package.json (added 5 new dependencies)
decisions:
  - "zodOutputFormat via messages.parse() with output_config.format — not the beta API or raw JSON parse"
  - "applyVizGuardrails is pure (no LLM call) — deterministic guardrails override LLM suggestions"
  - "isDateColumn heuristic requires date-string regex match to avoid false positives on numeric epoch values"
  - "vitest installed as @^4.1.0 — matches existing vitest.config.ts already in project"
  - "HAIKU_MODEL for enrichment calls (insight/viz/followups) — cost efficiency for sub-second tasks"
metrics:
  duration_minutes: 6
  completed_date: "2026-03-17"
  tasks_completed: 2
  files_created: 11
---

# Phase 02 Plan 02: AI Query Engine Summary

**One-liner:** DuckDB in-memory query engine with two-layer DML validator, Anthropic structured-output NL-to-SQL with 3-attempt retry loop, and parallel enrichment pipeline (insight from stat summary, viz guardrails, 3 follow-up questions).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build query validator, DuckDB client, and result formatter | 2fd5eb8 | query-validator.ts, duckdb-client.ts, result-formatter.ts, query.ts |
| 2 | Build Anthropic client, NL-to-SQL engine, and enrichment pipeline | ff55b75 | anthropic-client.ts, prompts.ts, nl-to-sql.ts, enrichment.ts + tests |

## Verification Results

- `npx vitest run src/lib/query/` — 18 tests pass (all DML keywords, valid SELECTs, column references)
- `npx vitest run src/lib/ai/` — 15 tests pass (NL-to-SQL, retry loop, all guardrail rules, parallel enrichment)
- `FORBIDDEN_DML` regex gate confirmed in query-validator.ts
- `zodOutputFormat` confirmed in nl-to-sql.ts
- `Promise.allSettled` confirmed in enrichment.ts
- `buildStatSummary` (not raw rows) confirmed as enrichment input

## Decisions Made

1. **zodOutputFormat via messages.parse()** — Used `output_config.format: zodOutputFormat(schema)` with the non-beta `client.messages.parse()` API (not `client.beta.messages`). This matches the current SDK docs and avoids beta API drift.

2. **applyVizGuardrails is pure** — No LLM call in guardrails. Rules are deterministic and override any LLM suggestion. Guardrail priority: line > table (>8 cats) > scatter > pie > bar > table.

3. **isDateColumn heuristic fix** — Required date-string regex (`YYYY-MM-DD` pattern etc.) before `Date.parse()` to prevent numeric values like `0, 1, 2` from being classified as dates (epoch millisecond parsing was a false positive). This was a Rule 1 bug fix during GREEN phase.

4. **Claude Haiku for enrichment** — insight/vizType/followUps use `claude-haiku-4-5` for cost efficiency; NL-to-SQL uses `claude-sonnet-4-5-20250929` for accuracy.

5. **types/query.ts stub** — Created as a stub since Plan 01 (which owns this file) runs in same wave. The stub matches the Plan 01 type contract exactly; Plan 01 can overwrite safely.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed isDateColumn false positives on numeric values**
- **Found during:** Task 2, GREEN phase (viz guardrail tests for "line" and "table" rules failing)
- **Issue:** `Date.parse(String(1))` returns a valid epoch timestamp. Numeric row values like `0, 1, 2...` were passing the date column heuristic, causing the `value` column in category+numeric test data to be classified as a date column. This triggered Rule 1 ("line") instead of Rule 2 (">8 categories → table") or Rule 5 ("bar").
- **Fix:** Added a `DATE_STRING_PATTERN` regex requiring actual ISO date strings or common date formats before calling `Date.parse()`. Also refactored `applyVizGuardrails` to use explicit type metadata first and only apply heuristics to `'unknown'` or `'string'` typed columns.
- **Files modified:** `insightengine/src/lib/ai/enrichment.ts`
- **Commit:** ff55b75

## Self-Check: PASSED

All files created and commits verified:
- FOUND: insightengine/src/lib/query/query-validator.ts
- FOUND: insightengine/src/lib/query/duckdb-client.ts
- FOUND: insightengine/src/lib/query/result-formatter.ts
- FOUND: insightengine/src/lib/ai/anthropic-client.ts
- FOUND: insightengine/src/lib/ai/nl-to-sql.ts
- FOUND: insightengine/src/lib/ai/enrichment.ts
- FOUND: insightengine/src/lib/ai/prompts.ts
- FOUND: insightengine/src/types/query.ts
- Commit 2fd5eb8: feat(02-02): build query validator, DuckDB client, and result formatter
- Commit ff55b75: feat(02-02): build Anthropic client, NL-to-SQL engine, and enrichment pipeline
