# Architecture Patterns

**Project:** InsightEngine — Gen AI Data & Dashboard Platform
**Domain:** NL-to-query BI / Gen AI data analytics
**Researched:** 2026-03-17
**Confidence:** HIGH (based on established patterns in production NL-to-query systems)

---

## Recommended Architecture

InsightEngine follows a **layered pipeline architecture** with six distinct vertical layers. Data flows left-to-right through the pipeline; the AI layer is a parallel enrichment track, not a sequential gate. The frontend is a Next.js App Router application with server-side query execution and client-side dashboard rendering.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                               │
│  ┌──────────┐   ┌───────────────────────────┐   ┌────────────────────┐ │
│  │  Auth UI │   │  NL Query Input / Chat     │   │ Dashboard Renderer │ │
│  └──────────┘   └───────────────────────────┘   └────────────────────┘ │
└────────────────────────────┬───────────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼───────────────────────────────────────────┐
│                    NEXT.JS API LAYER (Server)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ /api/ingest  │  │ /api/query   │  │ /api/refresh │  │ /api/auth  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────────┘ │
└─────────┼─────────────────┼─────────────────┼──────────────────────────┘
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼──────────────────────────┐
│                     SERVICE LAYER                                        │
│  ┌─────────────────┐  ┌───────────────────┐  ┌───────────────────────┐ │
│  │ Ingestion       │  │ NL-to-Query       │  │ Dashboard             │ │
│  │ Service         │  │ Pipeline          │  │ Service               │ │
│  │                 │  │                   │  │                       │ │
│  │ - Parse XLSX/   │  │ - Schema context  │  │ - Dashboard CRUD      │ │
│  │   CSV/DB schema │  │   injection       │  │ - Share tokens        │ │
│  │ - Normalise     │  │ - LLM prompt      │  │ - Refresh scheduler   │ │
│  │ - Store         │  │ - Query gen       │  │ - Viz recommendation  │ │
│  └────────┬────────┘  │ - Execute         │  └───────────────────────┘ │
│           │           │ - Result format   │                             │
│           │           └─────────┬─────────┘                            │
└───────────┼─────────────────────┼────────────────────────────────────-─┘
            │                     │
┌───────────▼─────────┐  ┌────────▼────────────────────────────────────┐
│  DATA STORE LAYER   │  │            AI ENRICHMENT LAYER               │
│                     │  │                                              │
│  PostgreSQL         │  │  LLM Service (Claude / GPT-4o)              │
│  - user_data_       │  │                                              │
│    sources          │  │  - NL → SQL/pandas translation              │
│  - uploaded_        │  │  - Schema context builder                   │
│    datasets         │  │  - Insight narration                        │
│  - dashboards       │  │  - Anomaly detection prompts                │
│  - queries          │  │  - Viz type recommendation                  │
│  - refresh_         │  │  - Follow-up question generation            │
│    schedules        │  │                                             │
│                     │  └─────────────────────────────────────────────┘
│  DuckDB (ephemeral) │
│  - Per-query in-    │
│    memory execution │
│    over uploaded    │
│    flat files       │
│                     │
│  File Storage (S3   │
│  or local FS)       │
│  - Raw XLSX/CSV     │
│    uploads          │
└─────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Auth Layer** | User accounts, JWT sessions, credential encryption | Database (users table), all API routes |
| **Ingestion Service** | Parse XLSX/CSV, infer schema, detect column types, register DB connection, store dataset metadata | File storage (raw files), PostgreSQL (dataset registry), Schema Registry |
| **Schema Registry** | Store inferred column names, types, sample values, row counts per dataset | PostgreSQL, NL-to-Query Pipeline |
| **NL-to-Query Pipeline** | Accept NL question + dataset ID → build schema context → call LLM → receive query → validate → execute | Schema Registry, LLM Service, Query Executor |
| **Query Executor** | Run SQL against DuckDB (flat files) or pass-through SQL to connected DB | DuckDB, external DBs via connection string, result cache |
| **Result Formatter** | Shape raw query results into typed `QueryResult` (columns, rows, summary stats) | Query Executor, Dashboard Service |
| **AI Enrichment Layer** | Generate insights narrative, detect anomalies, recommend viz type, suggest follow-up questions | LLM Service, Result Formatter |
| **Dashboard Service** | CRUD dashboards, persist widget layouts, store share tokens, manage refresh schedules | PostgreSQL, Refresh Scheduler |
| **Dashboard Renderer** | Client-side: render charts from `QueryResult`, support filters, handle auto-refresh polling | Dashboard Service API, Chart library (Recharts) |
| **Refresh Scheduler** | On interval, re-run the saved query for a dashboard widget and push updated result | NL-to-Query Pipeline, Dashboard Service |
| **LLM Service** | Thin wrapper around Anthropic/OpenAI API — handles prompt construction, retries, token limits, response parsing | NL-to-Query Pipeline, AI Enrichment Layer |

---

## Data Flow

### 1. Data Ingestion Flow

```
User uploads XLSX/CSV
  → POST /api/ingest/file
  → Server validates MIME type, size limit
  → File saved to storage (S3 key or local path)
  → Ingestion Service parses with xlsx/papaparse
  → Column type inference (string, number, date, boolean)
  → Schema Registry: INSERT dataset record (id, user_id, name, columns[], row_count, storage_key)
  → Response: { datasetId, schema preview }
  → Client renders schema confirmation UI
```

```
User provides DB connection string
  → POST /api/ingest/connection
  → Server validates format, tests connection (no plaintext storage)
  → Credentials encrypted with AES-256 before DB write
  → Schema introspection: SELECT table_name, column_name, data_type FROM information_schema.columns
  → Schema Registry: INSERT dataset record (type: "db_connection")
  → Response: { datasetId, tables[], schema preview }
```

### 2. NL-to-Query Flow

```
User types natural language question
  → POST /api/query { datasetId, question }
  → Schema Registry: GET schema for datasetId (columns, types, sample values)
  → Context builder assembles prompt:
      system: "You are a SQL/pandas expert. Given schema: {schema}, generate a query for: {question}"
  → LLM Service: POST to Anthropic/OpenAI
  → LLM returns: { query: "SELECT ...", queryType: "sql" | "pandas" }
  → Query Validator: check for dangerous statements (DROP, DELETE, INSERT) — reject if found
  → Query Executor:
      if flat file → DuckDB in-process: DuckDB reads from Parquet/CSV in storage
      if db connection → decrypt credentials, execute against target DB
  → Result Formatter: { columns[], rows[], rowCount, executionMs }
  → AI Enrichment (parallel):
      - Insight narration: LLM summarizes key findings in plain English
      - Anomaly detection: LLM flags statistical outliers from result summary
      - Viz recommendation: LLM picks chart type (bar/line/pie/scatter/table)
      - Follow-up questions: LLM generates 3 relevant next questions
  → Response: { result, insights, vizType, followUpQuestions }
  → Client renders chart + insights panel
```

### 3. Dashboard Save & Refresh Flow

```
User clicks "Save to Dashboard"
  → POST /api/dashboards { name, widgets: [{ queryId, vizType, position }] }
  → Dashboard Service: INSERT dashboard + widget records
  → Optional: POST /api/dashboards/:id/refresh-schedule { intervalMinutes }
  → Refresh Scheduler stores cron config
  → Response: { dashboardId, shareUrl }

Auto-refresh (client polling, no WebSocket required for v1):
  → Dashboard Renderer: setInterval based on widget.refreshIntervalMs
  → GET /api/dashboards/:id/widgets/:widgetId/result
  → If cache fresh (within interval) → return cached result
  → If cache stale → re-execute saved query → update cache → return new result
  → Client re-renders chart in place

Share flow:
  → POST /api/dashboards/:id/share
  → Dashboard Service: generate share token (signed JWT, expiry optional)
  → GET /share/:token → renders read-only dashboard, no auth required
```

---

## Patterns to Follow

### Pattern 1: Schema Context Injection (RAG-lite)

**What:** Before calling the LLM for NL-to-query, build a compact schema context block injected into the system prompt. Include: table/column names, inferred types, 3-5 sample values per column, row count estimate.

**Why:** LLMs produce dramatically more accurate SQL when they can see column names and sample values. Without sample values, they hallucinate column names or guess wrong data formats (especially dates).

**Example:**
```
Schema context:
  Table: sales_data (1,247 rows)
  Columns:
    - date (date) — samples: 2024-01-15, 2024-02-03, 2024-03-22
    - region (string) — samples: North, South, East, West
    - revenue (number) — samples: 45230.50, 12800.00, 98100.75
    - product_sku (string) — samples: SKU-001, SKU-045, SKU-102
```

### Pattern 2: Query Validation Gate

**What:** After LLM returns a query, parse it with a SQL parser or regex before execution. Reject any query containing DDL (CREATE, DROP, ALTER) or DML (INSERT, UPDATE, DELETE). Log and return a structured error — never surface raw SQL errors to the user.

**Why:** LLMs occasionally generate mutating queries even when instructed not to. Defense-in-depth prevents accidental or adversarial data modification.

**Example:**
```typescript
function validateQuery(query: string): ValidationResult {
  const FORBIDDEN = /\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|TRUNCATE)\b/i
  if (FORBIDDEN.test(query)) {
    return { valid: false, reason: 'Query contains disallowed operations' }
  }
  return { valid: true }
}
```

### Pattern 3: DuckDB for Flat File Queries

**What:** When the data source is an uploaded CSV/XLSX, convert it to Parquet at ingest time and use DuckDB (Node.js binding) to execute SQL in-process. DuckDB reads Parquet from local storage or S3 and returns results as JavaScript arrays.

**Why:** DuckDB handles files up to hundreds of MB with sub-second query times using columnar storage. It avoids needing to load entire datasets into Node.js memory and eliminates the need for a separate data warehouse for flat-file sources.

**Example:**
```typescript
import { Database } from 'duckdb-async'
const db = new Database(':memory:')
await db.run(`CREATE TABLE data AS SELECT * FROM read_parquet('${parquetPath}')`)
const results = await db.all(generatedSql)
```

### Pattern 4: Structured LLM Response Contract

**What:** Use structured output (JSON mode / function calling / tool use) for all LLM calls rather than parsing free-form text. Define a strict schema for each call type.

**Why:** Free-form LLM text responses break unpredictably. JSON mode gives 99%+ reliable extraction and eliminates brittle regex parsing.

**Example output contract for query generation:**
```typescript
interface QueryGenResponse {
  query: string          // the SQL or pandas query
  queryType: 'sql' | 'pandas'
  explanation: string    // one-sentence plain English explanation of what query does
  confidence: 'high' | 'medium' | 'low'  // LLM's self-assessed confidence
}
```

### Pattern 5: Parallel AI Enrichment

**What:** After query execution returns results, fire all AI enrichment tasks (insights, anomaly, viz recommendation, follow-ups) as parallel `Promise.all` calls rather than sequential. Set a short timeout (3s) and gracefully degrade each independently if it times out.

**Why:** Enrichment is latency-sensitive (user is waiting). Four sequential LLM calls at 1-2s each = 4-8s wait. Parallel = 1-2s total. Each enrichment is independent and can fail without blocking the others.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Connection Credentials in Plaintext

**What:** Saving DB connection strings (with passwords) in the database as plaintext.

**Why bad:** Credential exposure on DB breach. Any user with DB read access can steal every customer's database password.

**Instead:** Encrypt at rest with AES-256 using a server-held key (env var). Store the encrypted blob. Decrypt only at query execution time, hold decrypted string in memory only for the duration of the query.

### Anti-Pattern 2: Executing LLM-Generated Queries Without Validation

**What:** Taking whatever SQL the LLM generates and running it directly against the database.

**Why bad:** LLMs occasionally output DROP TABLE statements. Even read-only LLMs can be jailbroken. In multi-tenant systems, LLM could generate queries referencing other users' tables.

**Instead:** Validate query structure before execution. For DB connections, use a read-only DB user (no write permissions at the DB level). For DuckDB, the table is ephemeral per-query — no persistent mutation is possible.

### Anti-Pattern 3: Loading Full Uploaded Files into Node.js Memory

**What:** Reading the entire XLSX/CSV file into a JavaScript array to process it.

**Why bad:** A 50MB Excel file becomes 200-400MB of JavaScript objects in heap. With multiple concurrent users, this causes OOM crashes and huge GC pressure.

**Instead:** Stream parse files to Parquet at ingest time using papaparse streaming API or xlsx streaming reader. Let DuckDB handle the heavy lifting at query time. Only load result sets (bounded size) into Node.js memory.

### Anti-Pattern 4: One LLM Call Per User Interaction for Schema Discovery

**What:** Calling the LLM every time a user interacts with the UI to figure out what the schema is.

**Why bad:** Schema doesn't change between interactions. Re-sending full schema context in every token stream wastes tokens and adds latency.

**Instead:** Cache the schema context string per dataset at ingest time. Build the prompt once, store it, reuse it for every query on that dataset. Invalidate only when dataset is re-uploaded.

### Anti-Pattern 5: Tight Coupling Between Query Engine and Dashboard Renderer

**What:** Embedding query execution logic directly in React components via useEffect.

**Why bad:** Makes it impossible to re-execute queries server-side for refresh, impossible to cache results, and ties the UI render lifecycle to query latency.

**Instead:** Keep query execution entirely server-side. The client always fetches pre-computed `QueryResult` objects from an API. The dashboard renderer is a pure display layer.

### Anti-Pattern 6: Using WebSockets for Auto-Refresh When Polling Suffices

**What:** Implementing a full WebSocket or SSE infrastructure for dashboard auto-refresh.

**Why bad:** WebSockets add deployment complexity, don't work on all serverless platforms (Netlify functions have 30s max execution), and are overkill for 30-second to 5-minute refresh intervals.

**Instead:** Client-side `setInterval` polling the result endpoint. Add cache-control headers to avoid redundant query re-executions when cache is fresh. Consistent with PROJECT.md decision: "auto-refresh over push streaming."

---

## Component Build Order (Dependencies)

Build in this order — each layer depends on the one above it being complete:

```
1. Auth Layer
   └── Required by: everything. Build auth (signup/login/JWT/session) first.
       No feature should be built without user context established.

2. Database Schema + ORM setup
   └── Required by: Ingestion, Dashboard, Schema Registry, Query cache.
       Define all tables (users, data_sources, datasets, dashboards, queries, results_cache).

3. File Storage Integration
   └── Required by: Ingestion Service (raw file storage), DuckDB (Parquet reads).
       Configure S3-compatible bucket (or local FS for dev).

4. Ingestion Service — Flat Files (XLSX/CSV → Parquet)
   └── Required by: Query Executor (needs Parquet to exist).
       DuckDB query path depends on this working first.

5. Schema Registry
   └── Required by: NL-to-Query Pipeline (needs schema context).
       Store column names, types, sample values from ingest.

6. LLM Service Wrapper
   └── Required by: NL-to-Query Pipeline, AI Enrichment.
       Build the thin Anthropic/OpenAI wrapper with retry, timeout, structured output.

7. NL-to-Query Pipeline — Flat File Path (CSV/XLSX via DuckDB)
   └── Depends on: Schema Registry + LLM Service + DuckDB.
       This is the core value delivery. Build and validate here before adding DB connections.

8. AI Enrichment Layer
   └── Depends on: LLM Service + Query result format being stable.
       Add insights, anomaly, viz recommendation, follow-ups in parallel.

9. Dashboard Service (save/retrieve/share)
   └── Depends on: NL-to-Query producing stable QueryResult objects.
       CRUD dashboards, widget persistence, share token generation.

10. Dashboard Renderer (client-side charts, layout)
    └── Depends on: Dashboard Service API being stable.
        Build Recharts-based widgets, responsive grid layout.

11. Auto-Refresh Mechanism
    └── Depends on: Dashboard Service + Query execution being reliable.
        Client-side interval polling + server-side result caching.

12. Ingestion Service — DB Connection Path
    └── Add after flat-file path is validated end-to-end.
        Credential encryption, schema introspection, query pass-through.
```

**Rationale:** Building the flat-file path (steps 1–11) first gives a fully working end-to-end product before tackling the complexity of external DB connections. It also validates the NL-to-query pipeline with a controlled data source before introducing connection string security concerns.

---

## Scalability Considerations

| Concern | Single user / dev | 100 concurrent users | 1,000 users (v2+) |
|---------|-------------------|---------------------|-------------------|
| File storage | Local filesystem | S3 / R2 | S3 + CDN for shared assets |
| Query execution | DuckDB in-process | DuckDB in-process (stateless, scales with serverless replicas) | Consider separate query worker pool |
| LLM API rate limits | No concern | Monitor token usage; add request queuing | LLM request queue with backpressure |
| DB connections | N/A | Connection pool per user; limit max concurrent DB queries | Shared connection proxy (pgBouncer equivalent) |
| Result caching | In-memory / no cache | Redis or Postgres cache table for query results (keyed by hash of query + dataset version) | Distributed cache with TTL |
| Dashboard loads | Direct DB read | Cache dashboard + widgets on read, invalidate on save | Edge caching for public dashboards |
| Auto-refresh | Client polling | Client polling; server returns 304 Not Modified when cache fresh | Coalesce duplicate refresh requests server-side |

---

## Key Architectural Decisions

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| Framework | Next.js 14+ App Router | Matches existing codebase patterns; server components handle schema/query work; API routes handle ingestion and query execution |
| Query engine (flat files) | DuckDB (duckdb-async Node binding) | In-process columnar SQL on CSV/Parquet; no external service; sub-second on files up to ~500MB |
| LLM provider | Anthropic Claude API (primary) | Existing `ANTHROPIC_API_KEY` stub already in codebase (perf-mgmt/ai-coach.ts); strong structured output support |
| File storage | S3-compatible (Cloudflare R2 for cost) or local FS for dev | Decouples storage from compute; DuckDB can read directly from S3 via httpfs extension |
| Database (metadata) | PostgreSQL (Neon serverless or Supabase) | Relational for user/dashboard/dataset metadata; serverless tiers work with Netlify deployment pattern |
| ORM | Drizzle ORM | Type-safe SQL, works well with Next.js App Router; lighter than Prisma for serverless |
| Chart library | Recharts (already in codebase) | No new dep; existing team knowledge; sufficient for bar/line/pie/area/scatter |
| Credential storage | AES-256-GCM encryption, key from env var | Industry standard for secrets at rest; never store plaintext connection strings |
| Auth | JWT (httpOnly cookie) using jose | Consistent with existing next.js projects in codebase |
| Refresh mechanism | Client-side setInterval polling | Consistent with PROJECT.md decision; avoids WebSocket complexity on Netlify |

---

## Sources

- PROJECT.md: InsightEngine requirements and constraints (greenfield, 2026-03-17)
- Codebase analysis: existing Next.js App Router patterns, jose JWT, Recharts, Anthropic API stub (ARCHITECTURE.md, STACK.md, INTEGRATIONS.md — 2026-03-17)
- DuckDB Node.js documentation: https://duckdb.org/docs/api/nodejs/overview
- Anthropic structured output / tool use: https://docs.anthropic.com/en/docs/tool-use
- Architecture confidence: HIGH — pattern is well-established in production NL-to-query systems (Langchain/LlamaIndex NL-to-SQL, Vanna AI, Defog, similar open-source BI copilots)
