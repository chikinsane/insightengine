# InsightEngine — Gen AI Data & Dashboard Platform

## What This Is

InsightEngine is a production-ready, Gen AI-powered data and insight retrieval platform that lets non-technical business users connect any data source (Excel/CSV files or live databases via connection string), ask natural language questions, and receive automatically generated, auto-refreshing interactive dashboards. The AI not only retrieves data but explains insights in plain English, suggests the best visualizations, and recommends follow-up questions — making data analysis accessible without SQL or coding knowledge.

## Core Value

A non-technical user can upload an Excel sheet or connect a database, type a plain English question, and within seconds see a well-formatted, auto-refreshing dashboard with AI-generated insights and suggested next questions.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Auth**
- [ ] User can sign up and log in with email + password
- [ ] Sessions persist across reloads
- [ ] Each user's data and dashboards are isolated (multi-tenant, 2-10 users)

**Data Sources**
- [ ] User can upload Excel / CSV files as a data source
- [ ] User can connect a live database via connection string (PostgreSQL, MySQL)
- [ ] Database credentials are stored with envelope encryption — never plaintext
- [ ] System infers schema from uploaded files with a preview/override step
- [ ] Read-only database access enforced for all live connections

**Natural Language Queries**
- [ ] User types a plain English question to query their data
- [ ] AI translates natural language to SQL (live DB) or DuckDB query (files)
- [ ] All AI-generated queries pass through AST-level DML filter before execution
- [ ] AI automatically selects the best chart/visualization type for each result
- [ ] AI writes a plain English explanation (1-2 sentences) alongside each chart
- [ ] AI suggests 3 follow-up questions after each query result

**Dashboard**
- [ ] User can save and name dashboards
- [ ] User can share a dashboard via a read-only link
- [ ] Dashboard auto-refreshes on a configurable interval (cache-first, min interval floor)
- [ ] User can export a dashboard to PDF/PNG

### Out of Scope

- Mobile native app — web-first for v1
- Real-time streaming data (Kafka, websockets) — auto-refresh polling is sufficient
- Google Sheets / Notion integration — file upload covers this for v1
- Custom chart code editor — AI handles visualization selection
- Multi-turn conversation / multi-source joins — v2 after core loop is proven
- Anomaly detection — v2 AI enrichment layer

## Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 16 + Tailwind v4 + Recharts | App Router, streaming for progressive dashboard load |
| Backend | FastAPI + Python 3.11+ | Persistent service on Render (not serverless) |
| AI / NL-to-Query | LangChain + Anthropic Claude | Schema context injection on every query |
| File Query Engine | DuckDB | In-process columnar SQL on CSV/Parquet |
| App Database | Neon (PostgreSQL) + Drizzle ORM | User accounts, dashboards, schema registry |
| Auth | Clerk | Pre-built components, email + social |
| File Storage | Vercel Blob | Uploaded CSV/Excel files |
| Deployment | Vercel (frontend) + Render (backend) | Split-service architecture |
| Credential Encryption | Envelope encryption (AES-256 + KMS) | Must be designed in Phase 1, not retrofitted |

## Context

- Existing codebase assessed for reuse — codebase map at `.planning/codebase/`
- Primary users: non-technical business users (analysts, managers) — UX must be frictionless
- "Real-time" = auto-refreshing dashboards on interval, not push-based streaming
- AI layer must work reliably across schema-agnostic sources (flat files to relational DBs)
- Small team deployment (2-10 users) with per-user data isolation

## Constraints

- **Users**: Non-technical — UI must require zero SQL/coding knowledge
- **Data Sources**: Excel/CSV (upload) + live databases (connection string) both in v1
- **Deployment**: Vercel + Render, publicly accessible from day one
- **Security**: Credentials never stored in plaintext; envelope encryption from Phase 1
- **Query Safety**: AST-level DML filter + read-only DB user (two layers, non-negotiable)
- **Auto-refresh**: Cache-first with minimum interval floor to prevent DB hammering

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| File upload + DB connections in v1 | User explicitly requested both | Accepted |
| Envelope encryption from Phase 1 | Cannot be retrofitted; trust-ending if leaked | Accepted |
| Persistent FastAPI backend on Render | APScheduler + DuckDB don't work in serverless | Accepted |
| Split-service architecture (Next.js + FastAPI) | Python runtime required for pandas/LangChain | Accepted |
| Cache-first auto-refresh with min interval | Prevents DoS against users' own databases | Accepted |
| AST-level DML filter on all AI SQL | LLMs generate DML even with restrictive prompts | Accepted |
| Flat-file path validated before DB path | Build and prove AI loop on CSV before adding DB complexity | Accepted |
| Small team multi-tenant (2-10 users) | Per-user isolation, no billing/usage-limits needed | Accepted |

---
*Last updated: 2026-03-17 — requirements confirmed, stack decided*
