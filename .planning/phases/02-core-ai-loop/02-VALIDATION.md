---
phase: 2
slug: core-ai-loop
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-17
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (installed in Wave 1 / Plan 02-01) |
| **Config file** | `insightengine/vitest.config.ts` (created in Plan 02-01) |
| **Quick run command** | `cd insightengine && npx vitest run --reporter=verbose 2>&1 | tail -20` |
| **Full suite command** | `cd insightengine && npx vitest run 2>&1` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd insightengine && npx vitest run --reporter=verbose 2>&1 | tail -20`
- **After every plan wave:** Run `cd insightengine && npx vitest run 2>&1`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 02-01-01 | 01 | 1 | DS-01, DS-04 | unit | `npx vitest run src/lib/ingestion/` | ⬜ pending |
| 02-01-02 | 01 | 1 | DS-01, DS-04 | unit | `npx vitest run src/lib/ingestion/` | ⬜ pending |
| 02-02-01 | 02 | 1 | NLQ-02 | unit | `npx vitest run src/lib/query/` | ⬜ pending |
| 02-02-02 | 02 | 1 | NLQ-04, NLQ-05, NLQ-06 | unit | `npx vitest run src/lib/query/` | ⬜ pending |
| 02-03-01 | 03 | 2 | DS-01 | integration | `npx vitest run src/app/api/datasets/` | ⬜ pending |
| 02-03-02 | 03 | 2 | DS-04 | manual | See manual section | ⬜ pending |
| 02-04-01 | 04 | 2 | NLQ-01, NLQ-02 | integration | `npx vitest run src/app/api/query/` | ⬜ pending |
| 02-04-02 | 04 | 2 | NLQ-04, NLQ-05, NLQ-06 | manual | See manual section | ⬜ pending |
| 02-05-01 | 05 | 3 | NLQ-01, DS-01 | manual | See manual section | ⬜ pending |
| 02-05-02 | 05 | 3 | DS-01, DS-04 | manual | See manual section | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `insightengine/vitest.config.ts` — Vitest config (created in Plan 02-01, Task 1)
- [ ] `insightengine/src/lib/ingestion/__tests__/parser.test.ts` — CSV/Excel parser unit tests
- [ ] `insightengine/src/lib/ingestion/__tests__/schema.test.ts` — Schema inference unit tests
- [ ] `insightengine/src/lib/query/__tests__/validator.test.ts` — DML gate unit tests
- [ ] `insightengine/src/lib/query/__tests__/nl-to-sql.test.ts` — NL-to-SQL unit tests (mock LLM)
- [ ] `insightengine/src/app/api/datasets/__tests__/route.test.ts` — Upload API integration tests
- [ ] `insightengine/src/app/api/query/__tests__/route.test.ts` — Query API integration tests

All created by Plan 02-01, Task 1 (infrastructure setup).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Schema preview UI shows LOW-confidence flags with override controls | DS-04 | Visual UI component; requires browser interaction | Upload a CSV with currency columns (e.g., "$1,234.56"); verify flagged columns appear in amber with type-override dropdown |
| Chart renders correctly from query result | NLQ-04 | Recharts visual rendering; not unit-testable | Ask "show revenue by month" against sample data; verify bar chart appears with correct axes |
| Plain English insight appears below chart | NLQ-05 | LLM output quality; manual review required | Verify insight paragraph references actual numbers from the result, not generic text |
| Follow-up chips execute new query | NLQ-06 | Click interaction + new query flow | Click a follow-up chip; verify new chart loads within 15 seconds |
| End-to-end: upload → ask → chart in <15s | NLQ-01 | Full integration; browser timing required | Time from upload completion to chart visible; must be ≤15 seconds |
| DML injection caught and surfaced | NLQ-02 | Adversarial test; requires crafted prompt | Ask "drop the table" or equivalent; verify human-readable error returned, not DuckDB crash |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-17
