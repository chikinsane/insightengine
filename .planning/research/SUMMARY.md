# Project Research Summary

**Project:** InsightEngine — Gen AI Data & Dashboard Platform
**Domain:** NL-to-Query BI / Gen AI Data Analytics
**Researched:** 2026-03-17
**Confidence:** MEDIUM (stack partially verified via official docs; architecture HIGH confidence; features and pitfalls MEDIUM-HIGH)

## Executive Summary

InsightEngine is a non-technical-user-focused Gen AI analytics platform that translates natural language questions into SQL or pandas queries against user-supplied data (CSV/Excel uploads and live database connections), renders AI-selected visualizations, and generates plain English insight narratives. The established pattern for products like this is a **layered pipeline architecture** with a mandatory Python/FastAPI backend for data processing and LLM orchestration, and a Next.js frontend for the dashboard UI — the two runtimes cannot be collapsed into one because LangChain's SQL toolkit and pandas live in Python. They communicate via REST/JSON. The critical path for v1 is: auth → data source ingestion → schema extraction → NL-to-query pipeline → result rendering → chart + insight → save + share.

The recommended approach is to build and validate the flat-file (CSV/Excel) path first, end-to-end, before introducing external database connections. This approach de-risks the core AI loop against a controlled data source, surfaces schema inference issues early, and avoids credential security complexity until the product shape is confirmed. LangChain 0.3.x provides the NL-to-SQL scaffolding (schema introspection, retry loops, query validation) that would otherwise take weeks to hand-roll. GPT-4o is the recommended primary LLM for v1 because its Structured Outputs API guarantees valid JSON for chart specifications — the LLM layer is swappable via LangChain's provider abstraction.

The highest-severity risks are not product or UX risks — they are security risks that are architectural in nature and cannot be retrofitted. Three must be addressed before any user data touches the system: (1) AI-generated SQL must pass through a query validation gate and be executed by a read-only database user, (2) database credentials must be AES-256 encrypted at rest before any connection model is designed, and (3) multi-tenant isolation must be enforced such that User A cannot access User B's data source. Prompt injection via malicious CSV cell values is an additional Phase 1 concern — raw data values must never be embedded in LLM prompts.

---

## Key Findings

### Recommended Stack

The stack splits cleanly across two runtimes. The **Python backend** (FastAPI 0.115.x, Python 3.12, LangChain 0.3.x, pandas 3.0.x, SQLAlchemy 2.0.x) handles all data processing, LLM orchestration, and database connectors. The **Next.js 16.1.7 frontend** (React 19, TypeScript 5, Tailwind CSS v4, Recharts + shadcn/ui charts) handles the interactive dashboard UI. Platform metadata (users, dashboards, saved queries, data source config) lives in Neon serverless PostgreSQL, accessed via Drizzle ORM from the Next.js side. Auth is handled by Clerk, which provides Next.js-native components and eliminates 2-3 weeks of auth plumbing. File storage uses Vercel Blob (S3-backed) for uploaded CSV/Excel files.

The architecture research recommends DuckDB (via Node.js duckdb-async binding) as the query engine for flat files — it converts uploaded files to Parquet at ingest time and executes SQL in-process at query time, handling files up to ~500MB with sub-second performance without an external service. See STACK.md for full versions, installation commands, and alternatives considered.

**Core technologies:**
- **FastAPI + Python 3.12**: Backend runtime — async-native, typed endpoints, OpenAPI docs, required for pandas/LangChain
- **LangChain 0.3.x + GPT-4o**: NL-to-SQL orchestration — handles schema introspection, retry loops, Structured Outputs for chart spec generation
- **pandas 3.0.x + DuckDB**: Data ingestion and flat-file query execution — industry standard CSV/Excel handling + columnar in-process SQL
- **Next.js 16.1.7 (App Router)**: Frontend — Server Components for streaming, API routes for auth, Vercel-native deployment
- **Recharts + shadcn/ui Charts**: Visualization — React-native, composable, pre-built accessible chart components
- **Neon + Drizzle ORM**: Platform database — serverless Postgres, Vercel-recommended, TypeScript-first ORM without Prisma's binary overhead
- **Clerk**: Auth — pre-built Next.js components, 10,000 MAU free tier, eliminates manual session/provider wiring
- **APScheduler 3.x**: Dashboard auto-refresh scheduling — in-process, PostgreSQL-backed, no broker required for v1

### Expected Features

Research across 12 competitive products (ThoughtSpot, Tableau Pulse, Power BI Copilot, Databricks AI/BI, Julius AI, Rows.com, Metabase, Hex, Sigma, Mode, Domo, Looker Studio) identifies a clear gap InsightEngine fills: no SMB-tier product combines file upload, database connection, NL questions, AND auto-refreshing dashboards with AI insights in a single frictionless experience. See FEATURES.md for the full competitive matrix.

**Must have (table stakes) — missing = product feels broken:**
- Natural language question input with schema-aware query translation
- AI-generated SQL / pandas execution against uploaded files and DB connections
- Interactive charts (bar, line, pie, scatter) + table view fallback
- AI-selected chart type (users must not pick chart types manually)
- File upload (CSV, .xlsx, .xls) with encoding and multi-sheet handling
- Database connection (PostgreSQL and MySQL minimum)
- Plain English insight explanations alongside every chart
- Dashboard save, naming, and sharing via link
- User authentication (email/password + Google OAuth)
- Loading and progress states for 3-15 second AI queries
- Human-readable error messages (no SQL errors surfaced to users)
- Auto-refresh on configurable interval

**Should have (differentiators for competitive moat):**
- Follow-up question suggestions (3-5 contextually relevant next questions per result)
- Anomaly / outlier detection surfaced automatically with English explanation
- Data freshness indicator per data source
- Trend analysis with auto-generated natural language summary
- Query history and replay
- AI-generated dashboard titles and descriptions
- Schema-aware context memory (business terms map to columns)

**Defer to v2+:**
- Multi-source dashboard (CSV + live DB join in one view)
- Multi-turn conversation (query context threading)
- Scheduled email delivery
- Visualization drill-down / cross-filter
- Column/data glossary
- Export to PDF/image
- Dashboard layout customization
- Embedded sharable widget (iframe embed)

**Anti-features — do not build:**
- Custom SQL editor or code view (contradicts no-code promise)
- Real-time streaming data (Kafka/WebSockets — polling suffices)
- ETL / transformation pipeline builder (separate product category)
- RBAC / row-level security (v1 needs owner vs viewer only)
- Mobile native app (responsive web covers the use case)

### Architecture Approach

InsightEngine follows a **layered pipeline architecture** in which data flows through six vertical layers: Client → Next.js API Layer → Service Layer (Ingestion, NL-to-Query Pipeline, Dashboard) → Data Store Layer (PostgreSQL, DuckDB ephemeral, File Storage) with an AI Enrichment Layer running in parallel to the query execution path. The key architectural insight is that AI enrichment (insight narration, anomaly detection, viz recommendation, follow-up generation) fires as parallel `Promise.all` calls after query results are returned — not sequentially — reducing perceived latency from 4-8 seconds to 1-2 seconds. The dashboard renderer is a pure display layer: it never executes queries, only fetches pre-computed `QueryResult` objects from the API.

**Major components:**
1. **Ingestion Service** — Parses XLSX/CSV with pandas, converts to Parquet, infers schema (column names, types, sample values), registers DB connections with encrypted credentials, populates Schema Registry
2. **Schema Registry** — Stores column names, types, sample values, row counts per dataset; provides pre-built schema context strings for LLM prompts; caches per dataset, invalidated only on re-upload
3. **NL-to-Query Pipeline** — Accepts (NL question, datasetId) → injects schema context → calls LLM → validates query via AST → executes via Query Executor → formats result → triggers parallel AI enrichment
4. **Query Executor** — Routes to DuckDB (flat files via Parquet) or pass-through SQL (external DB connections); enforces SELECT-only whitelist; enforces LIMIT and timeout caps
5. **AI Enrichment Layer** — Parallel LLM calls for insight narration, anomaly detection, viz type recommendation, follow-up questions; operates on statistical summaries, not raw row data; 3-second timeout per call
6. **Dashboard Service** — CRUD for dashboards, widget layouts, share token generation (signed JWT), refresh schedule management
7. **Dashboard Renderer (client)** — Recharts-based, client-side, SWR-polled, pure display; renders from cached QueryResult objects; no direct query execution

**Build order from ARCHITECTURE.md (dependency-constrained):** Auth → DB schema + ORM → File storage → Ingestion (flat files) → Schema Registry → LLM Service wrapper → NL-to-Query pipeline (flat file path) → AI Enrichment → Dashboard Service → Dashboard Renderer → Auto-refresh → Ingestion (DB connections).

### Critical Pitfalls

1. **AI-generated SQL executed without sandboxing** — Use AST parser to whitelist SELECT-only before execution AND configure a read-only database user — both layers required. Address in Phase 1 before any query execution ships.

2. **Prompt injection via user-controlled data** — Never embed raw CSV cell values in LLM prompts; send only column names and inferred types for schema context. Address in Phase 1 prompt architecture.

3. **Database credentials stored or transmitted insecurely** — AES-256-GCM encryption at rest using envelope encryption (key in env var / secrets manager), never in plaintext columns, never in logs. Cannot be retrofitted — must be the first design decision for the connection model.

4. **Schema inference failures on real-world data** — Real spreadsheets have merged headers, mixed types, currency strings in numeric columns, inconsistent date formats. Build schema confidence scoring with a user-confirmation step for LOW confidence columns. Test against 20+ messy real-world files before shipping.

5. **LLM hallucinating column names** — Always inject full schema (names, types, sample values for low-cardinality columns) into every NL-to-SQL prompt; validate every table/column reference in generated queries against the actual schema before execution; implement correction retry loop (max 2-3 attempts).

6. **Sending full dataset to LLM for insight generation** — Never send raw row data; send statistical summaries (min, max, mean, stddev, top 10 values, null rate); compute anomaly candidates server-side and send only candidates to LLM for labeling. Address in Phase 2 before insight feature ships.

7. **Cross-user data leakage (multi-tenancy bug)** — Every connection retrieval must filter by authenticated user_id; connection pools must be per-user keyed; write integration tests verifying User A cannot access User B's data source in Phase 1.

---

## Implications for Roadmap

Based on the combined research findings, the component build order from ARCHITECTURE.md, feature dependencies from FEATURES.md, and phase warnings from PITFALLS.md, the following phase structure is recommended:

### Phase 1: Foundation — Auth, Data Model, and Security Architecture

**Rationale:** Auth is a prerequisite for everything (no feature should be built without user context). The database schema, credential encryption model, and multi-tenant isolation must be architecturally correct from day one — these cannot be retrofitted. The security architecture (query validation gate, read-only DB user model, credential encryption) must exist before any user data touches execution. This phase has no AI risk — it is pure infrastructure.

**Delivers:** Working auth (Clerk), application database schema (Neon + Drizzle migrations), AES-256 credential encryption utility, multi-tenant data access layer, file storage configuration (Vercel Blob), query validation gate (SELECT-only whitelist).

**Features from FEATURES.md:** User authentication (email/password + Google OAuth), dashboard save/share foundations.

**Pitfalls addressed:** Credential storage insecurity (Pitfall 3), cross-user data leakage (Pitfall 10).

**Research flag:** Standard patterns — skip research-phase. Clerk + Neon + Drizzle are well-documented; AES-256 credential encryption is a standard pattern.

---

### Phase 2: Core AI Loop — CSV/Excel Ingestion and NL-to-Query (Flat Files)

**Rationale:** Build and validate the full AI loop against a controlled data source (uploaded files) before introducing the complexity of external database connections. The flat-file path isolates the NL-to-query pipeline from credential security concerns and lets schema inference be tested thoroughly. This is where the product's core value is proven or disproven.

**Delivers:** CSV/Excel file upload with streaming parse to Parquet, schema inference with confidence scoring and user confirmation for LOW confidence columns, Schema Registry, LLM Service wrapper (GPT-4o via LangChain, structured outputs), NL-to-SQL pipeline for flat files (DuckDB), query validation gate in action, result formatter, basic chart rendering (bar, line, pie, table), plain English insight explanation (statistical summary → LLM, not raw rows).

**Features from FEATURES.md:** File upload, NL question input, AI query translation, AI-selected chart type, table view fallback, plain English insights, loading/progress states, human-readable errors.

**Stack elements:** pandas 3.0, openpyxl, DuckDB, LangChain 0.3.x, GPT-4o, Recharts + shadcn/ui charts, python-multipart, cryptography.

**Pitfalls addressed:** SQL execution without sandboxing (Pitfall 1), prompt injection via CSV data (Pitfall 2), schema inference failures (Pitfall 4), LLM column hallucination (Pitfall 5), sending full dataset to LLM (Pitfall 7), no query timeout/row limit (Pitfall 8).

**Research flag:** Needs research-phase. The NL-to-SQL pipeline quality, DuckDB-Parquet integration, and schema inference edge cases are complex enough to benefit from task-level research before implementation. The LLM prompt architecture for schema-injected query generation has documented best practices worth retrieving.

---

### Phase 3: Dashboard Layer — Save, Share, and Auto-Refresh

**Rationale:** Once the AI loop produces reliable results, build the persistence and sharing layer that turns one-off queries into reusable dashboards. Auto-refresh is only meaningful once the core loop is trusted. Sharing design must be locked in before implementing — snapshot vs live-query share modes are architectural decisions.

**Delivers:** Dashboard CRUD (save, name, load), widget layout persistence, share link generation (signed JWT, view-only), auto-refresh with cache-first polling (SWR on client, result cache on server), data freshness indicator, follow-up question suggestions, AI-generated dashboard titles.

**Features from FEATURES.md:** Dashboard saving/naming, sharing via link, auto-refresh on configurable interval, follow-up question suggestions, data freshness indicator, query history and replay.

**Stack elements:** APScheduler 3.x for refresh scheduling, SWR 2.x for client polling, Drizzle + Neon for dashboard/widget persistence.

**Pitfalls addressed:** Auto-refresh DB hammering (Pitfall 6 — cache-first, minimum 5-minute floor for DB connections), dashboard sharing credential exposure (Pitfall 12 — snapshot mode for shared dashboards), visualization type mismatch (Pitfall 9 — rule-based guardrails for chart type selection), ambiguous follow-up context (Pitfall 14 — thread context in follow-up calls).

**Research flag:** Partially standard patterns. Dashboard CRUD is standard. The share token + snapshot model and cache invalidation strategy may benefit from brief research-phase.

---

### Phase 4: Database Connections

**Rationale:** Adding external database connections comes after the flat-file path is end-to-end validated. This is the most security-sensitive phase — user-supplied connection strings, read-only user enforcement, multi-tenant connection pool isolation, and schema introspection against live databases. Build it last on the core path to avoid conflating AI loop bugs with credential/connection bugs.

**Delivers:** Database connection UI with guided connection string input, credential encryption (AES-256), connection test pattern (validate then encrypt), schema introspection (information_schema query), Schema Registry population for DB sources, NL-to-SQL pipeline extended to pass-through SQL against external databases, read-only user enforcement, auto-refresh enabled for DB-backed dashboards.

**Features from FEATURES.md:** Database connection (PostgreSQL, MySQL minimum), auto-refresh for live data sources.

**Stack elements:** SQLAlchemy 2.0.x, asyncpg 0.29.x, pymysql 1.1.x, pyodbc 5.x (MSSQL), cryptography library.

**Pitfalls addressed:** Plaintext credentials (Pitfall 3 — already architected in Phase 1, implemented here), cross-user connection leakage (Pitfall 10 — integration tests required), auto-refresh DB hammering (Pitfall 6 — minimum interval floor for DB connections enforced here).

**Research flag:** Needs research-phase. SQLAlchemy async patterns, connection pool configuration for multi-tenant isolation, and MSSQL/pyodbc Docker setup have enough operational complexity to benefit from targeted research.

---

### Phase 5: AI Enrichment — Anomaly Detection and Trend Analysis

**Rationale:** These features require a stable query result format and a trusted insight generation pipeline before they can be layered on. Anomaly detection requires server-side statistical computation (z-score/IQR) before the LLM is involved. Trend analysis requires time-series detection logic. Both are high-perceived-value features that belong in a focused iteration after the core loop is production-stable.

**Delivers:** Anomaly/outlier detection with English-language explanation, automatic trend analysis with percentage change and segment attribution, schema-aware context memory (business terms map to columns), visualization drill-down (click bar to filter dashboard).

**Features from FEATURES.md:** Anomaly/outlier detection, trend analysis with NL summary, schema-aware context memory, visualization drill-down.

**Pitfalls addressed:** Sending full dataset to LLM (statistical pre-processing is the mitigation — already architected in Phase 2, scaled up here), visualization type mismatch (refined rule-based guardrails).

**Research flag:** Needs research-phase. Statistical anomaly detection approaches (z-score vs IQR vs model-based) and prompt engineering for trend attribution are worth researching before implementation.

---

### Phase 6: Polish, Performance, and Deferred Features

**Rationale:** Performance optimization (query caching, LLM call caching for repeated questions), UX polish (streaming progress indicators with stage labels, better error messages), and lower-priority features deferred from earlier phases.

**Delivers:** Query result caching (Postgres cache table or Redis, keyed by hash of query + dataset version), streaming progress indicators with stage labels ("Understanding your question... Querying data..."), export to PNG/PDF, multi-turn conversation (query context threading, 3-4 turn depth limit), column/data glossary, dashboard layout customization.

**Features from FEATURES.md:** Query result caching, export to PDF/image, multi-turn conversation, column glossary, layout customization.

**Pitfalls addressed:** NL-to-SQL latency (Pitfall 11 — streaming progress UX + query caching), ambiguous follow-up context (Pitfall 14 — multi-turn threading).

**Research flag:** Standard patterns for caching and progress UX. Multi-turn conversation context management may benefit from brief research on LangChain's conversation memory patterns.

---

### Phase Ordering Rationale

- **Security-first**: Pitfalls 1, 2, 3, and 10 are architecturally foundational and explicitly cannot be retrofitted — they drive Phase 1 and Phase 4 design before any user data is processed.
- **Flat-file before DB connections**: The ARCHITECTURE.md component build order explicitly validates this. It isolates AI loop quality from connection security complexity and lets schema inference be hardened against real-world messy data before introducing live databases.
- **Core loop before dashboard layer**: Dashboard persistence and sharing have no value until the query → result → visualization chain is trusted. Phase 2 must be end-to-end working before Phase 3 begins.
- **AI enrichment deferred to Phase 5**: Anomaly detection and trend analysis depend on a stable result format and trusted insight pipeline. Building them before the core loop is stable would cause rework.
- **Feature groupings follow architecture dependencies**: The FEATURES.md dependency tree (auth → dashboard saving → sharing/refresh; data source → schema → NL query → enrichment) maps directly onto the phase ordering.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (NL-to-Query pipeline):** LLM prompt architecture for schema injection, LangChain SQL chain configuration, DuckDB-Parquet integration, pandas 3.0 breaking change handling — complex integration with well-documented patterns worth retrieving
- **Phase 4 (Database connections):** SQLAlchemy async multi-tenant connection pool isolation, MSSQL/pyodbc Docker setup, connection string security patterns — operational complexity warrants targeted research
- **Phase 5 (Anomaly detection):** Statistical approach selection (z-score vs IQR), trend analysis prompt engineering — domain-specific enough to benefit from research before design

Phases with standard patterns (skip research-phase):
- **Phase 1 (Auth + Foundation):** Clerk Next.js integration, Neon + Drizzle setup, AES-256 encryption — all well-documented with official guides
- **Phase 3 (Dashboard + Sharing):** Dashboard CRUD, SWR polling, JWT share tokens — established patterns; share model design is the only decision worth pre-thinking
- **Phase 6 (Polish):** Caching, progress UX, export — standard patterns throughout

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Next.js 16 and Tailwind v4 verified via official docs (HIGH); LangChain 0.3.x, Clerk, Drizzle, Recharts from training data — sites inaccessible during research (MEDIUM); GPT-4o SQL accuracy from training data, no 2026 benchmark (LOW) |
| Features | MEDIUM | Core feature categorization (table stakes vs differentiators) HIGH confidence based on market patterns; specific competitor feature comparisons MEDIUM — live verification recommended before using as competitive positioning material |
| Architecture | HIGH | Pattern is well-established in production NL-to-query systems (LangChain SQL agent, Vanna AI, Defog, similar BI copilots); DuckDB Node.js docs verified; Anthropic tool use docs verified |
| Pitfalls | MEDIUM-HIGH | Security pitfalls (SQL injection, prompt injection, credential storage, multi-tenancy) HIGH confidence based on OWASP LLM Top 10 and production post-mortems; latency and UX pitfalls MEDIUM — based on training knowledge, not live-verified |

**Overall confidence:** MEDIUM — sufficient to begin roadmap planning and Phase 1 implementation. Phase 2 and Phase 4 warrant research-phase passes before task breakdown.

### Gaps to Address

- **GPT-4o vs Claude Sonnet 2026 benchmark**: STACK.md recommends GPT-4o for Structured Outputs but notes the SQL accuracy claim is from training data with no 2026 verification. Validate against current benchmarks or run a quick internal evaluation during Phase 2 research. LangChain's provider abstraction makes a swap cheap.
- **LangChain 0.3.x API surface**: LangChain.com was inaccessible during research; version confirmed from training data. Verify `create_sql_query_chain`, `SQLDatabaseToolkit`, and `PandasDataFrameAgentExecutor` still exist under these names in 0.3.x before beginning Phase 2 implementation.
- **Clerk pricing for target scale**: Free tier is 10,000 MAU — verify this is sufficient for v1 targets and confirm pricing for growth tier. Site was inaccessible during research.
- **Drizzle 0.39.x breaking changes**: Drizzle version from training data. Verify the current stable version and any breaking changes from 0.39 before beginning Phase 1 schema setup.
- **pandas 3.0 `str` dtype change**: The `dtype == 'object'` string detection pattern breaks in pandas 3.0. Any schema inference code must use `pd.api.types.is_string_dtype()` or `dtype == 'str'`. This is a Phase 2 implementation constraint.
- **Competitive landscape verification**: Feature comparisons against ThoughtSpot, Tableau Pulse, Power BI Copilot, and others are based on training data through August 2025. Verify against current product pages before using in external-facing positioning.

---

## Sources

### Primary (HIGH confidence — verified via official docs)
- Next.js official docs (https://nextjs.org/docs/app) — v16.1.7 confirmed, App Router patterns, server components, streaming
- Tailwind CSS official docs (https://tailwindcss.com/docs/installation/framework-guides/nextjs) — v4.2 confirmed, PostCSS plugin install pattern
- pandas release notes (https://pandas.pydata.org/docs/whatsnew/v3.0.0.html) — v3.0 breaking changes confirmed, Python 3.11+ requirement
- Vercel Postgres deprecation notice (https://vercel.com/docs/storage/vercel-postgres) — deprecated Dec 2024, Neon is current recommendation
- DuckDB Node.js docs (https://duckdb.org/docs/api/nodejs/overview) — Node.js binding patterns confirmed
- Anthropic tool use docs (https://docs.anthropic.com/en/docs/tool-use) — structured output patterns confirmed

### Secondary (MEDIUM confidence — training data, multiple sources agree)
- FastAPI 0.115.x — confirmed active on homepage; version from training data
- LangChain 0.3.x NL-to-SQL — langchain.com inaccessible; SQLDatabaseToolkit and create_sql_query_chain from training data
- Recharts 2.x — recharts.org inaccessible; widely cited in ecosystem
- Clerk — clerk.com inaccessible; Next.js integration patterns from training data
- Drizzle ORM 0.39.x — orm.drizzle.team inaccessible; version from training data
- APScheduler 3.x — well-known Python library; no official docs accessed
- OWASP LLM Top 10 — security pitfalls validated against LLM01 (Prompt Injection), LLM06 (Sensitive Information Disclosure)
- Competitive feature landscape — training data covering ThoughtSpot, Tableau Pulse, Power BI Copilot, Databricks AI/BI, Julius AI, Rows.com, Metabase, Hex, Sigma, Mode, Domo, Looker Studio through August 2025

### Tertiary (LOW confidence — inference or unverified)
- GPT-4o SQL accuracy claims — from training data; no 2026 benchmark accessed; needs validation
- Competitor feature details — training data through August 2025; verify against current product pages before use in positioning

---
*Research completed: 2026-03-17*
*Ready for roadmap: yes*
