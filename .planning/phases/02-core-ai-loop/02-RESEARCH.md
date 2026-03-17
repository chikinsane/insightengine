# Phase 2: Core AI Loop - Research

**Researched:** 2026-03-17
**Domain:** CSV/Excel Ingestion, DuckDB, NL-to-SQL, Anthropic Structured Outputs, Recharts, Netlify Blobs
**Confidence:** HIGH (all critical decisions verified against official docs or current npm registry)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DS-01 | Upload Excel / CSV files as a data source | PapaParse + SheetJS parsing; Netlify Blobs storage; multipart/form-data Next.js API route |
| DS-04 | Schema inference with preview/override step | Type-detection algorithm; confidence scoring; UI confirmation step before first query |
| NLQ-01 | Plain English question input | React form with Zod validation; SWR for polling result |
| NLQ-02 | AI translates NL to DuckDB query (files) | Anthropic structured outputs; schema context injection; retry-with-correction loop |
| NLQ-04 | AI selects best chart/visualization type | Structured output contract includes `vizType` enum; rule-based guardrails override LLM suggestion |
| NLQ-05 | AI plain English explanation alongside each chart | Statistical summary sent to LLM (not raw rows); parallel AI enrichment pattern |
| NLQ-06 | AI suggests 3 follow-up questions per result | Parallel LLM call; follow-up rendered as clickable chips; prior result summary carried as context |
</phase_requirements>

---

## Summary

Phase 2 builds the full CSV/Excel-to-chart AI loop entirely within the Next.js codebase — no new Python backend surface for this phase (the existing `backend/` from Phase 1 is used for Phase 4 database connections only). The loop has five stages that run in sequence then branch to parallel enrichment: (1) file upload and storage to Netlify Blobs, (2) CSV/Excel parsing + schema inference with confidence scoring, (3) Schema Registry entry in Neon/Drizzle, (4) NL question → Anthropic structured-output call → DuckDB query execution, (5) parallel enrichment (insight narration, viz-type selection, follow-up questions) using statistical summaries, never raw rows.

The two highest-risk technical decisions are DuckDB on Netlify and file storage. For DuckDB: the old `duckdb` npm package is deprecated and its replacement `@duckdb/node-api` (v1.5.0, released early 2026) is the current standard; it requires `serverExternalPackages` config in `next.config.ts` and `external_node_modules` + `node_bundler = "nft"` in `netlify.toml` to work with Netlify's native module bundling. For file storage: Netlify has an ephemeral filesystem so uploaded files cannot be written to disk permanently; `@netlify/blobs` (v10.7.2) is Netlify's native zero-config object store that supports binary data and works from Next.js API routes.

The Anthropic SDK (`@anthropic-ai/sdk` v0.79.0) now supports structured outputs via `output_config.format` with `zodOutputFormat` — this eliminates all parsing retry loops for the chart-spec response contract. The SQL validation gate in this phase uses a TypeScript regex whitelist (same pattern as ARCHITECTURE.md) rather than invoking the Python sqlglot backend; this keeps Phase 2 self-contained in Next.js and matches the phase constraint.

**Primary recommendation:** Build the upload → schema-inference → DuckDB query → Recharts rendering pipeline in pure Next.js using `@duckdb/node-api`, `@netlify/blobs`, PapaParse + SheetJS, and `@anthropic-ai/sdk` with Zod-structured outputs. Parallelize the three AI enrichment calls after query execution. Keep the TypeScript DML regex gate as the query validator for this phase.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@duckdb/node-api` | 1.5.0 | In-process SQL over CSV/Parquet in Next.js API routes | Official replacement for deprecated `duckdb` npm package; native Promise API; no callback wrappers needed |
| `@anthropic-ai/sdk` | 0.79.0 | NL-to-SQL + AI enrichment via Claude | ANTHROPIC_API_KEY already stubbed in codebase; structured outputs GA as of v0.68+; Sonnet 4.5 available |
| `@netlify/blobs` | 10.7.2 | Store uploaded CSV/Excel files persistently | Netlify filesystem is ephemeral; Blobs is zero-config native store for binary data; works from API routes |
| `papaparse` | 5.5.3 | CSV parsing with streaming and dynamic typing | Industry standard; Node.js streaming mode; `dynamicTyping` for automatic type detection |
| `xlsx` | 0.18.5 | Excel .xlsx/.xls parsing | Industry standard; `sheet_to_json` converts to row arrays; handles merged cells and multi-sheet |
| `zod` | 4.3.6 | Runtime schema validation + structured output contracts | `zodOutputFormat` from `@anthropic-ai/sdk/helpers/zod` used to enforce LLM response schema |
| `recharts` | 3.8.0 | Chart rendering (bar, line, pie, area, scatter) | Already in codebase decision; React-native; shadcn/ui charts layer provides theming |
| `swr` | 2.4.1 | Client-side polling for query results | Standard Next.js data fetching; handles loading/error/revalidation states |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-dropzone` | 15.0.0 | File drag-and-drop upload UI | Standard accessible file upload component; handles MIME type filtering |
| `react-hook-form` | 7.x (install) | NL question input form state | Minimal re-renders; Zod integration for validation |
| `date-fns` | 3.x (install) | Date formatting in chart tooltips | Lightweight; tree-shakeable; avoid Moment.js |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@duckdb/node-api` | `@duckdb/duckdb-wasm` (WASM) | WASM works without native binaries but has no filesystem access from server; node-api is better for server-side query over stored files |
| `@netlify/blobs` | AWS S3 or Cloudflare R2 | R2 has zero egress fees and is better at scale; Netlify Blobs is zero-config and sufficient for Phase 2 |
| `papaparse` + `xlsx` | `csv-parse` + `exceljs` | Both are valid; papaparse + xlsx are higher-download, battle-tested, and the architecture docs already reference them |
| Zod structured outputs | raw `JSON.parse` + retry | Structured outputs with `zodOutputFormat` gives schema-guaranteed responses; retry is unnecessary overhead |

**Installation:**
```bash
npm install @duckdb/node-api @anthropic-ai/sdk @netlify/blobs papaparse xlsx zod recharts swr react-dropzone react-hook-form @hookform/resolvers date-fns
npm install -D @types/papaparse
```

**Version verification (2026-03-17):**
```
@duckdb/node-api     1.5.0     (verified npm view)
@anthropic-ai/sdk    0.79.0    (verified npm view)
@netlify/blobs       10.7.2    (verified npm view)
papaparse            5.5.3     (verified npm view)
xlsx                 0.18.5    (verified npm view)
zod                  4.3.6     (verified npm view)
recharts             3.8.0     (verified npm view)
swr                  2.4.1     (verified npm view)
react-dropzone       15.0.0    (verified npm view)
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── upload/
│   │   │   └── route.ts          # POST: parse file → schema → store blob → return datasetId
│   │   ├── datasets/
│   │   │   ├── route.ts          # GET: list user datasets
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET/DELETE dataset
│   │   │       └── query/
│   │   │           └── route.ts  # POST: NL → SQL → DuckDB → enrichment
│   ├── (dashboard)/
│   │   └── query/
│   │       └── page.tsx          # NL question input + chart display
│   └── components/
├── components/
│   ├── upload/
│   │   ├── FileUpload.tsx        # Dropzone + MIME filter
│   │   └── SchemaPreview.tsx     # Column type preview + confidence badges + override UI
│   └── charts/
│       ├── ChartRenderer.tsx     # Routes to correct Recharts component by vizType
│       ├── BarChartView.tsx
│       ├── LineChartView.tsx
│       ├── PieChartView.tsx
│       └── TableView.tsx         # Fallback for high-cardinality or non-chart results
├── lib/
│   ├── ingestion/
│   │   ├── csv-parser.ts         # PapaParse wrapper → ColumnMeta[]
│   │   ├── excel-parser.ts       # SheetJS wrapper → ColumnMeta[]
│   │   └── schema-inference.ts   # Type detection + confidence scoring → SchemaColumn[]
│   ├── query/
│   │   ├── duckdb-client.ts      # @duckdb/node-api singleton + query executor
│   │   ├── query-validator.ts    # TypeScript regex DML whitelist gate
│   │   └── result-formatter.ts   # Raw DuckDB rows → QueryResult with summary stats
│   ├── ai/
│   │   ├── anthropic-client.ts   # @anthropic-ai/sdk singleton + structured output helpers
│   │   ├── nl-to-sql.ts          # Schema context builder + NL→SQL prompt + validation loop
│   │   ├── enrichment.ts         # Parallel: insight + vizType + followUps from stat summary
│   │   └── prompts.ts            # Prompt templates (system prompts, XML-tagged schemas)
│   └── storage/
│       └── blob-store.ts         # Netlify Blobs abstraction (upload, download, delete)
├── db/
│   └── schema.ts                 # Already exists — datasets table has schema jsonb column
└── types/
    └── query.ts                  # QueryResult, SchemaColumn, VizType, EnrichmentResult types
```

### Pattern 1: File Upload → Schema Inference → Blob Storage

**What:** A single `POST /api/upload` route handles multipart upload, parses the file in-memory, infers schema, stores the raw file in Netlify Blobs, writes the dataset record to Neon, and returns the schema preview.

**When to use:** Every file upload.

**Example:**
```typescript
// Source: @netlify/blobs official docs
import { getStore } from '@netlify/blobs'
import Papa from 'papaparse'

// Store binary file buffer
const store = getStore('uploaded-files')
const buffer = Buffer.from(await file.arrayBuffer())
await store.set(`${userId}/${datasetId}`, buffer, {
  metadata: { filename: file.name, mimeType: file.type, userId }
})

// Later: retrieve for DuckDB
const blob = await store.get(`${userId}/${datasetId}`, { type: 'arrayBuffer' })
```

### Pattern 2: Schema Inference with Confidence Scoring

**What:** Sample the first 200 rows of a CSV/Excel file, attempt type detection per column, assign a confidence level, flag LOW-confidence columns for user override before the first query runs.

**When to use:** Every upload, before writing the Schema Registry entry.

**Example:**
```typescript
// Source: Architecture pattern + pandas 3.0 parallel (TypeScript equivalent)
interface SchemaColumn {
  name: string
  inferredType: 'string' | 'number' | 'date' | 'boolean'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  sampleValues: string[]
  nullRate: number
}

function inferColumnType(values: unknown[]): { type: SchemaColumn['inferredType'], confidence: SchemaColumn['confidence'] } {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '')
  if (nonNull.length === 0) return { type: 'string', confidence: 'LOW' }

  // Number detection — avoid false positives on phone numbers / ZIP codes
  const numberPct = nonNull.filter(v => !isNaN(Number(v)) && String(v).trim() !== '').length / nonNull.length
  if (numberPct > 0.95) return { type: 'number', confidence: 'HIGH' }
  if (numberPct > 0.7) return { type: 'number', confidence: 'LOW' }  // Mixed: flag for user

  // Date detection
  const datePct = nonNull.filter(v => !isNaN(Date.parse(String(v)))).length / nonNull.length
  if (datePct > 0.9) return { type: 'date', confidence: 'HIGH' }
  if (datePct > 0.6) return { type: 'date', confidence: 'MEDIUM' }

  // Boolean
  const boolVals = new Set(['true', 'false', '1', '0', 'yes', 'no'])
  const boolPct = nonNull.filter(v => boolVals.has(String(v).toLowerCase())).length / nonNull.length
  if (boolPct > 0.95) return { type: 'boolean', confidence: 'HIGH' }

  return { type: 'string', confidence: 'HIGH' }  // Fallback
}
```

**Confidence rule:** Any column with `confidence: 'LOW'` blocks query execution until user confirms or overrides the type.

### Pattern 3: DuckDB Query Execution from Netlify Blobs

**What:** At query time, download the stored file buffer from Netlify Blobs into `/tmp`, load it into an in-memory DuckDB instance, execute the AI-generated SQL, return the result rows.

**Critical constraints:**
- `@duckdb/node-api` requires `serverExternalPackages` in `next.config.ts`
- `netlify.toml` needs `external_node_modules = ["@duckdb/node-api", "@duckdb/node-bindings"]`
- Netlify functions have 10-second default timeout — set `maxDuration` for the query route
- Write to `/tmp` (the only writable path in serverless functions) for DuckDB file access

**Example:**
```typescript
// Source: @duckdb/node-api npm docs + DuckDB Node.js docs (official)
import { DuckDBInstance } from '@duckdb/node-api'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export async function executeQuery(
  fileBuffer: ArrayBuffer,
  sql: string,
  datasetId: string
): Promise<QueryResult> {
  // Write buffer to /tmp for DuckDB access
  const tmpPath = path.join(os.tmpdir(), `${datasetId}.csv`)
  fs.writeFileSync(tmpPath, Buffer.from(fileBuffer))

  const instance = await DuckDBInstance.create(':memory:')
  const connection = await instance.connect()

  try {
    // Load the CSV into DuckDB
    await connection.run(`CREATE TABLE data AS SELECT * FROM read_csv_auto('${tmpPath}')`)
    // Replace table reference in generated SQL
    const normalizedSql = sql.replace(/FROM\s+\w+/i, 'FROM data')
    const result = await connection.runAndReadAll(normalizedSql)
    return formatResult(result)
  } finally {
    await connection.close()
    await instance.close()
    // Clean up /tmp file
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
  }
}
```

### Pattern 4: NL-to-SQL with Structured Output + Retry Loop

**What:** Build schema context string using XML tags (per Anthropic prompt engineering best practices), call Claude with `zodOutputFormat` to get a guaranteed-schema response, validate the SQL with the DML gate, retry up to 3 times with a correction prompt on validation failure.

**When to use:** Every NL query.

**Example:**
```typescript
// Source: platform.claude.com/docs/en/build-with-claude/structured-outputs
// Source: platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

const QueryGenSchema = z.object({
  sql: z.string(),
  explanation: z.string(),     // one-sentence plain English description of what the query does
  confidence: z.enum(['high', 'medium', 'low']),
})

const SYSTEM_PROMPT = `You are a SQL expert generating DuckDB-dialect SQL queries.
The user's data is loaded into a table called "data".
Generate only SELECT queries. Never use INSERT, UPDATE, DELETE, DROP, ALTER, or CREATE.
All column references MUST exactly match the schema provided.`

function buildSchemaContext(columns: SchemaColumn[]): string {
  const cols = columns.map(c =>
    `    - ${c.name} (${c.inferredType})${c.sampleValues.length ? ` — samples: ${c.sampleValues.slice(0, 3).join(', ')}` : ''}`
  ).join('\n')
  return `<schema>\nTable: data (${rowCount} rows)\nColumns:\n${cols}\n</schema>`
}

export async function generateSQL(
  question: string,
  columns: SchemaColumn[],
  rowCount: number,
  previousError?: string
): Promise<{ sql: string; explanation: string }> {
  const client = new Anthropic()
  const schemaContext = buildSchemaContext(columns)

  const userMessage = previousError
    ? `${schemaContext}\n\n<error>Previous query failed: ${previousError}. Correct it.</error>\n\nQuestion: ${question}`
    : `${schemaContext}\n\nQuestion: ${question}`

  const response = await client.messages.parse({
    model: 'claude-sonnet-4-5-20250929',  // use Sonnet for cost efficiency
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    output_config: { format: zodOutputFormat(QueryGenSchema, 'query_generation') },
  })

  return { sql: response.parsed_output.sql, explanation: response.parsed_output.explanation }
}

// Retry loop in the API route
async function executeWithRetry(question: string, columns: SchemaColumn[], rowCount: number) {
  let lastError: string | undefined
  for (let attempt = 0; attempt < 3; attempt++) {
    const { sql, explanation } = await generateSQL(question, columns, rowCount, lastError)
    const validation = validateSQL(sql)
    if (!validation.valid) {
      lastError = validation.reason
      continue
    }
    const result = await executeQuery(sql)
    if (result.error) {
      lastError = `DuckDB error: ${result.error}. Check column names match schema exactly.`
      continue
    }
    return { sql, explanation, result }
  }
  throw new Error('Could not generate a valid query after 3 attempts.')
}
```

### Pattern 5: Parallel AI Enrichment from Statistical Summary

**What:** After query execution returns results, compute statistical summary server-side (min, max, mean, top-N values, null rates), then fire three LLM calls in parallel: insight narration, viz-type selection, and follow-up question generation. All three calls operate only on the summary — never raw rows.

**When to use:** After every successful query.

**Example:**
```typescript
// Source: ARCHITECTURE.md Pattern 5 (project research)
function buildStatSummary(result: QueryResult): string {
  return result.columns.map(col => {
    const values = result.rows.map(r => r[col.name])
    const nums = values.filter(v => typeof v === 'number') as number[]
    const uniqueVals = [...new Set(values)].slice(0, 10)

    if (nums.length > 0) {
      const min = Math.min(...nums), max = Math.max(...nums)
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length
      return `${col.name}: min=${min}, max=${max}, mean=${mean.toFixed(2)}, n=${nums.length}`
    }
    return `${col.name}: top values=[${uniqueVals.join(', ')}], unique=${new Set(values).size}`
  }).join('\n')
}

async function runParallelEnrichment(result: QueryResult, question: string): Promise<EnrichmentResult> {
  const summary = buildStatSummary(result)

  const [insight, vizInfo, followUps] = await Promise.allSettled([
    generateInsight(summary, question),       // 1-2 sentence plain English finding
    selectVizType(result, question),          // chart type + rule-based guardrails
    generateFollowUps(summary, question),     // 3 follow-up question strings
  ])

  return {
    insight: insight.status === 'fulfilled' ? insight.value : 'Unable to generate insight.',
    vizType: vizInfo.status === 'fulfilled' ? applyVizGuardrails(vizInfo.value, result) : 'table',
    followUpQuestions: followUps.status === 'fulfilled' ? followUps.value : [],
  }
}
```

### Pattern 6: Recharts Chart Routing by Data Shape

**What:** The `vizType` from AI enrichment (with rule-based override guardrails) determines which Recharts component to render. The client-side `ChartRenderer` is a pure switch dispatch.

**Chart type selection rules (guardrails that override LLM suggestion):**
| Condition | Forced Chart Type |
|-----------|-------------------|
| Result has 1 numeric col + 1 datetime col | `line` |
| Category col has >8 unique values | `table` |
| Result has 2 numeric cols | `scatter` |
| Only proportions/percentages | `pie` |
| Comparing categories (< 8) | `bar` |
| Default / fallback | `table` |

**Recharts data shape requirements:**
| Chart | Required Data Shape | Key Props |
|-------|---------------------|-----------|
| `BarChart` | `[{ name: string, value: number }]` | `dataKey="value"`, `nameKey="name"` |
| `LineChart` | `[{ date: string/number, value: number }]` | `dataKey="value"`, `XAxis dataKey="date"` |
| `PieChart` | `[{ name: string, value: number }]` | `<Pie dataKey="value" nameKey="name">` |
| `ScatterChart` | `[{ x: number, y: number }]` | `<XAxis dataKey="x">`, `<YAxis dataKey="y">` |
| Table | `QueryResult.rows` (any shape) | Column headers from `QueryResult.columns` |

### Anti-Patterns to Avoid

- **Writing uploaded files to `process.cwd()`:** Netlify's function filesystem is ephemeral. Only `/tmp` is writable at runtime. Store persistent files in Netlify Blobs.
- **Loading full CSV into Node.js memory as a JavaScript array:** Use PapaParse streaming mode for parsing; pass only the sample (first 200 rows) to schema inference. Let DuckDB handle the full dataset.
- **Creating a new DuckDB instance per API call without cleanup:** DuckDB native handles must be explicitly closed or they leak. Always use try/finally to `connection.close()` and `instance.close()`.
- **Sending raw rows to the LLM for insight generation:** Compute statistical summary server-side; send only the summary (20-50 tokens) not the rows (potentially thousands of tokens). This is both a cost constraint and a privacy requirement.
- **Using the deprecated `duckdb` npm package:** It will not receive updates for DuckDB 1.5+. Use `@duckdb/node-api` from the start.
- **Hallucinated column names in generated SQL:** Every column reference in the generated SQL must be validated against the Schema Registry before DuckDB execution. The retry-with-correction prompt must explicitly list valid column names.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured LLM responses | Custom JSON regex parser + retry | `zodOutputFormat` from `@anthropic-ai/sdk/helpers/zod` | Constrained decoding at token level; schema-guaranteed; no parse failures |
| CSV type inference | Custom regex per column | PapaParse `dynamicTyping: true` + confidence layer on top | PapaParse handles delimiters, encoding, BOM marks, quoted fields — dozens of edge cases |
| Excel parsing | Custom binary format reader | SheetJS `xlsx` | XLSX binary format is highly complex; SheetJS handles merged cells, multi-sheet, formula values |
| In-process SQL engine | Node.js array `.filter().reduce()` | `@duckdb/node-api` | DuckDB handles GROUP BY, window functions, aggregates on large files at sub-second speed in-process |
| Blob storage | Custom S3 client config | `@netlify/blobs` | Zero config on Netlify; auto-provisioned; no IAM/bucket setup; binary data support |
| File upload UI | Custom `<input type="file">` | `react-dropzone` | MIME type filtering, drag-and-drop, accessible, folder support |
| SQL validation | AST parser from scratch | Regex DML whitelist (TypeScript) for Phase 2 | Phase 1 sqlglot validator exists in Python; TypeScript regex gate is sufficient for Phase 2 since DuckDB files are ephemeral (no persistent mutation possible) |

**Key insight:** The combination of structured outputs + DuckDB + Netlify Blobs eliminates the three hardest problems in this phase (reliable LLM responses, large-file SQL, persistent storage) without any infrastructure setup.

---

## Common Pitfalls

### Pitfall 1: DuckDB Native Module Bundling Fails on Netlify

**What goes wrong:** Netlify's bundler tries to inline `@duckdb/node-api` during build, fails on the native `.node` binary, and the function crashes at runtime with `Module not found` or a webpack parse error.

**Why it happens:** Native Node.js modules include platform-specific compiled binaries. Bundlers cannot inline them.

**How to avoid:**
1. Add to `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ['@duckdb/node-api', '@duckdb/node-bindings'],
}
```
2. Add to `netlify.toml`:
```toml
[functions."___netlify-handler"]
  node_bundler = "nft"
  external_node_modules = ["@duckdb/node-api", "@duckdb/node-bindings"]
```

**Warning signs:** Build succeeds but query API route returns 500 with module resolution errors in Netlify function logs.

### Pitfall 2: DuckDB Timeout on Netlify Functions

**What goes wrong:** The default Netlify function timeout is 10 seconds. A DuckDB query on a 50MB file (download from Blobs + load + execute) can exceed this.

**Why it happens:** Netlify Blobs download + DuckDB file load + query execution + enrichment LLM calls all happen in one request.

**How to avoid:**
```typescript
// route.ts — export config to extend timeout
export const maxDuration = 60  // seconds — requires Netlify Pro or Background Functions
```
Alternatively, split into two endpoints: `POST /query` (returns `queryId`) and `GET /query/:id/result` (polling). For v1, 60s is sufficient.

**Warning signs:** Sporadic 502/504 errors on larger files; works on small test files but fails in production.

### Pitfall 3: Column Hallucination in Generated SQL

**What goes wrong:** Claude generates a SQL query referencing `customer_name` but the actual column is `cust_nm`. DuckDB execution fails.

**Why it happens:** LLMs are probabilistic; without strict schema enforcement in the retry prompt, the model will guess column names.

**How to avoid:** After every failed DuckDB execution, build a correction prompt that explicitly lists every valid column name:
```
Previous query failed: column "customer_name" does not exist.
Valid column names are: cust_nm, order_id, revenue, region_code.
Regenerate the query using only these exact column names.
```

**Warning signs:** Queries that work on "clean" test data fail on real uploaded files with abbreviated or unusual column names.

### Pitfall 4: Schema Inference False Positives

**What goes wrong:** A column of ZIP codes like `"01234"` is inferred as `number` (because 98% of values are numeric), but the leading zero is dropped when treated as a number, corrupting the data.

**Why it happens:** Pure numeric content check does not account for semantic meaning.

**How to avoid:** Add a leading-zero check: if any value has leading zeros, force `string` regardless of numeric ratio. Also flag any column where the number of unique values equals the number of rows (likely an ID/key column) as `string`.

**Warning signs:** Users report incorrect JOIN conditions or WHERE clauses on ID-like columns.

### Pitfall 5: Netlify Blobs Edge Function MissingBlobsEnvironmentError

**What goes wrong:** Calling `getStore()` from a Next.js route running in Edge Runtime throws `MissingBlobsEnvironmentError`.

**Why it happens:** Netlify Blobs auto-injects its config in Lambda-mode functions but NOT in Edge Runtime functions. Next.js App Router API routes use Lambda mode by default, but any route with `export const runtime = 'edge'` will fail.

**How to avoid:** Never use `export const runtime = 'edge'` on any route that calls `getStore()`. Keep upload and query routes in the default Node.js Lambda runtime.

**Warning signs:** Works in local dev (`netlify dev`) but fails on deployed preview URLs.

### Pitfall 6: PapaParse `dynamicTyping` Misidentifies Types

**What goes wrong:** `dynamicTyping: true` converts the string `"TRUE"` to boolean `true` and `"1,234.00"` to `NaN` because of the comma in the number.

**Why it happens:** PapaParse's dynamic typing does not handle locale-formatted numbers (commas as thousands separators).

**How to avoid:** Use PapaParse with `dynamicTyping: false` and implement custom type detection in `schema-inference.ts`. Strip currency symbols (`$`, `£`, `€`) and thousands separators (`,`) before numeric detection. This gives control over the confidence scoring.

**Warning signs:** Schema preview shows correct types but downstream DuckDB aggregates return unexpected NaN values.

### Pitfall 7: Statistical Summary Token Overflow for Wide Tables

**What goes wrong:** A dataset with 50 columns produces a statistical summary that exceeds Claude's practical token limit for the enrichment prompt, causing truncation or refusal.

**Why it happens:** Summary per column is ~50 tokens; 50 columns = 2,500 tokens just for the summary.

**How to avoid:** Cap summary to the first 20 columns; for the remaining columns, summarize as `"and N additional columns"`. For enrichment calls (not NL-to-SQL), only include columns present in the query result, not the full table schema.

**Warning signs:** Enrichment calls succeed on simple queries but fail on SELECT * queries against wide datasets.

---

## Code Examples

Verified patterns from official sources:

### DuckDB Instance Creation and CSV Query
```typescript
// Source: @duckdb/node-api npm documentation (v1.5.0, 2026)
import { DuckDBInstance } from '@duckdb/node-api'

const instance = await DuckDBInstance.create(':memory:')
const connection = await instance.connect()

try {
  await connection.run(`CREATE TABLE data AS SELECT * FROM read_csv_auto('/tmp/upload.csv')`)
  const reader = await connection.runAndReadAll(`SELECT region, SUM(revenue) as total FROM data GROUP BY region ORDER BY total DESC`)
  const rows = reader.getRows()   // returns array of row objects
} finally {
  await connection.close()
  await instance.close()
}
```

### Anthropic Structured Output (TypeScript)
```typescript
// Source: platform.claude.com/docs/en/build-with-claude/structured-outputs (verified 2026-03-17)
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

const QueryResponseSchema = z.object({
  sql: z.string(),
  vizType: z.enum(['bar', 'line', 'pie', 'scatter', 'table']),
  explanation: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
})

const client = new Anthropic()  // uses ANTHROPIC_API_KEY env var

const response = await client.messages.parse({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: userMessage }],
  output_config: { format: zodOutputFormat(QueryResponseSchema, 'query_response') },
})

const { sql, vizType, explanation } = response.parsed_output
```

### Netlify Blobs Store and Retrieve Binary
```typescript
// Source: docs.netlify.com/build/data-and-storage/netlify-blobs/ (verified 2026-03-17)
import { getStore } from '@netlify/blobs'

// Store (upload route)
const store = getStore('user-uploads')
const buffer = Buffer.from(await file.arrayBuffer())
await store.set(`${userId}/${datasetId}`, buffer, {
  metadata: { filename: file.name, uploadedAt: new Date().toISOString() }
})

// Retrieve (query route)
const blob = await store.get(`${userId}/${datasetId}`, { type: 'arrayBuffer' })
if (!blob) throw new Error('File not found in blob store')
const buffer = Buffer.from(blob)
```

### PapaParse in Node.js (no dynamicTyping — manual inference)
```typescript
// Source: papaparse.com docs + Node.js streaming mode
import Papa from 'papaparse'
import { Readable } from 'stream'

function parseCSVBuffer(buffer: Buffer): Promise<{ headers: string[], rows: string[][] }> {
  return new Promise((resolve, reject) => {
    const rows: string[][] = []
    Papa.parse(Readable.from(buffer), {
      dynamicTyping: false,   // manual type inference for confidence scoring
      skipEmptyLines: true,
      step: (result) => rows.push(result.data as string[]),
      complete: () => resolve({ headers: rows[0] || [], rows: rows.slice(1) }),
      error: reject,
    })
  })
}
```

### SheetJS Excel to Rows
```typescript
// Source: SheetJS (xlsx) npm documentation
import * as XLSX from 'xlsx'

function parseExcelBuffer(buffer: Buffer): { headers: string[], rows: string[][] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]  // first sheet
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][]
  return { headers: (data[0] || []).map(String), rows: data.slice(1) }
}
```

### TypeScript DML Validation Gate
```typescript
// Source: ARCHITECTURE.md Pattern 2 (project research — TypeScript version)
// For Phase 2: TypeScript regex gate is sufficient because DuckDB flat files
// are ephemeral (no persistent mutation risk). Phase 4 uses the Python sqlglot AST gate.
export interface ValidationResult {
  valid: boolean
  reason?: string
}

const FORBIDDEN_DML = /\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE)\b/i
const REQUIRE_SELECT = /^\s*(WITH\s+.+?\s+)?SELECT\s/is

export function validateSQL(query: string): ValidationResult {
  const trimmed = query.trim()
  if (FORBIDDEN_DML.test(trimmed)) {
    return { valid: false, reason: 'Query contains disallowed operations. Only SELECT queries are permitted.' }
  }
  if (!REQUIRE_SELECT.test(trimmed)) {
    return { valid: false, reason: 'Query must be a SELECT statement.' }
  }
  return { valid: true }
}
```

### Recharts BarChart Example (shadcn/ui wrapper)
```typescript
// Source: ui.shadcn.com/charts (verified pattern)
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface BarData { name: string; value: number }

export function BarChartView({ data }: { data: BarData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `duckdb` npm package | `@duckdb/node-api` | EOL announced Fall 2025, 1.5.x no longer supports old package | Must migrate; old package gets no updates for DuckDB 1.5+ |
| `output_format` beta header for structured outputs | `output_config.format` GA | Late 2025 (beta announced), GA 2026 | No beta header needed; `messages.parse()` with `zodOutputFormat` is the standard path |
| Prefilled assistant responses to force JSON | Structured outputs with `zodOutputFormat` | Claude 4.x series (2025-2026) | Prefill on last assistant turn is deprecated for Claude 4.6+ models |
| `duckdb-async` wrapper for Promises | Native Promises in `@duckdb/node-api` | 2025 | No wrapper needed; `runAndReadAll()` returns a Promise directly |
| GPT-4o as recommended LLM | Claude Sonnet 4.5 viable with structured outputs | 2025-2026 | Both produce comparable SQL quality; Claude is already the project's configured provider (ANTHROPIC_API_KEY); Sonnet 4.5 is cost-efficient |

**Deprecated/outdated:**
- `duckdb` (old npm package): EOL for DuckDB 1.5.x+. Use `@duckdb/node-api`.
- `duckdb-async`: Wrapper around the deprecated package. Do not use.
- Anthropic beta header `structured-outputs-2025-11-13`: Deprecated, transition period only. Use GA `output_config.format`.
- LangChain for this phase: STACK.md recommended LangChain + Python, but Phase 2 constraint is Next.js-only. LangChain is not in scope.
- Vercel Blob: Original STACK.md suggestion. Project is deployed to Netlify per `netlify.toml` in the repo; use `@netlify/blobs` instead.

---

## Open Questions

1. **DuckDB /tmp size limit on Netlify**
   - What we know: Netlify functions run on AWS Lambda; Lambda provides `/tmp` with 512MB by default (configurable up to 10GB on Lambda but Netlify may have its own limit)
   - What's unclear: Netlify's exact `/tmp` limit for Next.js functions — documentation does not state a specific number
   - Recommendation: Test with a 50MB CSV during development. If `/tmp` limits are hit, switch to DuckDB's httpfs extension to stream directly from Netlify Blobs URL without writing to disk.

2. **Claude model to use for NL-to-SQL**
   - What we know: `claude-sonnet-4-5-20250929` is documented and available; structured outputs are GA on Haiku 4.5, Sonnet 4.5, Opus 4.5 and later
   - What's unclear: Whether the ANTHROPIC_API_KEY stub in the codebase has been provisioned with a live key
   - Recommendation: Use `claude-haiku-4-5` for schema inference and follow-up questions (cost-efficient); use `claude-sonnet-4-5-20250929` for NL-to-SQL (accuracy-sensitive). Fall back to Haiku if Sonnet costs are prohibitive during development.

3. **File size limit for upload**
   - What we know: Netlify Blobs supports "any kind of data"; no documented per-blob size limit found
   - What's unclear: Maximum file size before DuckDB query latency exceeds the 60-second Netlify function timeout
   - Recommendation: Enforce a 25MB upload limit in the API route as a safe Phase 2 default. Research can be revisited in Phase 6 (performance).

4. **Netlify Blobs availability in `netlify dev` (local development)**
   - What we know: `@netlify/blobs` provides a `BlobsServer` for local testing backed by the local filesystem
   - What's unclear: Whether `getStore()` auto-configures in `netlify dev` or needs manual `NETLIFY_BLOBS_CONTEXT` setup
   - Recommendation: Use `netlify dev` (not `next dev`) from the start of Phase 2. If `getStore()` fails, add `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` to `.env.local` for local Blobs access.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest / Vitest (not yet configured for frontend) |
| Config file | None — Wave 0 gap |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

Note: The Python backend uses pytest (24 tests passing from Phase 1). The Next.js frontend has no test framework yet configured. Wave 0 must add Vitest.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DS-01 | CSV file parses to headers + rows | unit | `npx vitest run src/lib/ingestion/csv-parser.test.ts` | ❌ Wave 0 |
| DS-01 | Excel file parses to headers + rows | unit | `npx vitest run src/lib/ingestion/excel-parser.test.ts` | ❌ Wave 0 |
| DS-04 | High-confidence numeric column inferred correctly | unit | `npx vitest run src/lib/ingestion/schema-inference.test.ts` | ❌ Wave 0 |
| DS-04 | ZIP code column (leading zeros) not inferred as number | unit | `npx vitest run src/lib/ingestion/schema-inference.test.ts` | ❌ Wave 0 |
| DS-04 | LOW confidence column blocks query until user overrides | integration | `npx vitest run src/app/api/upload/route.test.ts` | ❌ Wave 0 |
| NLQ-02 | DML in generated SQL rejected by validator | unit | `npx vitest run src/lib/query/query-validator.test.ts` | ❌ Wave 0 |
| NLQ-02 | Valid SELECT passes validator | unit | `npx vitest run src/lib/query/query-validator.test.ts` | ❌ Wave 0 |
| NLQ-02 | Hallucinated column triggers retry and corrects | unit (mock LLM) | `npx vitest run src/lib/ai/nl-to-sql.test.ts` | ❌ Wave 0 |
| NLQ-04 | Rule-based guardrail forces `line` for time-series data | unit | `npx vitest run src/lib/ai/enrichment.test.ts` | ❌ Wave 0 |
| NLQ-05 | Insight generated from stat summary, not raw rows | unit (mock LLM) | `npx vitest run src/lib/ai/enrichment.test.ts` | ❌ Wave 0 |
| NLQ-06 | 3 follow-up questions returned after query result | unit (mock LLM) | `npx vitest run src/lib/ai/enrichment.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose` (unit tests only, < 10s)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — Vitest configuration for Next.js (jsdom environment for components, node for API routes)
- [ ] `src/lib/ingestion/csv-parser.test.ts` — covers DS-01 CSV parsing
- [ ] `src/lib/ingestion/excel-parser.test.ts` — covers DS-01 Excel parsing
- [ ] `src/lib/ingestion/schema-inference.test.ts` — covers DS-04 type inference + confidence scoring
- [ ] `src/lib/query/query-validator.test.ts` — covers NLQ-02 DML gate (TypeScript version)
- [ ] `src/lib/ai/nl-to-sql.test.ts` — covers NLQ-02 retry loop with mocked Anthropic client
- [ ] `src/lib/ai/enrichment.test.ts` — covers NLQ-04, NLQ-05, NLQ-06 with mocked LLM responses
- [ ] Framework install: `npm install -D vitest @vitest/ui jsdom` and add `vitest.config.ts`

---

## Sources

### Primary (HIGH confidence)
- [DuckDB Node.js API Overview](https://duckdb.org/docs/stable/clients/nodejs/overview) — confirmed deprecated `duckdb` package; `@duckdb/node-api` is the recommended replacement
- [Anthropic Structured Outputs Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — `output_config.format` GA, `zodOutputFormat` TypeScript pattern, supported models confirmed
- [Anthropic Prompt Engineering Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) — XML tag schema injection, structured output migration from prefill, Claude 4.x literal instruction-following
- [Netlify Blobs Docs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/) — `getStore()` API, binary data support, Edge Function caveat confirmed
- npm registry (verified 2026-03-17): `@duckdb/node-api@1.5.0`, `@anthropic-ai/sdk@0.79.0`, `@netlify/blobs@10.7.2`, `papaparse@5.5.3`, `xlsx@0.18.5`, `zod@4.3.6`, `recharts@3.8.0`, `swr@2.4.1`, `react-dropzone@15.0.0`

### Secondary (MEDIUM confidence)
- [Next.js + DuckDB async discussion (GitHub)](https://github.com/vercel/next.js/discussions/49709) — `serverExternalPackages` workaround for native modules; confirmed pattern
- [Netlify native modules docs](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) — `external_node_modules` + `node_bundler = "nft"` for native addons
- [PapaParse docs](https://www.papaparse.com/) — Node.js streaming mode, `dynamicTyping` behavior and caveats
- [SheetJS documentation](https://sheetjs.com/) — `XLSX.read()` + `sheet_to_json()` pattern
- [Recharts chart types guide](https://recharts.github.io/en-US/api/) — chart component APIs and data shape requirements
- [shadcn/ui Charts](https://ui.shadcn.com/charts/area) — Recharts wrapper patterns, theming

### Tertiary (LOW confidence — verified but from single source)
- Netlify `/tmp` size limit: Not explicitly documented; assumed to match AWS Lambda defaults. Must be verified empirically during development.
- `@duckdb/node-api` `runAndReadAll()` method signature: Documented in npm page description but method signatures need verification against the actual TypeScript types during implementation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified against npm registry 2026-03-17; DuckDB migration confirmed from official docs; Anthropic structured outputs confirmed from official docs
- Architecture: HIGH — patterns derived from official docs + project's own architecture research; DuckDB + Netlify Blobs combination is the only viable approach given Netlify's ephemeral filesystem
- Pitfalls: HIGH — DuckDB bundling/timeout pitfalls sourced from community reports + official Netlify docs; column hallucination from project research; confidence scoring pitfalls from data engineering practice
- Validation architecture: MEDIUM — Vitest config for Next.js is standard but requires Wave 0 setup; test file structure is planned but not yet verified against actual codebase

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (30 days — stable libraries, but verify `@duckdb/node-api` minor version if > 2 weeks elapse before starting implementation)

---

## Key Architectural Decision: Next.js Only vs Python Backend

The additional context for Phase 2 states: "no separate FastAPI — keep it Next.js only for simplicity since no Python backend exists yet." However, Phase 1 DID build a FastAPI backend at `/backend/` (query validator + encryption). The resolution:

**Phase 2 stays entirely in Next.js API routes.** The Python backend at `/backend/` was built for Phase 4 (credential encryption, sqlglot SQL validation for live DB connections). For Phase 2 (flat-file DuckDB path):

- The DML validation uses a TypeScript regex gate in Next.js (sufficient for ephemeral DuckDB — no persistent mutation is possible)
- CSV/Excel parsing uses PapaParse + SheetJS in Node.js (no pandas needed)
- The LLM calls use `@anthropic-ai/sdk` directly in TypeScript (no LangChain needed)
- DuckDB runs via `@duckdb/node-api` in Node.js (no Python needed)

The Python backend is preserved for Phase 4 where sqlglot's AST-level validation is required for live database connections where mutation risk is real.
