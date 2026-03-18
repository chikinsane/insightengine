---
phase: 02-core-ai-loop
plan: "01"
subsystem: ingestion
tags: [csv, excel, schema-inference, vitest, duckdb, netlify-blobs, papaparse, sheetjs]
dependency_graph:
  requires: []
  provides:
    - insightengine/src/types/query.ts
    - insightengine/src/lib/ingestion/csv-parser.ts
    - insightengine/src/lib/ingestion/excel-parser.ts
    - insightengine/src/lib/ingestion/schema-inference.ts
    - insightengine/src/lib/storage/blob-store.ts
  affects:
    - insightengine/next.config.ts
    - insightengine/netlify.toml
    - insightengine/vitest.config.ts
    - insightengine/package.json
tech_stack:
  added:
    - "@duckdb/node-api ^1.5.0"
    - "@anthropic-ai/sdk ^0.79.0"
    - "@netlify/blobs ^10.7.2"
    - "papaparse ^5.5.3"
    - "xlsx ^0.18.5"
    - "zod ^4.3.6"
    - "recharts ^3.8.0"
    - "swr ^2.4.1"
    - "react-dropzone ^15.0.0"
    - "react-hook-form ^7.71.2"
    - "@hookform/resolvers ^5.2.2"
    - "date-fns ^4.1.0"
    - "vitest ^4.1.0"
    - "@types/papaparse ^5.5.2"
  patterns:
    - "TDD: write failing tests, then implement"
    - "PapaParse with dynamicTyping: false for all-string CSV output"
    - "SheetJS sheet_to_json with header: 1 for positional array output"
    - "Leading-zero detection before numeric type inference"
    - "Currency stripping ($, EUR, GBP) before numeric check"
    - "Confidence tiers: HIGH (>95%), MEDIUM (currency), LOW (mixed/null)"
key_files:
  created:
    - insightengine/src/types/query.ts
    - insightengine/src/lib/ingestion/csv-parser.ts
    - insightengine/src/lib/ingestion/excel-parser.ts
    - insightengine/src/lib/ingestion/schema-inference.ts
    - insightengine/src/lib/storage/blob-store.ts
    - insightengine/vitest.config.ts
    - insightengine/netlify.toml
    - insightengine/src/lib/ingestion/csv-parser.test.ts
    - insightengine/src/lib/ingestion/excel-parser.test.ts
    - insightengine/src/lib/ingestion/schema-inference.test.ts
  modified:
    - insightengine/next.config.ts
    - insightengine/package.json
    - insightengine/package-lock.json
decisions:
  - "Threshold for LOW confidence numeric set to >=0.6 (not >0.7) — 2/3 sample passes test spec requiring 'abc' in 3-value column to still infer as number:LOW"
  - "Leading-zero detection uses regex /^0\\d/ — catches ZIP codes and padded IDs before numeric inference"
  - "Currency stripping applied only to MEDIUM confidence path — if currency symbols present and all-numeric after strip, return MEDIUM not HIGH"
  - "serverExternalPackages includes both @duckdb/node-api and @duckdb/node-bindings in next.config.ts for Next.js 16 native module handling"
metrics:
  duration_seconds: 221
  tasks_completed: 2
  files_created: 10
  files_modified: 3
  tests_added: 22
  completed_date: "2026-03-18"
---

# Phase 2 Plan 01: Dependencies, Type Contracts, and Ingestion Engine Summary

**One-liner:** PapaParse CSV + SheetJS Excel parsers with leading-zero-aware schema inference engine, confidence scoring, and Netlify Blobs abstraction — all Phase 2 type contracts defined.

## What Was Built

### Task 1: Dependencies, Vitest, Native Module Bundling

- Installed 12 production deps and 4 dev deps for Phase 2
- `next.config.ts` updated with `serverExternalPackages: ['@duckdb/node-api', '@duckdb/node-bindings']` for server-side native module isolation
- `netlify.toml` created with `node_bundler = "nft"` and `external_node_modules` for DuckDB — prevents Netlify from bundling native `.node` binaries
- `vitest.config.ts` created: node environment, `src/**/*.test.ts` glob, `@` alias to `./src`
- `package.json` gains `test` and `test:watch` scripts

### Task 2: Type Contracts + TDD Ingestion Engine

**Types defined** in `src/types/query.ts`:
- `VizType`, `ConfidenceLevel`, `SchemaColumn`, `ColumnMeta`, `QueryResult`, `EnrichmentResult`, `ValidationResult`

**CSV Parser** (`csv-parser.ts`):
- `parseCSVBuffer(buffer: Buffer): Promise<ColumnMeta>` — PapaParse with `dynamicTyping: false`; returns first row as headers, rest as `string[][]`; empty buffer returns `{headers:[], rows:[]}`

**Excel Parser** (`excel-parser.ts`):
- `parseExcelBuffer(buffer: Buffer): ColumnMeta` — SheetJS `read(buffer, {type:'buffer'})`, `sheet_to_json({header:1, defval:''})`, all values cast to String

**Schema Inference** (`schema-inference.ts`):
- `inferColumnType(values)` — leading-zero detection first, then boolean, date, currency-stripped numeric, string fallback
- `inferSchema(headers, rows, sampleSize=200)` — samples first 200 rows, computes sampleValues (first 5 non-null), nullRate
- Confidence tiers: HIGH (>95% pattern match), MEDIUM (currency-formatted numbers), LOW (mixed or all-null)

**Blob Store** (`blob-store.ts`):
- `uploadBlob(userId, datasetId, buffer, metadata)` — key pattern `${userId}/${datasetId}` in `user-uploads` store
- `downloadBlob(userId, datasetId)` — throws if not found
- `deleteBlob(userId, datasetId)`

## Test Results

```
Test Files: 3 passed
Tests:      22 passed (4 CSV, 4 Excel, 14 schema-inference)
Duration:   ~350ms
```

All edge cases covered:
- Leading zeros (`01234`) → string, not number
- Mixed numeric/string (`100,abc,200`) → number, LOW
- All-null column → string, LOW
- Currency values (`$1,234.00`) → number, MEDIUM
- ISO dates (`2024-01-01`) → date, HIGH
- Boolean values (`true/false`, `yes/no`) → boolean, HIGH
- sampleValues populated with first 5 non-null values
- nullRate computed as fraction of empty/null cells

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adjusted numeric LOW confidence threshold**
- **Found during:** Task 2 TDD GREEN phase
- **Issue:** Plan spec states ">0.7 -> number LOW" but test case `['100','abc','200']` yields 2/3 = 66.7% which does not satisfy >0.7
- **Fix:** Changed threshold from `> 0.7` to `>= 0.6` — captures the majority-numeric case while still requiring more than half to be numeric
- **Files modified:** `insightengine/src/lib/ingestion/schema-inference.ts`
- **Commit:** `5302e02`

## Self-Check: PASSED

All 7 key files exist on disk. All 3 task commits verified in git log (a42d555, e0ca601, 5302e02).
