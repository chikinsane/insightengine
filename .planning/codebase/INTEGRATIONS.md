# External Integrations

**Analysis Date:** 2026-03-17

## Overview

The majority of projects are **demo/portfolio applications with no live external integrations** — all data is mocked in-memory. However, several projects have real integration infrastructure in place or stubbed with production upgrade paths.

---

## Hosting & Deployment

**Netlify — All Projects:**
- Every project has a `netlify.toml` deploy config
- Projects: `perf-mgmt/`, `total-rewards-hub/`, `unified-hr-platform/`, `shramik-platform/`, `through-my-lens/`, `photoblog/`, `travel-gallery/`, `succession-planning-tool/`
- Next.js projects use `@netlify/plugin-nextjs` for SSR/API route support
- Netlify Functions (serverless) used in `perf-mgmt/` at `perf-mgmt/netlify/functions/`
- API routing: `perf-mgmt/netlify.toml` redirects `/api/*` → `/.netlify/functions/:splat`

---

## APIs & External Services

### Anthropic Claude API (Stubbed — Not Active)

**Project:** `perf-mgmt/`
- File: `perf-mgmt/netlify/functions/ai-coach.ts`
- Purpose: LLM-powered coaching script generation for manager conversations
- Endpoint: `https://api.anthropic.com/v1/messages`
- Model: `claude-opus-4-6`
- Auth: `process.env.ANTHROPIC_API_KEY`
- Status: **Code is commented out** — function uses rule-based fallback in current state. LLM block is preserved in comments with a note: "In production: replace with generateWithLLM(req)"
- Activation: Uncomment the `generateWithLLM` function and swap the handler call

### Connector API Stubs (Simulated — Not Active)

**Project:** `perf-mgmt/`
- File: `perf-mgmt/netlify/functions/connectors.ts`
- Purpose: Placeholder for ERP/CRM integrations (CRM, SCM, MES, Finance, HRMS)
- Status: Returns hardcoded mock data. Comment explicitly states: "swap in your real ERP/CRM API calls here"
- Intended integrations: CRM, Supply Chain Management (SCM), Manufacturing Execution Systems (MES), Finance, HRMS

---

## Content Management

### Decap CMS (Git Gateway)

**Project:** `photoblog/`
- File: `photoblog/admin/config.yml`
- Admin UI: `photoblog/admin/index.html` (loads `https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js`)
- Backend: `git-gateway` (Netlify Identity + GitHub)
- Branch: `main`
- Media folder: `images/uploads/`
- Content file: `photos.json`
- Requires: Netlify Identity service enabled in Netlify dashboard

**Project:** `through-my-lens/`
- File: `through-my-lens/admin/config.yml`
- Admin UI: `through-my-lens/admin/index.html`
- Backend: `git-gateway` (Netlify Identity + GitHub)
- Local backend: enabled (`local_backend: true`)
- Media folder: `src/images/uploads/`
- Content: Markdown files in `src/photos/` directory
- Site settings: `src/_data/site.json`

---

## Authentication & Identity

### Custom JWT Authentication

**Projects:** `total-rewards-hub/`, `unified-hr-platform/`
- Library: `jose` ^5.6.3
- Implementation: `total-rewards-hub/src/lib/auth.ts`
- Mechanism: JWT signed with `JWT_SECRET` env var, stored in HTTP-only cookies
- Cookie set on: `POST /api/auth/login`
- Cookie cleared on: `POST /api/auth/logout`
- Verification: Next.js middleware (`total-rewards-hub/middleware.ts`)
- Env var: `JWT_SECRET` — set via Netlify environment variables (not committed)
- Fallback dev secret hardcoded in source for local development only

**Note:** No third-party auth provider (no Auth0, Clerk, Supabase Auth, etc.). Authentication is entirely custom.

### Netlify Identity (CMS Only)

**Projects:** `photoblog/`, `through-my-lens/`
- Used exclusively for Decap CMS git-gateway backend
- Not used for application-level user auth

---

## Data Storage

**Databases:**
- None detected — no database driver, ORM, or DB connection string found in any project
- All application data is in-memory mock data (TypeScript/JS objects and arrays)

**Seed data locations:**
- `total-rewards-hub/src/data/seed/` — employees, compensation, benchmarks
- `unified-hr-platform/src/data/seed/` — same pattern
- `perf-mgmt/src/data/` — mock connector and performance data
- `shramik-platform/src/data/mockData.ts` — worker/contractor mock data
- `succession-planning-tool/js/data.js` — succession planning mock dataset

**File Storage:**
- Static files only — images served from project directories (`photos/`, `images/`)
- No cloud storage (no S3, Cloudinary, or similar) configured in any project

**Caching:**
- Browser `localStorage` used for:
  - Theme preference: `trh_theme` key (`total-rewards-hub/`)
  - Tour completion tracking: per-userId key (`total-rewards-hub/`)
- HTTP cache headers configured in `netlify.toml` for static assets (images, CSS, JS)

---

## Monitoring & Observability

**Error Tracking:** None detected (no Sentry, Datadog, LogRocket, etc.)

**Analytics:** None detected (no GA, Plausible, Fathom, etc.)

**Logs:** `console.log` / `console.error` only — no structured logging

---

## CI/CD & Deployment

**Hosting:** Netlify (all projects)

**CI Pipeline:** None detected — no GitHub Actions, CircleCI, or similar config files found

**Deployment trigger:** Netlify Git integration (inferred from git-gateway CMS config and standard Netlify workflow)

---

## Webhooks & Callbacks

**Incoming:** None detected

**Outgoing:** None detected

---

## Environment Configuration

**Required environment variables by project:**

`total-rewards-hub/` and `unified-hr-platform/`:
- `JWT_SECRET` — JWT signing secret (min 32 chars). Set via Netlify Site Settings → Environment Variables. `.env.local` file present locally.

`perf-mgmt/` (production upgrade):
- `ANTHROPIC_API_KEY` — Required only when enabling LLM mode in `netlify/functions/ai-coach.ts`

**Secrets location:**
- Netlify dashboard environment variables for production
- `.env.local` files for local development (not committed to git)
- `netlify.toml` comment in `total-rewards-hub/` explicitly warns: "Do NOT commit the real secret"

---

## External CDN / Script Dependencies

**Decap CMS (photoblog):**
- `https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js` — loaded at runtime via CDN in `photoblog/admin/index.html`

**All other projects:** No runtime CDN dependencies — all JS bundled at build time

---

*Integration audit: 2026-03-17*
