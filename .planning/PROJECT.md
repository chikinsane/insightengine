# InsightEngine — Gen AI Data & Dashboard Platform

## What This Is

InsightEngine is a production-ready, Gen AI-powered data and insight retrieval platform that lets non-technical business users connect any data source (Excel/CSV files or databases via connection string), ask natural language questions, and receive automatically generated, auto-refreshing interactive dashboards. The AI not only retrieves data but surfaces anomalies, explains insights in plain English, suggests the best visualizations, and recommends follow-up questions — making data analysis accessible without SQL or coding knowledge.

## Core Value

A non-technical user can upload an Excel sheet or connect a database, type a plain English question, and within seconds see a well-formatted, auto-refreshing dashboard with AI-generated insights, trend analysis, and suggested next questions.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can upload Excel/CSV files as a data source
- [ ] User can connect a database via connection string
- [ ] User can type a natural language question to query their data
- [ ] AI translates natural language to appropriate data query (SQL, pandas, etc.)
- [ ] System generates an interactive web dashboard from query results
- [ ] Dashboard auto-refreshes on a configurable interval
- [ ] AI suggests the best chart/visualization type for each result set
- [ ] AI surfaces anomalies and trend patterns in the data
- [ ] AI explains insights in plain English alongside visualizations
- [ ] AI suggests follow-up questions based on current results
- [ ] User has authenticated account (sign up, login, sessions)
- [ ] User can save and revisit dashboards
- [ ] Dashboards are shareable with others

### Out of Scope

- Mobile native app — web-first for v1
- Real-time streaming data (Kafka, websockets from external systems) — auto-refresh is sufficient for v1
- Direct Google Sheets / Notion integration — file upload covers the spreadsheet use case for v1
- Custom chart code editor — AI handles visualization selection, no manual override for v1

## Context

- The existing codebase in this directory will be assessed for reuse; the codebase map is at `.planning/codebase/`
- Primary users are non-technical business users (analysts, managers) — UX must be frictionless
- "Real-time" means auto-refreshing dashboards on an interval, not push-based streaming
- The AI layer needs to work reliably across schema-agnostic data sources (flat files to relational DBs)
- Production-ready v1: auth, user accounts, deployed, shareable dashboards

## Constraints

- **Users**: Non-technical — UI must require zero SQL/coding knowledge
- **Data Sources**: Excel/CSV (upload) + databases (connection string) must both work in v1
- **Deployment**: Must be deployable and publicly accessible (not just local)
- **Security**: User data and connection credentials must be handled securely; credentials never stored in plaintext

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Excel/CSV as primary v1 data source | Lowest barrier to entry, widest user base | — Pending |
| Auto-refresh over push streaming | Simpler architecture, sufficient for business insight use case | — Pending |
| Interactive web UI (not PDF export) | Enables exploration, filtering, follow-up questions | — Pending |
| Production-ready v1 (not just demo) | User wants a deployable, shareable product from day one | — Pending |

---
*Last updated: 2026-03-17 after initialization*
