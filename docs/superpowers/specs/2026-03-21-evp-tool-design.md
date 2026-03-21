# EVP Control Tower — Design Spec
**Date:** 2026-03-21
**Demo Organisation:** Aster QCIL, India, Healthcare
**Status:** Approved

---

## 1. Overview

A full-stack demo EVP (Employee Value Proposition) tool that aggregates internal survey data and external employer brand signals into an interactive HR control tower. The tool enables HR professionals to understand how their employer brand is perceived, identify strengths and gaps across 10 EVP pillars, and export boardroom-ready PDF/PPTX reports with expert commentary.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| Charts | Recharts + ECharts (echarts-for-react) |
| Icons | Lucide React |
| PDF Export | jsPDF + html2canvas |
| PPTX Export | pptxgenjs |
| Data | Static TypeScript synthetic data modules |
| Hosting | Netlify (static deploy) |
| Persistence | localStorage (survey responses, theme, view mode) |

---

## 3. Design System

### Colour Palette
- **Primary:** Rose `#e11d48`
- **Primary Light:** `#fff1f5`
- **Primary Muted:** `#fce7e7`
- **Accent Amber:** `#f59e0b`
- **Accent Sky:** `#0ea5e9`
- **Accent Emerald:** `#10b981`
- **Base Background:** Warm white `#fdf6f0`
- **Card Background:** White `#ffffff`
- **Text Primary:** Slate `#1e293b`
- **Text Muted:** `#94a3b8`

### Dark Mode Overrides
- Background: `#0f172a`
- Card: `#1e293b`
- Border: `#334155`

### Typography
- Font: Inter (Google Fonts)
- Headings: 700–800 weight
- Body: 400–500 weight
- Labels: 10px uppercase, letter-spacing 2px

### Card Style
- White background, `rounded-xl`, `shadow-sm`
- Left-border accent: `border-l-4 border-rose-500` (primary cards)
- Hover: subtle lift `hover:shadow-md transition`

---

## 4. Application Routes

| Route | Page | Description |
|---|---|---|
| `/` | Setup / Landing | Org name, country, industry input. Pre-filled: Aster QCIL / India / Healthcare |
| `/dashboard` | Control Tower | Hub & Spoke overview tiles — gateway to all sections |
| `/surveys` | Internal Surveys | Survey builder, response analytics, pillar scores |
| `/listening` | External Listening | Mock platform scores, sentiment, themes, word cloud |
| `/insights` | EVP Insights | Radar chart, pillar deep-dive, positives/negatives, trend |
| `/reports` | Export Reports | Report preview + PDF/PPTX download |
| `/survey/:id` | Employee Survey Form | Shareable lightweight survey form for employees |

---

## 5. Pages — Detailed Design

### 5.1 Setup / Landing (`/`)
- Full-screen hero with Aster QCIL branding
- Form fields: Organisation Name, Country (dropdown), Industry (dropdown)
- Pre-filled with demo values
- CTA: "Enter Control Tower →"
- Saves org context to localStorage, navigates to `/dashboard`

### 5.2 Control Tower (`/dashboard`)
- **Header:** Org name, country flag emoji, industry tag, date range selector (Q1 2026), dark/light toggle, mobile preview toggle
- **Hero KPI row:** 4 stat cards — Employer Brand Score (74/100), eNPS (+34), Survey Responses (287), External Signals (3,279)
- **Hub tiles grid (2×3):**
  - Internal Surveys → `/surveys`
  - External Listening → `/listening`
  - EVP Insights → `/insights`
  - Export Reports → `/reports`
  - Trend Snapshot (inline mini chart, no link)
  - Quick Actions (copy survey link, schedule report)
- **Alert banner:** Top 2 critical gaps highlighted in amber
- **Recent activity feed:** Latest 5 survey responses (anonymised)

### 5.3 Internal Surveys (`/surveys`)
Three sub-tabs: **Overview | Survey Builder | Responses**

**Overview tab:**
- Completion rate gauge (73%)
- Response count by department (horizontal bar chart)
- Response count by location (map placeholder or bar chart)
- eNPS breakdown: Promoters / Passives / Detractors donut chart
- 10-pillar score cards (coloured by RAG status)

**Survey Builder tab:**
- List of active surveys with share link + QR code button
- "New Survey" button → modal with question editor
- Pre-built template: "Aster QCIL EVP Survey Q1 2026"
- Question types: Likert scale, NPS, open text

**Responses tab:**
- Table of anonymised responses (department, role, date, eNPS score)
- Filter by department, location, date range
- Sentiment tag on each open-ended response

### 5.4 External Listening (`/listening`)
- **Platform score cards:** Glassdoor 4.1★, AmbitionBox 3.9★, Naukri 4.0★, Indeed 3.8★, LinkedIn 78%, X/Twitter 72%
- **Sentiment trend chart:** Line chart showing positive/negative/neutral % over 6 months per platform
- **Top themes:** Tag cloud / pill list — "Work-life balance", "Good mission", "Low pay", "Great colleagues", "Growth opportunities", "Burnout", "Strong leadership" etc.
- **Representative reviews:** 3 curated quotes per platform (positive + negative)
- **Composite external score:** Weighted average across platforms = 3.9 / 5.0

### 5.5 EVP Insights (`/insights`)
Four sub-tabs: **Overview | Pillar Deep-Dive | Positives & Negatives | Trend**

**Overview tab:**
- Radar chart: 10-pillar scores (internal vs external overlay)
- Overall composite score: 74/100
- Industry benchmark comparison bar

**Pillar Deep-Dive tab:**
- Pillar selector (dropdown or tab pills)
- Per-pillar: score gauge, internal vs external bar, top verbatim quotes, trend sparkline, expert opinion paragraph

**Positives & Negatives tab:**
- Two columns: ✅ Top 5 strengths | ⚠️ Top 5 gaps
- Each item: pillar name, score, one-line insight, action hint
- "What needs improvement" priority matrix (impact vs effort 2×2)

**Trend tab:**
- Line chart: overall score Q1 2025 → Q1 2026
- Per-pillar trend lines (toggle on/off)
- Annotation markers: "Survey launched", "Policy change" etc.

### 5.6 Export Reports (`/reports`)
- **Report configuration panel:** Date range, include/exclude sections, report type (PDF / PPTX / Both)
- **Live preview pane:** Shows first 3 slides/pages
- **Generate & Download buttons**

**PDF structure (jsPDF + html2canvas):**
1. Cover: Aster QCIL | EVP Brand Report | Q1 2026 | India · Healthcare
2. Executive Summary: score, eNPS, top 3 strengths, 2 critical gaps
3. Methodology: survey sample, external sources, scoring model
4. Pages 4–13: One page per EVP pillar (score gauge + bar + expert opinion + quotes)
5. Positives & Negatives summary table
6. 5 Prioritised Recommendations
7. Appendix: raw pillar scores table

**PPTX structure (pptxgenjs) — ~16 slides:**
- Same content as PDF but slide format
- Rose/white theme, branded footer, charts as embedded images

### 5.7 Employee Survey Form (`/survey/:id`)
- Minimal distraction-free layout
- Aster QCIL logo + "Your voice shapes our culture" tagline
- Progress bar (sections 1–3)
- Section 1: 10 Likert questions (one per pillar, 1–5 star or slider)
- Section 2: eNPS — "How likely are you to recommend Aster QCIL as a place to work?" (0–10 NPS widget)
- Section 3: Two open-ended text areas
- Submit → saves to localStorage → "Thank you" screen
- HR can copy shareable URL from Survey Builder

---

## 6. EVP Framework — 10 Pillars

| # | Pillar | Internal Score | External Score | Status |
|---|---|---|---|---|
| 1 | Compensation & Benefits | 3.4 | 3.3 | ⚠️ Gap |
| 2 | Work-Life Balance | 3.1 | 2.9 | 🔴 Critical |
| 3 | Career Growth & Learning | 4.0 | 3.8 | ✅ Strength |
| 4 | Culture & Values | 4.3 | 4.1 | ✅ Strength |
| 5 | Leadership & Management | 3.7 | 3.5 | 🟡 Mixed |
| 6 | Work Environment | 3.9 | 3.7 | ✅ Strength |
| 7 | Diversity, Equity & Inclusion | 4.1 | 3.9 | ✅ Strength |
| 8 | Employee Wellbeing | 3.2 | 3.0 | 🔴 Critical |
| 9 | Clinical Excellence Culture | 4.5 | 4.3 | ✅ Top Strength |
| 10 | Mission & Patient Purpose | 4.6 | 4.4 | ✅ Top Strength |

---

## 7. Synthetic Data Model

### Internal Survey Data
- **287 responses** across:
  - Departments: Clinical (68), Nursing (82), Pharmacy (31), Admin (44), Operations (37), Management (25)
  - Locations: Bangalore (89), Hyderabad (74), Kochi (61), Delhi NCR (38), Chennai (25)
  - Roles: Doctor, Nurse, Pharmacist, Lab Technician, HR, Finance, Support Staff
  - Time series: Monthly data points Q1 2025 → Q1 2026
- **eNPS:** +34 (Promoters 58%, Passives 18%, Detractors 24%)
- **Open-ended themes:** Pre-tagged synthetic verbatim quotes per pillar

### External Platform Data
| Platform | Score | Volume | Sentiment |
|---|---|---|---|
| Glassdoor | 4.1★ | 312 reviews | 74% positive |
| AmbitionBox | 3.9★ | 478 reviews | 69% positive |
| Naukri | 4.0★ | 203 reviews | 71% positive |
| Indeed | 3.8★ | 156 reviews | 67% positive |
| LinkedIn | — | 1,240 signals | 78% positive |
| X / Twitter | — | 890 mentions | 72% positive |

---

## 8. UX Toggles

| Toggle | Location | Persisted |
|---|---|---|
| Dark / Light mode | Top-right header | localStorage |
| Mobile preview mode | Top-right header | localStorage |

**Mobile preview mode:** Constrains the main content area to 390px width with a device chrome frame, so HR can preview the mobile experience without leaving desktop.

---

## 9. Export Reports — Expert Opinion Copy

Each pillar includes a pre-written 2–3 sentence expert opinion paragraph for use in reports. Example for Mission & Patient Purpose:

> *"Aster QCIL's Mission & Patient Purpose score of 4.6 places it in the top decile of Indian healthcare employers. Employees across clinical and nursing functions consistently cite pride in patient outcomes and the organisation's community health mission as primary drivers of engagement and retention. This represents a powerful and authentic EVP anchor that should be amplified in all employer brand communications."*

---

## 10. Netlify Deployment

- Build command: `npm run build`
- Publish directory: `dist`
- `netlify.toml` with SPA redirect (`/* → /index.html`)
- Environment: no env vars required (all data is static)

---

## 11. Project Directory

```
evp-tool/
├── src/
│   ├── components/        # Shared UI components
│   ├── data/              # Synthetic data modules (TypeScript)
│   ├── pages/             # Route-level page components
│   ├── hooks/             # useTheme, useMobilePreview, useSurvey
│   ├── utils/             # Export helpers (pdf.ts, pptx.ts)
│   ├── types/             # TypeScript interfaces
│   └── App.tsx
├── public/
├── index.html
├── netlify.toml
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## 12. Success Criteria

- [ ] All 7 routes load correctly
- [ ] Dashboard tiles navigate to correct sections
- [ ] 10-pillar scores visible in Insights radar chart
- [ ] External listening platform cards render with mock data
- [ ] PDF export downloads with all sections
- [ ] PPTX export downloads with correct branding
- [ ] Employee survey form submits and saves to localStorage
- [ ] Dark mode toggle works across all pages
- [ ] Mobile preview mode constrains layout to 390px
- [ ] Deploys successfully to Netlify
