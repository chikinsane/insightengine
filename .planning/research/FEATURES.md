# Feature Landscape

**Domain:** Gen AI Data Analytics / BI Dashboard Platform
**Researched:** 2026-03-17
**Confidence note:** Web search and WebFetch tools were unavailable during this research session. All findings are based on training data (knowledge cutoff August 2025) covering products: ThoughtSpot, Tableau Pulse, Power BI Copilot, Sigma Computing, Databricks AI/BI, Julius AI, Rows.com, Metabase, Hex, Mode Analytics, Domo, Looker Studio. Confidence levels reflect this constraint.

---

## Table Stakes

Features users expect from any Gen AI analytics/BI product. Missing = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Natural language question input | Core product promise — "ask in English, get data" | Medium | Must handle ambiguous phrasing, typos, vague column references |
| AI-generated SQL / query translation | Every product in this space does this — users expect it to "just work" | High | Needs schema-awareness, context about user's data, error recovery when query fails |
| Interactive charts / visualizations | Static images are unacceptable — users expect to hover, filter, zoom | Medium | Line, bar, pie, scatter are minimum; table view always needed as fallback |
| AI-selected chart type | Users do not want to pick chart types — AI choice is the promise | Medium | Must pick sensibly (time series → line, categories → bar, etc.) |
| File upload (CSV/Excel) | Widest adoption path for non-technical users | Medium | .csv, .xlsx, .xls minimum; handle encoding issues, headers detection, multi-sheet Excel |
| Database connection | Required for real business use beyond prototyping | High | PostgreSQL and MySQL minimum; connection string UX must be guided, not raw |
| Dashboard saving and naming | Users expect to return to their work | Low | Requires auth; naming, last-modified timestamp |
| User authentication | Any product with persistent data requires accounts | Medium | Email/password minimum; OAuth (Google) highly expected |
| Dashboard sharing via link | "Send this to my manager" is the #1 use case after insight discovery | Medium | Public link or team-scoped link; view-only vs edit permissions |
| Query result table view | Charts sometimes don't answer the question — raw table fallback is expected | Low | Sortable columns, pagination for large result sets |
| Loading / progress states | AI queries take 3-15 seconds — blank screen kills trust | Low | Spinner with status text ("Generating query...", "Fetching data...") |
| Error messages that are human-readable | Non-technical users cannot parse SQL errors or stack traces | Low | Must translate database errors into plain English suggestions |
| Auto-refresh on configurable interval | Repeated manual queries are friction — dashboards should stay current | Medium | 5min / 15min / 1hr options; pause when tab hidden to save quota |
| Plain English insight explanations | The "AI" differentiator — but users now expect it | Medium | 2-3 sentence summary alongside every chart: what the data shows, notable change |
| Responsive web UI | Business users open dashboards on laptops AND in meetings on large screens | Low | Not mobile-native, but must not break at non-standard viewports |

---

## Differentiators

Features that set InsightEngine apart. Not universally expected, but create strong competitive moat or delight.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Anomaly / outlier detection surfaced automatically | Users don't know what they don't know — AI finding surprises is high-value | High | Requires statistical layer on top of query results; Z-score or IQR-based flagging; explain anomaly in English |
| Follow-up question suggestions | Keeps users in the exploration loop without needing SQL skills | Medium | LLM generates 3-5 contextually relevant next questions from current result set; click-to-ask |
| Multi-source dashboard | One dashboard pulling from both uploaded CSV AND a live database | High | Data joining across heterogeneous sources is genuinely hard and rare in SMB-tier tools |
| Schema-aware context memory | AI remembers column meanings, business terms, and prior questions in session | High | Reduces repeated disambiguation; "revenue" always maps to `orders.total_amount` once clarified |
| Data freshness indicator | Shows "last updated 4 minutes ago" per data source | Low | Builds trust; critical for dashboards shared with stakeholders |
| Visualization drill-down | Click a bar in a chart to filter the entire dashboard | Medium | Standard in enterprise BI but rare in AI-native tools targeted at non-technical users |
| Trend analysis with natural language summary | "Sales are up 12% MoM, driven by the Enterprise segment" generated automatically | High | Requires time-series detection + LLM synthesis; high perceived AI value |
| Dashboard layout customization | Drag-and-drop widget repositioning after AI generates layout | Medium | Users want to tweak AI output; full lock-in to AI layout creates friction |
| Export to PDF / image | "I need to put this in a slide deck" is a constant request | Low | PNG export per chart and PDF export for full dashboard |
| Scheduled email delivery | Dashboard sent to inbox on Monday morning without logging in | Medium | Cron job + email + snapshot rendering; high business value for non-daily users |
| Embedded sharable widget | Paste a dashboard into Notion, Confluence, or a web page | High | iframe embed with auth token; security complexity is high |
| Query history and replay | Show previous questions and results; re-run with updated data | Low | Audit trail + convenience; feeds the "follow-up question" feature |
| AI-generated dashboard title and description | Auto-names the dashboard based on the question asked | Low | Small LLM call; reduces friction in saving/sharing |
| Column/data glossary | User can define what "ARR", "churn", "active user" means in their data | Medium | Critical for business-specific terminology the LLM won't know out of the box |
| Multi-turn conversation | Ask "now filter that to just Q1" as a follow-up in the same context window | High | Requires query context threading; most non-enterprise tools don't do this well |

---

## Anti-Features

Features to deliberately NOT build in v1. Either premature, adds complexity without proportional value, or contradicts the product's non-technical user focus.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Custom SQL editor / code view | Contradicts the "no coding required" core promise; adds UI complexity; non-technical users are confused by it | Let the AI write SQL; show the generated query as read-only for transparency if needed |
| Custom chart code editor (Vega, D3, custom JS) | Power users want this, but it's a massive scope increase and intimidates target users | AI selects chart type; allow limited customization (colors, title) without code |
| Real-time streaming data (Kafka, WebSockets) | High infrastructure complexity; polling/auto-refresh is sufficient for business insight cadence | Auto-refresh on configurable interval covers the use case for v1 |
| Mobile native app (iOS/Android) | Separate build, separate release cycle, separate auth; dashboards are viewed, not built, on mobile | Ensure web UI is usable on mobile browsers at minimum |
| ETL / data transformation pipeline builder | This is a separate product (dbt, Fivetran); building it dilutes the AI analytics focus | Accept data as-is; basic type coercion and null handling only |
| Role-based access control (RBAC) / row-level security | Complex to implement correctly; enterprise concern; v1 users share entire dashboards | Simple owner vs viewer model; skip row-level filtering |
| Collaboration / comments on dashboards | Adds social layer; increases scope; not the core job-to-be-done | Shareable links with view access covers the immediate need |
| Version history / dashboard rollback | Git-for-dashboards is appealing but complex; premature for v1 | Manual save with last-modified timestamp is sufficient |
| Marketplace / community dashboards | Template gallery adds discovery complexity; premature before core is solid | Focus on user's own data; sample data onboarding covers empty-state |
| On-premise / self-hosted enterprise deployment | Security-sensitive enterprises need it but it's a support burden; contradicts SaaS model | Cloud-hosted with encrypted credential storage; flag for post-v1 |
| AI training on user data (fine-tuning) | Privacy minefield; extremely complex; marginal benefit over prompt engineering | Use prompt engineering with schema injection; no training on user data |
| White-labeling / OEM | B2B2C complexity; premature before product-market fit | Direct B2C / B2SMB model for v1 |

---

## Feature Dependencies

```
auth (user accounts)
  └── dashboard saving
        ├── dashboard sharing (link generation requires saved dashboard)
        ├── query history
        ├── auto-refresh scheduling (needs owner identity for quota)
        └── scheduled email delivery

data source connection (CSV upload OR database)
  └── schema extraction / column discovery
        └── AI query translation (NL → SQL / pandas)
              ├── chart rendering (needs result set)
              │     ├── AI chart type selection (picks from result set shape)
              │     ├── plain English insight explanation
              │     ├── anomaly detection
              │     └── trend analysis
              ├── query result table view
              └── follow-up question suggestions (from result context)

schema-aware context memory
  └── multi-turn conversation (depends on session context)
  └── column/data glossary (user-defined terms feed context)

dashboard saving
  └── export (PDF/PNG needs a saved, rendered dashboard)
  └── scheduled email delivery
  └── data freshness indicator
```

**Critical path for v1 MVP:**
`auth → data source → schema extraction → NL query → result rendering → chart + insight → save + share`

---

## MVP Recommendation

Prioritize (in order):

1. **File upload (CSV/Excel)** — lowest barrier; validates core AI loop with zero infra
2. **NL question → AI SQL/query translation** — the core product promise
3. **Auto-selected chart + table view** — minimum useful output
4. **Plain English insight explanation** — separates this from a generic "text-to-SQL" tool
5. **Dashboard save + share link** — enables the "show my manager" use case
6. **User authentication** — required for save/share
7. **Database connection (PostgreSQL/MySQL)** — unlocks real business use; build after CSV loop is validated
8. **Auto-refresh** — add once database connection is live; meaningless for static file uploads
9. **Follow-up question suggestions** — high-delight, medium effort; add in second iteration
10. **Anomaly / outlier detection** — high value but high complexity; third iteration

**Defer until validated (post-MVP):**

| Feature | Reason to Defer |
|---------|----------------|
| Multi-source dashboard (CSV + DB join) | Complex data layer; validate single-source first |
| Scheduled email delivery | Needs background job infra; ship after core loop is loved |
| Drill-down / cross-filter | Requires stateful dashboard engine; v2 |
| Multi-turn conversation | LLM context management complexity; v2 |
| Column/data glossary | Valuable but not blocking early adoption |
| Export to PDF/image | Nice-to-have; browser print-to-PDF covers it for early users |
| Dashboard layout customization | AI-generated layout is fine for v1 |

---

## Competitive Reference Points

Based on training data (confidence: MEDIUM — verify against current product pages):

| Product | Positioning | What they do well | Where InsightEngine can win |
|---------|-------------|-------------------|----------------------------|
| ThoughtSpot | Enterprise NL search over data | Deep SQL generation, search-first UX | Simpler onboarding; file upload; lower price point |
| Tableau Pulse | AI insights layer on Tableau | Anomaly detection, digest emails | Not locked to Tableau data sources; works with uploaded files |
| Power BI Copilot | Microsoft-native AI BI | Deep Office integration | Works outside Microsoft ecosystem; less setup |
| Databricks AI/BI (Genie) | NL over Databricks lakehouses | Excellent SQL accuracy on complex schemas | No Databricks required; non-technical user focus |
| Julius AI | AI data analysis (upload file) | CSV/Excel upload, chart generation | Auto-refresh dashboards; share link; recurring insight |
| Rows.com | AI-augmented spreadsheet | Formulas, API connectors | Dashboard-first; NL questions; no spreadsheet metaphor |
| Metabase | Self-hosted BI with AI | Open source, SQL-optional | Hosted, AI-first, no technical setup required |
| Hex | Collaborative notebook with AI | Analyst-focused, great for SQL users | Non-technical users; no code at all; instant dashboard |

**Key gap InsightEngine fills:** No product in the SMB/non-technical tier combines (1) file upload, (2) database connection, (3) NL questions, AND (4) auto-refreshing dashboard with AI insights in a single frictionless product. Most require either technical setup OR sacrifice the database connection.

---

## Sources

- Training data covering product launches, feature announcements, and documentation through August 2025
- Products covered: ThoughtSpot, Tableau Pulse, Power BI Copilot, Databricks AI/BI (Genie), Julius AI, Rows.com, Metabase, Hex, Sigma Computing, Mode Analytics, Domo, Looker Studio
- **Note:** Live web verification was unavailable (WebSearch and WebFetch denied). Recommend verifying competitive feature claims against current product pages before using as competitive positioning material.
- Confidence: MEDIUM overall. Core feature categorization (table stakes vs differentiators) is HIGH confidence based on known market patterns. Specific competitor feature comparisons are MEDIUM — verify before use in external materials.
