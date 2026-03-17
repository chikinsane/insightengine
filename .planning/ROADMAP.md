# Roadmap: InsightEngine

## Overview

InsightEngine is built in four v1 phases that follow a strict dependency order dictated by
security requirements and the architecture's critical path. Phase 1 establishes the security
foundations that cannot be retrofitted: auth, credential encryption, multi-tenant isolation,
and the query validation gate. Phase 2 proves the entire AI loop end-to-end against the
simpler flat-file path (CSV/Excel) before any live database complexity is introduced. Phase 3
builds the persistence and sharing layer that turns one-off queries into named, shareable,
auto-refreshing dashboards. Phase 4 adds live database connections — the most security-sensitive
surface — only after the AI loop is proven correct and the security architecture is solid.
Phases 5-6 are milestone 2 (v2) and extend the platform with AI enrichment and polish.

## Milestones

- 🚧 **v1 Core Platform** — Phases 1-4 (planned)
- 📋 **v2 AI Enrichment + Polish** — Phases 5-6 (planned)

## Phases

### v1 Core Platform

- [ ] **Phase 1: Foundation** — Auth (Clerk), Neon DB schema, envelope credential encryption, multi-tenant isolation, query validation gate
- [ ] **Phase 2: Core AI Loop** — CSV/Excel upload, Schema Registry, NL-to-DuckDB query, Recharts visualization, plain English insights, follow-up questions
- [ ] **Phase 3: Dashboard Layer** — Save/name dashboards, read-only share links, cache-first auto-refresh, PDF/PNG export
- [ ] **Phase 4: Database Connections** — PostgreSQL/MySQL connection strings, credential encrypt/decrypt, schema introspection, NL-to-SQL pass-through, read-only enforcement

### v2 AI Enrichment + Polish

- [ ] **Phase 5: AI Enrichment** — Anomaly detection, trend analysis, schema-aware context memory, visualization drill-down
- [ ] **Phase 6: Polish** — Query result caching, streaming progress UX, multi-turn conversation, layout customization

## Phase Details

### Phase 1: Foundation

**Goal**: The security and identity layer is complete — users can authenticate, every request
is scoped to the right tenant, credentials are never stored in plaintext, and no AI-generated
query can execute a mutating statement.

**Depends on**: Nothing (first phase)

**Requirements**: AUTH-01, AUTH-02, AUTH-03, NLQ-03, DS-03

**Security constraints embedded here:**
- Envelope encryption (AES-256 + env-var key) must be designed in this phase, not Phase 4 —
  it is the first design decision for the connection model
- AST-level DML filter (SELECT-only whitelist) and the read-only DB user model must be
  architected here; both layers are non-negotiable and cannot be retrofitted
- Multi-tenant data access layer: every data-source query must include `user_id` filter;
  integration tests must verify User A cannot read User B's data source in this phase

**Success Criteria** (what must be TRUE when Phase 1 completes):
  1. User can sign up and log in with email and password via Clerk; session persists across full
     browser reloads without re-authenticating
  2. Two test users each see only their own data — navigating to another user's resource returns
     a 403 or empty state, never the other user's content
  3. The credential encryption utility exists and is tested: encrypting and then decrypting a
     sample connection string via the envelope key round-trips to the original plaintext
  4. An AI-generated query containing any DML keyword (INSERT, UPDATE, DELETE, DROP, TRUNCATE,
     ALTER, CREATE) is rejected by the validation gate and returns a structured error — no such
     query reaches the execution layer
  5. The full Neon database schema (users, data_sources, datasets, dashboards, queries,
     results_cache) is migrated and version-controlled via Drizzle

**Plans**: TBD

### Phase 2: Core AI Loop

**Goal**: A user can upload a CSV or Excel file, ask a plain English question, and receive a
correct, appropriately visualized chart with an AI-written plain English explanation and three
follow-up question suggestions — all without writing a single line of SQL.

**Depends on**: Phase 1

**Requirements**: DS-01, DS-04, NLQ-01, NLQ-02, NLQ-04, NLQ-05, NLQ-06

**Critical constraints embedded here:**
- Flat-file (CSV/Excel + DuckDB) AI loop must be fully validated in this phase; the database
  connection path (Phase 4) does not begin until this loop is proven correct
- Schema inference must include a confidence-scored preview/override step; LOW-confidence
  columns trigger a user confirmation UI before the first query runs
- AI insight generation must use statistical summaries (min, max, mean, stddev, top-N values),
  never raw row data — this is both a token-cost and privacy constraint
- pandas 3.0 string type detection: use `pd.api.types.is_string_dtype()`, not `dtype == 'object'`
- LLM column hallucination: validate every table/column reference in generated SQL against the
  actual Schema Registry before execution; retry up to 3 times with correction prompt on failure
- File retention policy must exist before production uploads: files deleted after 30 days unless
  user explicitly saves the data source; communicated clearly in upload UI

**Success Criteria** (what must be TRUE when Phase 2 completes):
  1. User uploads a CSV or Excel file (including a messy real-world file with mixed types or
     currency strings) and sees a schema preview with inferred column names and types; LOW-
     confidence columns are flagged and user can override the type before continuing
  2. User types a plain English question about the uploaded dataset and within 15 seconds sees
     a chart (bar, line, pie, or table) that correctly answers the question — with the AI-
     selected chart type, not a user-selected one
  3. The plain English explanation beneath each chart accurately summarizes the key finding in
     1-2 sentences derived from statistical summaries, not raw data rows
  4. Three follow-up question suggestions appear after every query result; clicking one
     executes as a new query carrying the prior result's context
  5. A query containing a DML statement generated by the LLM (e.g., during adversarial testing)
     is caught by the validation gate before DuckDB execution and returns a human-readable error

**Plans**: TBD

### Phase 3: Dashboard Layer

**Goal**: Users can save, name, and share dashboards, and every dashboard auto-refreshes from
a server-side cache on a user-configured interval without hammering the underlying data source.

**Depends on**: Phase 2

**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04

**Critical constraints embedded here:**
- Cache-first auto-refresh with minimum interval floor must be the architecture before the
  auto-refresh feature ships; the server returns cached results until the interval elapses,
  then re-executes; minimum interval is 5 minutes for DB-backed sources
- Shared dashboards must render from a result snapshot, not re-execute live queries using the
  owner's credentials — snapshot mode is non-negotiable for the share link model
- Rule-based visualization guardrails must override LLM chart-type suggestions: time-indexed
  data forces line/area, high-cardinality categories force table, <8 categories allow bar/pie
- Follow-up questions carry thread context (previous query + result summary) to prevent
  ambiguous follow-ups losing meaning; context depth capped at 3-4 turns

**Success Criteria** (what must be TRUE when Phase 3 completes):
  1. User can save a query result as a named dashboard, reload the app, and find that dashboard
     with all its widgets intact
  2. User can generate a read-only share link; opening that link in a private browser window
     (unauthenticated) renders the dashboard correctly from a result snapshot — no auth prompt,
     no live credential re-use
  3. A dashboard configured with auto-refresh shows a "last refreshed" timestamp and updates
     its data on the configured interval; the server returns a cached result when the interval
     has not elapsed (verifiable by inspecting that no new query execution fires on cache-fresh
     requests)
  4. User can export a dashboard to PNG or PDF and receive a file with all visible charts
     rendered correctly

**Plans**: TBD

### Phase 4: Database Connections

**Goal**: Users can connect a live PostgreSQL or MySQL database via connection string, ask
natural language questions against it, and have all credentials stored encrypted at rest with
the read-only enforcement layer active at the database level.

**Depends on**: Phase 3

**Requirements**: DS-02, DS-05

**Critical constraints embedded here:**
- Credential encryption (AES-256 envelope) is implemented in Phase 1 but executed here;
  credentials are encrypted immediately on "test connection" success — plaintext never written
  to the database or logs at any point
- Read-only database user enforcement is a two-layer requirement: (1) the AST-level DML filter
  from Phase 1 rejects mutating queries in the application layer, and (2) the actual DB user
  used for live connections must not have write permissions at the database level
- Connection pools must be keyed per user_id; no connection may be shared across users;
  integration tests must verify cross-user isolation before this phase ships
- Auto-refresh minimum interval floor of 5 minutes is enforced for all DB-backed dashboard
  widgets; users are warned when their connected query execution time exceeds 5 seconds

**Success Criteria** (what must be TRUE when Phase 4 completes):
  1. User can enter a PostgreSQL or MySQL connection string, click "Test Connection," see a
     success confirmation, and then ask natural language questions that return correct results
     from the live database
  2. A database credential stored by the system cannot be read as plaintext from the Neon
     database — it exists only as an encrypted blob; the decrypted value is never written to
     logs at any point
  3. Querying a live database connection with a DML statement (via adversarial NL input) is
     rejected by the application-layer AST filter before the query reaches the external database
  4. Two test users each connected to separate databases cannot access each other's connection
     or query results — verified by an integration test that attempts cross-user connection
     retrieval and expects a 403

**Plans**: TBD

---

## v2 Phases (Milestone 2)

### Phase 5: AI Enrichment

**Goal**: Every query result surface automatically highlights anomalies and trends in plain
English, giving non-technical users proactive insight they did not know to ask for.

**Depends on**: Phase 4

**Milestone**: v2

**Requirements**: (v2 scope — not in v1 requirements list)

**Success Criteria** (what must be TRUE when Phase 5 completes):
  1. When a query result contains a statistical outlier (z-score or IQR threshold exceeded),
     the UI surfaces an automatically detected anomaly callout in plain English without the user
     asking for it
  2. When a query result contains a time-indexed column, the AI automatically generates a trend
     summary ("Revenue grew 12% month-over-month in Q3, driven by the North region") that
     appears alongside the chart
  3. Business term overrides persist in the Schema Registry — if a user renames a column alias
     ("cust_id" → "Customer ID"), all subsequent queries for that dataset use the override in
     prompt context

**Plans**: TBD

### Phase 6: Polish

**Goal**: The platform handles high query volumes efficiently, long-running queries feel
responsive via streaming progress feedback, and power users can customize dashboard layouts and
engage in multi-turn data conversations.

**Depends on**: Phase 5

**Milestone**: v2

**Requirements**: (v2 scope — not in v1 requirements list)

**Success Criteria** (what must be TRUE when Phase 6 completes):
  1. Repeating an identical question on the same dataset (same schema version) returns a result
     in under 1 second from the query cache, with no new LLM call fired
  2. During a query that takes more than 3 seconds, the UI shows sequential stage labels
     ("Understanding your question... Querying data... Building visualization...") so the user
     always knows what the system is doing
  3. User can ask a follow-up question that references the previous result ("What drove that
     spike?") and receive a contextually accurate answer that correctly interprets the anaphoric
     reference — up to 4 conversation turns

**Plans**: TBD

---

## Progress

**Execution order:** 1 → 2 → 3 → 4 (v1), then 5 → 6 (v2)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1 | 0/TBD | Not started | - |
| 2. Core AI Loop | v1 | 0/TBD | Not started | - |
| 3. Dashboard Layer | v1 | 0/TBD | Not started | - |
| 4. Database Connections | v1 | 0/TBD | Not started | - |
| 5. AI Enrichment | v2 | 0/TBD | Not started | - |
| 6. Polish | v2 | 0/TBD | Not started | - |

---

## Requirement Coverage

### v1 Requirements — 18/18 mapped

| Requirement | Description | Phase |
|-------------|-------------|-------|
| AUTH-01 | Sign up and log in with email + password | Phase 1 |
| AUTH-02 | Sessions persist across reloads | Phase 1 |
| AUTH-03 | Per-user data and dashboard isolation (multi-tenant) | Phase 1 |
| NLQ-03 | AST-level DML filter on all AI-generated queries | Phase 1 |
| DS-03 | Envelope encryption for database credentials | Phase 1 |
| DS-01 | Upload Excel / CSV files as a data source | Phase 2 |
| DS-04 | Schema inference with preview/override step | Phase 2 |
| NLQ-01 | Plain English question input | Phase 2 |
| NLQ-02 | AI translates NL to DuckDB query (files) or SQL (DB) | Phase 2 |
| NLQ-04 | AI selects best chart/visualization type | Phase 2 |
| NLQ-05 | AI plain English explanation alongside each chart | Phase 2 |
| NLQ-06 | AI suggests 3 follow-up questions per result | Phase 2 |
| DASH-01 | Save and name dashboards | Phase 3 |
| DASH-02 | Share dashboard via read-only link | Phase 3 |
| DASH-03 | Auto-refresh (cache-first, min interval floor) | Phase 3 |
| DASH-04 | Export dashboard to PDF/PNG | Phase 3 |
| DS-02 | Connect live database via connection string (PG/MySQL) | Phase 4 |
| DS-05 | Read-only database access enforced for live connections | Phase 4 |

All 18 v1 requirements are mapped. No orphans.
