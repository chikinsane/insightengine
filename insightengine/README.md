# InsightEngine

A Gen AI-powered data insight engine. Upload any CSV or Excel file, ask questions in plain English, and get instant charts, trends, and AI-powered analysis — no SQL required.

**Live demo:** https://talktodata.netlify.app

---

## What it does

- Upload a CSV or Excel spreadsheet
- Ask natural language questions: *"Show total payroll by department"*, *"Which state has the highest average CTC?"*
- Get auto-generated charts (bar, line, pie, scatter, table) with a type switcher
- AI-written insights explaining what the data means
- Follow-up question suggestions
- Full query history with search, grouped by dataset

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | Clerk |
| Database | Neon (PostgreSQL via Drizzle ORM) |
| File storage | Netlify Blobs |
| Query engine | better-sqlite3 (in-memory SQLite) |
| AI | Anthropic Claude (claude-sonnet-4-5) |
| Charts | Recharts |
| Hosting | Netlify |

---

## Deploy your own copy

### 1. Fork and clone

```bash
git clone https://github.com/YOUR_USERNAME/insightengine.git
cd insightengine
npm install
```

### 2. Create a Clerk app (Auth)

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) and create a new application
2. Enable **Email** sign-in (Google/GitHub optional)
3. Copy your **Publishable Key** and **Secret Key** from the API Keys page

### 3. Create a Neon database

1. Go to [neon.tech](https://neon.tech) and create a free project
2. From the dashboard, copy the **pooled connection string** (ends in `?sslmode=require`)
3. Run the database migrations once:

```bash
# From the insightengine/ directory
npx drizzle-kit push
```

### 4. Get an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign up
2. Add at least $5 in credits at **Plans & Billing** (needed to call the API)
3. Create an API key at **Settings → API Keys**

### 5. Set environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
# then edit .env.local with your keys
```

### 6. Run locally

```bash
# Option A: plain Next.js (file uploads won't work — no Netlify Blobs locally)
npm run dev

# Option B: via Netlify CLI (recommended — full feature parity with production)
npm install -g netlify-cli
netlify login
netlify link   # link to your Netlify site
netlify dev    # starts on http://localhost:8888
```

### 7. Deploy to Netlify

#### Option A — Deploy button (one click)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/chikinsane/insightengine)

#### Option B — Manual

1. Push your fork to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**
3. Select your repo, Netlify auto-detects the `netlify.toml` config
4. Go to **Site configuration → Environment variables** and add all 6 keys from `.env.example`
5. Trigger a deploy — it takes ~2 minutes

---

## Project structure

```
src/
├── app/
│   ├── dashboard/          # Main app (Server Component + Client state machine)
│   ├── api/
│   │   ├── upload/         # File ingestion + schema inference
│   │   ├── datasets/       # CRUD for datasets
│   │   └── queries/        # Query history
├── components/
│   ├── BrainCanvas.tsx     # 3D neural network animation
│   ├── HistoryPanel.tsx    # Slide-in query history drawer
│   ├── charts/             # Bar, Line, Pie, Scatter, Table views
│   ├── query/              # QueryInterface, InsightPanel, FollowUpChips
│   └── upload/             # FileUpload, SchemaPreview
├── lib/
│   ├── ai/                 # Anthropic client, NL-to-SQL, enrichment
│   ├── ingestion/          # CSV + Excel parsers, schema inference
│   ├── query/              # SQLite executor, result formatter, validator
│   └── storage/            # Netlify Blobs abstraction
└── db/
    └── schema.ts           # Drizzle ORM schema (users, datasets, queries)
```

---

## Environment variables reference

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Set to `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Set to `/sign-up` |
| `DATABASE_URL` | Neon Dashboard → Connection string (pooled) |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |

Netlify Blobs requires no configuration — it is automatically injected at runtime when deployed to Netlify.

---

## Supported file types

| Format | Notes |
|---|---|
| `.csv` | Any delimiter, auto-detected |
| `.xlsx` | First sheet is used |
| `.xls` | First sheet is used |

Max file size: **10 MB**. Up to 1 million rows supported (larger files are sampled for schema inference).
