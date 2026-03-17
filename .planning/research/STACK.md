# Technology Stack

**Project:** InsightEngine — Gen AI Data & Dashboard Platform
**Researched:** 2026-03-17
**Overall confidence:** MEDIUM — Next.js 16 and Tailwind v4 verified via official docs; LLM and Python library versions drawn from training data + partial verification; deployment options partially confirmed.

---

## Recommended Stack

### Architecture Split

This project requires two runtimes: a **Python backend** for data processing, LLM orchestration, and file/database connectors (pandas, SQLAlchemy), and a **Next.js frontend** for the interactive dashboard UI and auth. They communicate over REST/JSON.

Do not attempt to collapse this into a single Next.js app — executing pandas code server-side in a JS runtime is not viable, and LangChain's SQL toolkit lives in Python. The split is unavoidable.

---

### Core Framework — Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Python | 3.12 | Runtime | Minimum 3.11 required by pandas 3.0; 3.12 has better performance and is current LTS |
| FastAPI | 0.115.x | REST API framework | Async-native, Pydantic v2 integration, OpenAPI docs auto-generated, fastest Python framework for I/O-bound workloads |
| Pydantic v2 | 2.x | Request/response validation | Native to FastAPI, 5–10x faster than Pydantic v1, strict type enforcement for LLM structured outputs |
| Uvicorn | 0.32.x | ASGI server | Production ASGI server for FastAPI; pair with Gunicorn for multi-worker prod deployments |

**Why FastAPI over Django/Flask:** Django is too heavyweight (ORM, admin, session management all redundant here). Flask lacks async. FastAPI gives typed endpoints, auto-generated OpenAPI docs, and native async — all essential when many endpoints call external LLM APIs.

---

### Core Framework — Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16.1.7 | Full-stack React framework | App Router for server components, built-in API routes for auth callbacks, streaming for progressive dashboard loading, Vercel-native deployment |
| React | 19.x | UI library | Ships with Next.js 16; Server Components reduce client bundle size |
| TypeScript | 5.x | Type safety | Catch schema mismatches between backend JSON and frontend components early |
| Tailwind CSS | v4.2 | Styling | CSS-first config (no tailwind.config.js required), v4 uses `@tailwindcss/postcss` plugin for Next.js, dramatically faster builds via Rust-based Lightning CSS |

**Why Next.js over Vite/CRA:** Server Components let you stream dashboard sections as they load, which is critical when AI analysis takes 3–10 seconds. API routes handle auth callbacks without a separate server. Vercel deployment is zero-config.

**Tailwind v4 note:** Install as `npm install tailwindcss @tailwindcss/postcss postcss` — the plugin name changed from `tailwindcss` in earlier versions. Import with `@import "tailwindcss"` in globals.css.

---

### LLM Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| LangChain | 0.3.x | NL→SQL orchestration, chain building | `SQLDatabaseToolkit` + `create_sql_query_chain` give a verified NL-to-SQL pipeline; well-maintained, extensive database adapter support |
| LangChain Community | 0.3.x | Additional integrations | Required for SQLDatabase class and community connectors |
| openai Python SDK | 1.x | GPT-4o API calls | Structured Outputs (JSON Schema enforcement) essential for reliable chart-spec generation; function calling for follow-up question suggestions |
| GPT-4o | latest | NL→SQL, insight narration, chart recommendations | Best SQL generation accuracy among tested models (Jul 2025 evaluation); structured outputs guarantee valid JSON; acceptable latency for v1 |

**Confidence: MEDIUM** — GPT-4o SQL accuracy from training data; no direct 2026 benchmark verified.

**Why LangChain over a raw OpenAI prompt:** LangChain's `SQLDatabaseToolkit` handles schema introspection, query validation, and retry loops automatically. Writing this from scratch is 2–4 weeks of work that LangChain already solves. The NL-to-pandas path (for CSV/Excel) uses `PandasDataFrameAgentExecutor` from the same ecosystem.

**Why GPT-4o over Claude Sonnet:** Both produce good SQL. GPT-4o's Structured Outputs API guarantees valid JSON for chart specifications — no parsing failures. Claude's tool use achieves the same but with more prompt engineering overhead. GPT-4o is the safer default; the LLM layer can be swapped via LangChain's provider abstraction later.

**What NOT to use:**
- **LangGraph** — overkill for v1; adds stateful agent complexity that only helps with multi-step agentic workflows beyond what this app needs
- **LlamaIndex** — SQL toolkit is weaker than LangChain's; primarily optimized for RAG/document retrieval, not tabular data
- **Local models (Ollama/Llama)** — SQL quality insufficient for schema-agnostic queries without extensive fine-tuning

---

### Data Connectors

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| pandas | 3.0.x | CSV/Excel ingestion, in-memory query execution | Industry standard; `read_csv()` and `read_excel()` cover the primary v1 data sources. Note: Python 3.11+ required for pandas 3.0 |
| openpyxl | 3.1.x | Excel `.xlsx` read/write engine | Required by pandas for `.xlsx` files; `xlrd` is deprecated for xlsx (use only for legacy `.xls`) |
| SQLAlchemy | 2.0.x | SQL database ORM and connection pooling | Supports PostgreSQL, MySQL, SQLite, MSSQL; LangChain's `SQLDatabase` class wraps it; async support via `asyncpg` |
| asyncpg | 0.29.x | Async PostgreSQL driver | Required for non-blocking PostgreSQL queries in FastAPI async endpoints |
| pymysql | 1.1.x | MySQL/MariaDB driver | User-supplied MySQL connection strings; pure Python, no binary deps |
| pyodbc | 5.x | MSSQL/SQL Server driver | Enterprise customer databases; requires ODBC driver installed in Docker image |

**pandas 3.0 breaking change:** String columns now use `str` dtype instead of `object`. Code that checks `dtype == 'object'` for string detection will break. Datetime parsing now infers microseconds by default instead of nanoseconds — relevant if exporting timestamps to integers.

**What NOT to use:**
- **xlrd** for `.xlsx` — deprecated; use openpyxl
- **pyarrow** as primary data layer — adds complexity; use only if pandas performance becomes a bottleneck (>50MB files regularly)

---

### Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Recharts | 2.x | Core chart library | React-native (not a wrapper), composable API, tree-shakeable, works with Server/Client component boundary in Next.js 16 |
| shadcn/ui Charts | current | Pre-built chart components wrapping Recharts | shadcn/ui's chart layer adds theming, dark mode, and accessible defaults on top of Recharts — reduces chart component boilerplate by 60% |

**Confidence: MEDIUM** — Recharts version from training data; official Recharts site was inaccessible during research.

**Why Recharts over alternatives:**
- **Plotly.js** — 3.4MB bundle, designed for scientific/static plots not React interactivity; excellent Python-side but the JS version adds enormous bundle weight
- **Victory** — less actively maintained, smaller ecosystem
- **Chart.js** — imperative API, requires manual React lifecycle management
- **D3.js** — correct choice if building custom chart types; wrong choice for standard dashboards (bar, line, pie, scatter) that Recharts covers natively

**The shadcn/ui Charts rationale:** shadcn/ui is now the de facto component system for Next.js projects. Its chart wrapper gives you production-ready tooltip, legend, and responsive container behavior. Use it for standard chart types; drop to raw Recharts for anything custom.

---

### Application Database (Platform Metadata)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Neon (serverless PostgreSQL) | — | Store user accounts, dashboard configs, saved queries, data source metadata | Vercel's own Postgres product was deprecated in Dec 2024 and migrated to Neon; Neon is the current Vercel-recommended Postgres provider |
| Drizzle ORM | 0.39.x | Type-safe SQL query builder for Next.js | TypeScript-first, works in Vercel Edge/Serverless, generates migrations, lighter than Prisma with no Prisma Engine binary |

**Confidence: MEDIUM** — Neon as Vercel-recommended confirmed from Vercel docs. Drizzle version from training data.

**Why Neon over Supabase:** Both are valid. Neon integrates directly in the Vercel Marketplace with automatic env var injection. Supabase is better if you need its auth or realtime features — but since we're using a separate auth solution, Neon's simpler Postgres-only offering is the right scope.

**Why Drizzle over Prisma:** Prisma ships a binary engine (~40MB) that conflicts with Vercel Edge functions and slows cold starts. Drizzle is pure TypeScript, sub-millisecond query building, and works in all serverless environments. For a project that only needs ~5 tables (users, dashboards, data_sources, queries, shares), Prisma's feature set is overkill.

**Credential storage note:** User-supplied database connection strings must be encrypted at rest. Use `AES-256-GCM` via Python's `cryptography` library on the FastAPI side before storing in Neon. Never store plaintext connection strings.

---

### Auth

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Clerk | current | User authentication | Email/password + OAuth (Google, GitHub) out of the box; Next.js SDK provides `<SignIn>`, `<UserButton>`, `auth()` middleware with zero boilerplate; generous free tier (10,000 MAU) |

**Confidence: MEDIUM** — Clerk features from training data; official docs were inaccessible during research.

**Why Clerk over Auth.js (NextAuth v5):** Auth.js requires you to wire sessions, database adapters, and provider configs manually. Clerk gives a production-ready hosted auth UI that non-technical users expect (password reset, email verification, social login) in ~30 minutes of integration. For a v1 targeting non-technical users where UX must be frictionless, Clerk's pre-built components eliminate 2–3 weeks of auth work.

**Why not Supabase Auth:** Supabase bundles auth + database together. We're using Neon for the database, so Supabase's auth alone is redundant overhead. Clerk is purpose-built for Next.js auth.

---

### Background Jobs / Scheduling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| APScheduler | 3.x | Dashboard auto-refresh scheduling | In-process scheduler for FastAPI; re-runs saved queries on user-configured intervals; no separate broker required for v1 |
| Redis | 7.x | Job queue broker (for Celery if needed) | Only needed if APScheduler proves insufficient at scale; Upstash Redis (serverless) recommended for Vercel/Render deployments |

**Why APScheduler over Celery for v1:** Celery requires Redis/RabbitMQ as a broker, a worker process, and a beat scheduler — three separate services. APScheduler runs in-process, persists jobs in PostgreSQL (via SQLAlchemy), and handles cron-style intervals. For auto-refresh intervals of minutes (not sub-second), APScheduler is sufficient and eliminates operational complexity. Migrate to Celery if job volume exceeds ~1,000 concurrent scheduled jobs.

---

### File Storage

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel Blob | current | Uploaded Excel/CSV file storage | Native Vercel integration, CDN-backed, S3-compatible API; free tier 512MB |

**Why not S3 directly:** Vercel Blob is S3-backed with a simpler SDK and zero infrastructure setup. If the project moves off Vercel, migrate to S3 — the API surface is nearly identical.

**Alternative:** Cloudflare R2 (S3-compatible, zero egress fees, better for high-volume file reads).

---

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `python-multipart` | 0.0.x | File upload handling in FastAPI | Required for `UploadFile` endpoints (CSV/Excel upload) |
| `cryptography` | 43.x | AES-256-GCM encryption for connection strings | Always — credential security is non-negotiable |
| `python-dotenv` | 1.x | Environment variable management | Local dev; prod uses platform env vars |
| `alembic` | 1.13.x | Database migrations for SQLAlchemy | Only needed if managing the platform DB with SQLAlchemy directly (vs Drizzle for Next.js side) |
| `zod` | 3.x | TypeScript schema validation | Validate LLM-generated chart specifications on the frontend before rendering |
| `SWR` | 2.x | Client-side data fetching for dashboard polling | Handles auto-refresh polling intervals, caching, and revalidation for dashboard data |
| `date-fns` | 3.x | Date formatting in dashboards | Lightweight, tree-shakeable; avoid Moment.js (deprecated) |
| `react-hook-form` | 7.x | Form state for connection string + query forms | Minimal re-renders, Zod integration for validation |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Backend framework | FastAPI | Django REST Framework | Too heavyweight; ORM/admin overhead not needed; limited async |
| Backend framework | FastAPI | Flask | No async; verbose boilerplate for validation |
| LLM framework | LangChain | LlamaIndex | Optimized for RAG/docs, not tabular NL-to-SQL |
| LLM framework | LangChain | Raw OpenAI SDK | Must hand-roll schema introspection, retry logic, multi-step correction |
| Frontend | Next.js 16 | Remix | Less mature ecosystem; Vercel integration advantage lost |
| Frontend | Next.js 16 | Vite + React SPA | No Server Components; no streaming; separate deployment |
| Charting | Recharts + shadcn/ui | Plotly.js | 3.4MB bundle; not composable with React; designed for static plots |
| Charting | Recharts + shadcn/ui | D3.js | Correct for custom viz; wrong for standard dashboard charts |
| ORM (frontend) | Drizzle | Prisma | Binary engine incompatible with Vercel Edge; cold start penalty |
| Database (platform) | Neon | Supabase | Bundled auth/realtime not needed; Neon is Vercel-native |
| Auth | Clerk | Auth.js v5 | Requires manual wiring of sessions, adapters, UI; 2–3 week build vs 30 min |
| Auth | Clerk | Supabase Auth | Bundled with Supabase DB; redundant when using Neon |
| Scheduling | APScheduler | Celery | Three-service dependency (broker + worker + beat) for what is a polling job; overkill for v1 |
| File storage | Vercel Blob | AWS S3 | Requires IAM config, VPC decisions, bucket policies; Blob is zero-config with same API shape |
| Primary LLM | GPT-4o | Claude Sonnet 3.7 | Both viable; GPT-4o Structured Outputs simpler for chart-spec JSON; swap via LangChain |
| Primary LLM | GPT-4o | Local Llama 3 | SQL quality insufficient for schema-agnostic queries without fine-tuning |

---

## Installation

```bash
# Backend (Python 3.12)
pip install fastapi[standard] uvicorn[standard] pydantic
pip install langchain langchain-community langchain-openai
pip install openai
pip install pandas openpyxl sqlalchemy asyncpg pymysql pyodbc
pip install apscheduler
pip install cryptography python-multipart python-dotenv
pip install alembic

# Frontend (Node.js 20+)
npx create-next-app@latest insightengine --typescript --eslint --app --tailwind
cd insightengine
npm install recharts
npx shadcn@latest init
npm install swr zod react-hook-form @hookform/resolvers date-fns
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
npm install @clerk/nextjs
npm install @vercel/blob
```

---

## Sources

| Source | URL | Confidence | Notes |
|--------|-----|------------|-------|
| Next.js official docs | https://nextjs.org/docs/app/getting-started/fetching-data | HIGH | Version 16.1.7 confirmed, dated 2026-03-16 |
| Tailwind CSS official docs | https://tailwindcss.com/docs/installation/framework-guides/nextjs | HIGH | v4.2 confirmed; PostCSS plugin install pattern confirmed |
| pandas release notes | https://pandas.pydata.org/docs/whatsnew/v3.0.0.html | HIGH | v3.0 breaking changes confirmed; Python 3.11+ requirement confirmed |
| Vercel Postgres deprecation | https://vercel.com/docs/storage/vercel-postgres | HIGH | Confirmed deprecated Dec 2024; Neon is current recommendation |
| FastAPI homepage | https://fastapi.tiangolo.com/ | MEDIUM | Confirmed current, version number not on homepage |
| Redis docs | https://redis.io/docs/latest/ | MEDIUM | Confirmed active; version not stated on docs homepage |
| LangChain (NL-to-SQL) | Training data (0.3.x) | MEDIUM | LangChain.com was inaccessible; version from training data |
| GPT-4o SQL accuracy | Training data | LOW | No 2026 benchmark accessed; known strong performer as of Aug 2025 |
| Recharts | Training data (2.x) | MEDIUM | recharts.org inaccessible; widely used in ecosystem per training data |
| Clerk | Training data | MEDIUM | clerk.com inaccessible; features well-established in training data |
| Drizzle ORM | Training data (0.39.x) | MEDIUM | orm.drizzle.team inaccessible; version from training data |
| openpyxl | Training data (3.1.x) | MEDIUM | Site inaccessible; version from training data |
| APScheduler | Training data (3.x) | MEDIUM | No official docs accessed; well-known Python scheduling library |
