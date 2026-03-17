# Technology Stack

**Analysis Date:** 2026-03-17

## Overview

This workspace contains **8 distinct projects**, not a single monorepo. Each is an independent application sharing common technology patterns.

| Project | Type | Framework |
|---|---|---|
| `perf-mgmt/` | React SPA + Netlify Functions | Vite + React 18 |
| `total-rewards-hub/` | Next.js App Router | Next.js 14 |
| `unified-hr-platform/` | Next.js App Router | Next.js 14 |
| `shramik-platform/` | React SPA | Vite + React 19 |
| `through-my-lens/` | Static site | Eleventy (11ty) |
| `photoblog/` | Static site | Vanilla HTML/CSS/JS |
| `travel-gallery/` | Static site | Vanilla HTML/CSS/JS |
| `succession-planning-tool/` | PWA | Vanilla JS + Python scripts |

---

## Languages

**Primary:**
- TypeScript ~5.5–5.9 — All Node/React projects (`perf-mgmt/`, `total-rewards-hub/`, `unified-hr-platform/`, `shramik-platform/`)
- JavaScript (ES2020+) — Static projects (`photoblog/`, `travel-gallery/`, `succession-planning-tool/js/`)
- Python 3.9 — Data generation scripts (`succession-planning-tool/generate_data.py`, `generate_test_data.py`)

**Secondary:**
- Nunjucks (`.njk`) — Templates in `through-my-lens/src/`
- YAML — CMS config files (`photoblog/admin/config.yml`, `through-my-lens/admin/config.yml`)
- CSS — Stylesheets in static projects

## Runtime

**Environment:**
- Node.js 20.20.1 (active)
- npm 10.8.2
- Lockfile format: v3 (`package-lock.json` present in all Node projects)

**Python:**
- Python 3.9.6 (used only for data generation scripts in `succession-planning-tool/`)
- Python packages: `streamlit`, `pandas`, `plotly`, `openpyxl` — see `succession-planning-tool/requirements.txt`

**Build Node version (Netlify):**
- `total-rewards-hub/`, `unified-hr-platform/`, `through-my-lens/` explicitly pin `NODE_VERSION = "20"` in `netlify.toml`

---

## Frameworks

### React SPA (Vite) Projects

**Core:**
- React 18.3.1 — `perf-mgmt/`
- React 19.2.4 — `shramik-platform/` (latest)
- Vite 5.4.8 — `perf-mgmt/` build tool
- Vite 8.0.0 — `shramik-platform/` build tool
- TypeScript compiled via `tsc && vite build`

**Routing:**
- react-router-dom ^6.26.1 — `perf-mgmt/`
- react-router-dom ^7.13.1 — `shramik-platform/`

### Next.js Projects

**Core:**
- Next.js 14.2.5 — `total-rewards-hub/`, `unified-hr-platform/`
- React 18.3.1 — both Next.js projects
- App Router pattern (`src/app/` directory structure)
- TypeScript strict mode

### Static Site Generator

**Core:**
- Eleventy (@11ty/eleventy) ^3.1.2 — `through-my-lens/`
- Templates: Nunjucks (`.njk`)
- Build output: `_site/`

### Vanilla Projects

**PWA:**
- `succession-planning-tool/` — ServiceWorker (`sw.js`), `manifest.json`, no bundler
- `photoblog/` — Raw HTML/CSS/JS, Decap CMS admin panel
- `travel-gallery/` — Raw HTML/CSS/JS with lightbox UI

---

## Key Dependencies

### UI & Styling

- **TailwindCSS** ^3.4.x — `perf-mgmt/`, `total-rewards-hub/`, `unified-hr-platform/`
- **TailwindCSS** ^4.2.1 — `shramik-platform/` (v4, Vite plugin variant via `@tailwindcss/vite`)
- **Headless UI** ^2.x — `total-rewards-hub/`, `unified-hr-platform/`, `shramik-platform/`
- **Lucide React** — icon library across all React projects
- **Heroicons** ^2.2.0 — `shramik-platform/` only
- **clsx** / **tailwind-merge** — utility class merging

### Charts & Visualization

- **Recharts** ^2.x (React 18 projects), ^3.8.0 (`shramik-platform/`) — chart library
- **ECharts** ^5.6.0 + `echarts-for-react` + `echarts-gl` — `perf-mgmt/` (3D charts)
- **ECharts** ^6.0.0 + `echarts-for-react` — `total-rewards-hub/`, `unified-hr-platform/`

### State Management

- **Zustand** ^4.5.4 — `total-rewards-hub/`, `unified-hr-platform/`
- **Zustand** ^5.0.12 — `shramik-platform/`
- **TanStack Query** ^5.90.21 — `shramik-platform/` (server-state fetching)
- React Context/useReducer — `perf-mgmt/` (no external state library)

### Data & Forms

- **date-fns** ^3.x / ^4.x — date utilities across React projects
- **Zod** ^3.23.8 — schema validation (`total-rewards-hub/`, `unified-hr-platform/`)
- **react-hook-form** ^7.71.2 — form management (`shramik-platform/`)
- **TanStack Table** ^8.21.3 — data tables (`shramik-platform/`)
- **axios** ^1.13.6 — HTTP client (`shramik-platform/`)

### Auth & Security

- **jose** ^5.6.3 — JWT sign/verify (`total-rewards-hub/`, `unified-hr-platform/`)
- Auth implemented via custom cookie-based JWT (no third-party auth provider)

### Image Processing (Build-time)

- **sharp** ^0.34.5 — image resizing/optimization scripts (`through-my-lens/`)
- **exifr** ^7.1.3 — EXIF metadata extraction from photos (`through-my-lens/`)

### Serverless Functions

- **@netlify/functions** — TypeScript handler type definitions (`perf-mgmt/netlify/functions/`)
- esbuild — bundler for Netlify functions (specified in `perf-mgmt/netlify.toml`)

### Document Generation

- **docx** ^9.6.1 — Word document generation (`succession-planning-tool/generate_docx.js`)

### Notifications & UI Utilities

- **react-hot-toast** ^2.6.0 — toast notifications (`shramik-platform/`)
- **@headlessui/react** — accessible dialog/dropdown components

---

## Configuration

### Build Tools

| Project | Build Config |
|---|---|
| `perf-mgmt/` | `vite.config.ts`, `tailwind.config.js`, `postcss.config.js` |
| `shramik-platform/` | `vite.config.ts`, `eslint.config.js` (ESLint 9 flat config) |
| `total-rewards-hub/` | `next.config.js`, `tailwind.config.ts`, `postcss.config.js` |
| `unified-hr-platform/` | `next.config.js`, `tailwind.config.ts`, `postcss.config.js` |
| `through-my-lens/` | No config file (Eleventy defaults) |

### TypeScript

- All TypeScript projects have `tsconfig.json`
- `perf-mgmt/` and `shramik-platform/` use `"type": "module"` ESM
- Next.js projects use CommonJS config files (`next.config.js` with `module.exports`)

### Environment Variables

- `.env.local` present in `total-rewards-hub/` and `unified-hr-platform/`
- Critical variable: `JWT_SECRET` — required for auth token signing (see `total-rewards-hub/netlify.toml` comment)
- Anthropic API key (`ANTHROPIC_API_KEY`) stubbed in `perf-mgmt/netlify/functions/ai-coach.ts` for production LLM mode

### Linting

- **ESLint** 8.x — `total-rewards-hub/`, `unified-hr-platform/` (via `eslint-config-next`)
- **ESLint** 9.x flat config — `shramik-platform/` (`eslint.config.js` with `typescript-eslint`)
- `perf-mgmt/` — no ESLint config detected

---

## Platform Requirements

**Development:**
- Node.js 20+
- npm 10+
- Python 3.9+ (only for `succession-planning-tool/` data scripts)

**Production:**
- All projects deploy to **Netlify** (all have `netlify.toml`)
- Next.js projects use `@netlify/plugin-nextjs` adapter
- Vite SPA projects publish `dist/` with SPA redirect (`/* → /index.html`)
- Eleventy builds to `_site/`
- Static projects publish root directory (`.`)
- `succession-planning-tool/` is a PWA with ServiceWorker — static hosting only

---

*Stack analysis: 2026-03-17*
