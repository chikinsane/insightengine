# Codebase Structure

**Analysis Date:** 2026-03-17

## Workspace Layout

```
Claude Code/                         # Workspace root (not a single project)
├── perf-mgmt/                       # Performance management SPA (React + Vite)
├── shramik-platform/                # Blue-collar workforce management SPA (React + Vite)
├── total-rewards-hub/               # Total compensation platform (Next.js 14)
├── unified-hr-platform/             # Unified HR platform — perf + rewards merged (Next.js 14)
├── succession-planning-tool/        # Succession planning tool (Vanilla JS / no build)
├── through-my-lens/                 # Photography blog (Eleventy SSG)
├── photoblog/                       # Photo blog (Vanilla HTML/JS)
├── travel-gallery/                  # Travel gallery (static)
├── echo/                            # Placeholder / empty project
├── .planning/                       # GSD planning documents (this repo)
└── .claude/                         # Claude Code project config
```

---

## Project: perf-mgmt (React + Vite)

```
perf-mgmt/
├── src/
│   ├── main.tsx                     # Entry point: mounts React root, wraps in AppProvider
│   ├── App.tsx                      # Router: BrowserRouter + all route definitions
│   ├── index.css                    # Global styles + Tailwind base
│   ├── store/
│   │   └── AppContext.tsx           # Global state: useReducer context, all domain actions
│   ├── pages/
│   │   ├── Dashboard/               # index.tsx — main KPI dashboard
│   │   ├── Goals/                   # index.tsx — goal management
│   │   ├── Employees/               # index.tsx + EmployeeProfile.tsx
│   │   ├── Feedback/                # index.tsx — continuous feedback
│   │   ├── Feedback360/             # index.tsx — 360-degree feedback
│   │   ├── AICoach/                 # index.tsx — AI coaching interface
│   │   ├── YearEnd/                 # index.tsx — year-end review
│   │   ├── Promotions/              # index.tsx — promotion cases
│   │   ├── MeritCycle/              # index.tsx — merit & compensation cycle
│   │   ├── Admin/                   # index.tsx — admin settings
│   │   ├── Connectors/              # index.tsx — data source integrations
│   │   ├── Import/                  # index.tsx — bulk data import
│   │   └── Tutorial/                # index.tsx — onboarding guide
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Root shell: Sidebar + TopBar + main content outlet
│   │   │   ├── Sidebar.tsx          # Left nav with role-aware menu items
│   │   │   ├── TopBar.tsx           # Header bar
│   │   │   ├── BottomNav.tsx        # Mobile bottom navigation
│   │   │   ├── GuidedTour.tsx       # Step-by-step onboarding overlay
│   │   │   └── NotificationToast.tsx
│   │   ├── ui/                      # Atomic components
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── CompetencyAlert.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── KPIRow.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── StatCard.tsx
│   │   └── charts/
│   │       └── Chart3D.tsx          # ECharts GL 3D chart wrapper
│   ├── hooks/
│   │   ├── useChartTheme.ts         # ECharts theme (dark/light)
│   │   └── useDarkMode.ts           # Dark mode toggle with localStorage
│   ├── data/                        # All mock/synthetic data
│   │   ├── synthetic.ts             # Master dataset: employees, goals, ratings, etc.
│   │   ├── goalLibrary.ts           # Pre-built goal templates
│   │   ├── connectorData.ts         # Simulated connector KPI values
│   │   └── competencyMap.ts         # Competency framework data
│   ├── types/                       # TypeScript type definitions
│   │   └── index.ts
│   └── utils/
│       ├── index.ts
│       └── csvParser.ts             # CSV import parsing logic
├── netlify/
│   └── functions/                   # Netlify serverless functions (if any)
├── index.html                       # Vite HTML entry
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── netlify.toml
```

---

## Project: shramik-platform (React + Vite)

```
shramik-platform/
├── src/
│   ├── main.tsx                     # Entry point
│   ├── App.tsx                      # Router + ROLE_ACCESS + ROLE_HOME maps + ProtectedRoute
│   ├── App.css / index.css          # Global styles
│   ├── store/
│   │   ├── authStore.ts             # Zustand: current user, selected plant
│   │   └── uiStore.ts               # Zustand: dark mode, notifications, tour, mobile view
│   ├── pages/
│   │   ├── LoginPage.tsx            # Role selector login screen
│   │   ├── CMDDashboard.tsx         # CMD executive control tower
│   │   ├── CHRODashboard.tsx        # CHRO analytics dashboard
│   │   ├── WorkerMaster.tsx         # Worker list / master register
│   │   ├── WorkerProfile.tsx        # Individual worker detail
│   │   ├── AttendanceBoard.tsx      # Attendance tracking
│   │   ├── ContractorMaster.tsx     # Contractor list
│   │   ├── ContractorDetail.tsx     # Individual contractor detail
│   │   ├── PayrollDashboard.tsx     # Payroll management
│   │   ├── ComplianceEngine.tsx     # Labour law compliance
│   │   ├── GrievanceInbox.tsx       # Grievance management
│   │   ├── IncidentLog.tsx          # Safety incident tracking
│   │   ├── AIAgents.tsx             # AI agent operations centre
│   │   └── WorkerSelfServicePage.tsx
│   ├── components/
│   │   └── Layout.tsx               # Single shared shell (header + sidebar + main)
│   ├── data/
│   │   └── mockData.ts              # All synthetic data
│   ├── types/
│   │   └── index.ts                 # Domain types + UserRole enum
│   └── assets/                      # Images (hero.png, logos)
├── public/                          # Vite static assets
├── index.html
├── vite.config.ts
├── tsconfig.app.json / tsconfig.json
├── package.json
└── netlify.toml
```

---

## Project: total-rewards-hub (Next.js 14 App Router)

```
total-rewards-hub/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout: reads session, wraps in <Providers>
│   │   ├── page.tsx                 # Root redirect: / → role default route
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   └── login/page.tsx       # Login page (public route)
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # Dashboard shell: Header + Sidebar + PerfProvider
│   │   │   ├── employee/            # Employee role pages
│   │   │   │   ├── page.tsx         # Employee dashboard
│   │   │   │   ├── history/page.tsx
│   │   │   │   ├── documents/page.tsx
│   │   │   │   ├── query/page.tsx
│   │   │   │   └── investments/page.tsx
│   │   │   ├── manager/             # Manager role pages
│   │   │   │   ├── page.tsx
│   │   │   │   ├── budget/page.tsx
│   │   │   │   ├── approvals/page.tsx
│   │   │   │   └── insights/page.tsx
│   │   │   ├── chro/                # CHRO role pages
│   │   │   │   ├── page.tsx
│   │   │   │   ├── pay-equity/page.tsx
│   │   │   │   ├── benchmarking/page.tsx
│   │   │   │   └── simulations/page.tsx + SimulationsClient.tsx
│   │   │   └── admin/               # Admin role pages
│   │   │       ├── page.tsx
│   │   │       ├── config/page.tsx + ConfigClient.tsx
│   │   │       └── imports/page.tsx + ImportsClient.tsx
│   │   └── api/
│   │       ├── auth/login/route.ts
│   │       ├── auth/logout/route.ts
│   │       ├── auth/me/route.ts
│   │       ├── employees/[id]/route.ts
│   │       ├── manager/team/route.ts
│   │       ├── manager/budget/route.ts
│   │       ├── chro/overview/route.ts
│   │       ├── benchmarks/route.ts
│   │       ├── admin/seed/route.ts
│   │       └── admin/validate/route.ts
│   ├── components/
│   │   ├── ui/                      # Atomic: Card, Button, Badge, ProgressBar, MetricTile
│   │   ├── layout/                  # Header.tsx, Sidebar.tsx
│   │   ├── providers/
│   │   │   └── Providers.tsx        # ThemeContext + AuthContext combined wrapper
│   │   ├── charts/                  # CompGrowthChart, BenchmarkChart, PayMixChart, OrgSpendChart
│   │   ├── manager/                 # BudgetPlanner.tsx, ManagerTeamDashboard.tsx
│   │   ├── employee/                # EmployeeDashboard.tsx, InvestmentDeclarations.tsx
│   │   ├── chro/                    # OrgOverviewDashboard.tsx
│   │   └── tour/                    # TourGuide.tsx
│   ├── lib/
│   │   ├── auth.ts                  # JWT sign/verify, getSession, cookie helpers, DEMO_USERS
│   │   ├── store.ts                 # In-memory AppStore singleton, query helpers
│   │   ├── utils.ts                 # cn() (clsx), ensureSeeded()
│   │   └── formatters.ts            # INR currency, date, percentage formatters
│   ├── domain/
│   │   └── types/index.ts           # All domain types (Employee, Compensation, Budget, etc.)
│   └── data/
│       └── seed/
│           ├── index.ts             # Exports buildSeedPayload()
│           ├── employees.ts         # 50 synthetic Indian employees
│           ├── compensation.ts      # Compensation records
│           └── benchmarks.ts        # Market benchmark data
├── middleware.ts                    # Auth enforcement + role routing
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── netlify.toml
```

---

## Project: unified-hr-platform (Next.js 14 App Router)

Extends `total-rewards-hub` structure with an additional `perf/` section in the dashboard and a `perf` component/lib namespace:

```
unified-hr-platform/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── perf/                # Performance module routes (added over total-rewards-hub)
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── goals/page.tsx
│   │   │   │   ├── employees/page.tsx + [id]/page.tsx
│   │   │   │   ├── feedback/page.tsx
│   │   │   │   ├── feedback-360/page.tsx
│   │   │   │   ├── year-end/page.tsx
│   │   │   │   ├── promotions/page.tsx
│   │   │   │   ├── merit-cycle/page.tsx
│   │   │   │   ├── ai-coach/page.tsx
│   │   │   │   ├── import/page.tsx
│   │   │   │   ├── connectors/page.tsx
│   │   │   │   └── admin-settings/page.tsx
│   │   │   └── ... (same as total-rewards-hub for other sections)
│   ├── components/
│   │   └── perf/
│   │       └── ui/                  # Perf-specific UI components
│   │           ├── Card.tsx, Badge.tsx, Button.tsx, ProgressBar.tsx
│   │           ├── StatCard.tsx, KPIRow.tsx, Modal.tsx
│   │           ├── EmptyState.tsx, CompetencyAlert.tsx
│   ├── lib/
│   │   └── perf/
│   │       ├── AppContext.tsx        # React Context + useReducer for perf state
│   │       ├── types.ts             # Perf-specific domain types
│   │       └── data/
│   │           ├── synthetic.ts     # Perf synthetic data
│   │           ├── goalLibrary.ts
│   │           ├── connectorData.ts
│   │           └── competencyMap.ts
│   ├── hooks/
│   │   ├── usePerfChartTheme.ts
│   │   └── usePerfDarkMode.ts
│   └── utils/
│       └── csvParser.ts             # CSV import parser
```

---

## Project: succession-planning-tool (Vanilla JS)

```
succession-planning-tool/
├── index.html                       # Single page entry; all UI rendered via JS
├── js/
│   ├── app.js                       # App init, routing, tab management
│   ├── data.js                      # All mock data (500 employees, assessments, etc.)
│   ├── dashboard.js                 # Dashboard view rendering
│   ├── ninebox.js                   # 9-box talent grid
│   ├── pipeline.js                  # Succession pipeline view
│   ├── performance.js               # Performance tracking view
│   ├── assessments.js               # Readiness assessments
│   ├── analytics.js                 # Analytics charts
│   ├── manufacturing.js             # Manufacturing-specific views
│   ├── development.js               # Development plans
│   ├── manager-view.js              # Manager persona view
│   ├── employee-view.js             # Employee persona view
│   └── admin.js                     # Admin controls
├── css/
│   └── styles.css
├── assets/                          # Icons/images
├── sw.js                            # Service worker (PWA)
├── manifest.json                    # PWA manifest
├── generate_data.py                 # Python script to generate TalentForge_TestData.xlsx
├── generate_test_data.py
├── generate_docx.js                 # Generates Word document feature overview
├── netlify.toml
└── package.json
```

---

## Project: through-my-lens (Eleventy SSG)

```
through-my-lens/
├── src/                             # Eleventy input directory
│   ├── photos/                      # One .md file per photo (content + EXIF frontmatter)
│   ├── images/                      # Photo image files (copied to _site/images/)
│   └── [templates/layouts in .njk]
├── _site/                           # Generated output (gitignored)
│   ├── photos/                      # Static photo detail pages
│   ├── category/                    # Category listing pages
│   ├── gallery/, about/
│   └── images/full/, images/thumb/, images/og/
├── admin/                           # Netlify CMS admin panel
├── raw-photos/                      # Source files before processing
├── scripts/                         # Build/processing scripts
├── .eleventy.js                     # Eleventy config: collections, filters, dir config
├── package.json
└── netlify.toml
```

---

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `EmployeeProfile.tsx`, `BudgetPlanner.tsx`)
- Non-component TS files: `camelCase.ts` (e.g., `authStore.ts`, `csvParser.ts`, `mockData.ts`)
- Next.js special files: lowercase as required (`layout.tsx`, `page.tsx`, `route.ts`)
- Client components with co-located server page: `{Feature}Client.tsx` alongside `page.tsx`

**Directories:**
- Pages in Vite SPAs: `PascalCase/` matching the component name (e.g., `Employees/`, `MeritCycle/`)
- Pages in Next.js: lowercase kebab-case matching URL path (e.g., `pay-equity/`, `ai-coach/`)
- Next.js route groups: wrapped in parentheses `(auth)`, `(dashboard)`
- Shared component categories: `ui/`, `layout/`, `charts/`, `providers/`
- Domain-scoped component subdirs: `manager/`, `employee/`, `chro/`, `perf/`

**Exports:**
- Default exports for components and pages
- Named exports for hooks, context, store, utilities
- Barrel files (`index.ts`) used in `src/data/seed/` to aggregate exports

---

## Key File Locations

**Entry Points:**
- Vite SPA: `src/main.tsx` in each Vite project
- Next.js: `src/app/layout.tsx` (root layout), `middleware.ts` (request gateway)
- Vanilla: `index.html` in `succession-planning-tool/`

**Global State:**
- perf-mgmt: `perf-mgmt/src/store/AppContext.tsx`
- shramik-platform: `shramik-platform/src/store/authStore.ts`, `shramik-platform/src/store/uiStore.ts`
- Next.js perf module: `unified-hr-platform/src/lib/perf/AppContext.tsx`
- Next.js client auth/theme: `total-rewards-hub/src/components/providers/Providers.tsx`

**Auth Logic:**
- Next.js: `total-rewards-hub/src/lib/auth.ts`, `unified-hr-platform/src/lib/auth.ts`
- Next.js middleware: `total-rewards-hub/middleware.ts`, `unified-hr-platform/middleware.ts`

**Domain Types:**
- Next.js: `src/domain/types/index.ts`
- perf module: `src/lib/perf/types.ts` (unified), `src/types/index.ts` (perf-mgmt standalone)
- shramik-platform: `src/types/index.ts`

**Data / Seed:**
- Next.js: `src/data/seed/` (employees, compensation, benchmarks)
- Vite SPAs: `src/data/synthetic.ts` or `src/data/mockData.ts`
- In-memory store (Next.js): `src/lib/store.ts`

**Routing:**
- Vite SPAs: `src/App.tsx` contains all `<Route>` definitions
- Next.js: file-system routing under `src/app/`

---

## Where to Add New Code

**New feature page (Vite SPA — perf-mgmt or shramik-platform):**
- Create `src/pages/{FeatureName}/index.tsx`
- Add `<Route path="/feature-name" element={<FeatureName />} />` in `src/App.tsx`
- If the page needs mock data, add to `src/data/synthetic.ts` or `src/data/mockData.ts`
- If new global state is needed, add action types and reducer case to `src/store/AppContext.tsx`

**New feature page (Next.js — total-rewards-hub or unified-hr-platform):**
- Create `src/app/(dashboard)/{role}/{feature}/page.tsx`
- If it needs client interactivity, co-locate a `{Feature}Client.tsx` alongside `page.tsx`
- Add API route at `src/app/api/{resource}/route.ts`
- Add domain types to `src/domain/types/index.ts`
- Add store query helpers to `src/lib/store.ts`

**New UI component:**
- Atomic/reusable: `src/components/ui/{ComponentName}.tsx`
- Layout-related: `src/components/layout/{ComponentName}.tsx`
- Domain-scoped (e.g., manager-only): `src/components/manager/{ComponentName}.tsx`
- Chart wrapper: `src/components/charts/{ChartName}.tsx`

**New Eleventy page (through-my-lens):**
- Content (photo): add `.md` file in `src/photos/` with EXIF frontmatter
- Template: add `.njk` file in `src/`
- Run `npm run build` to regenerate `_site/`

**New utility function:**
- Shared helpers (Next.js): `src/lib/utils.ts`
- Formatters: `src/lib/formatters.ts`
- CSV parsing: `src/utils/csvParser.ts` (unified-hr-platform)

---

## Special Directories

**`.planning/`:**
- Purpose: GSD planning documents (architecture, conventions, concerns)
- Generated: No
- Committed: Yes

**`dist/`** (perf-mgmt, shramik-platform):
- Purpose: Vite production build output
- Generated: Yes (`npm run build`)
- Committed: No (in `.gitignore`)

**`.next/`** (total-rewards-hub, unified-hr-platform):
- Purpose: Next.js build cache and server output
- Generated: Yes
- Committed: No

**`_site/`** (through-my-lens):
- Purpose: Eleventy generated static site
- Generated: Yes (`npm run build`)
- Committed: No

**`node_modules/`** (all projects):
- Purpose: npm dependencies
- Generated: Yes
- Committed: No

**`netlify/functions/`** (perf-mgmt):
- Purpose: Netlify serverless functions
- Generated: No
- Committed: Yes

**`raw-photos/`** (through-my-lens):
- Purpose: Source photo files before optimization/upload
- Generated: No
- Committed: Yes (part of content workflow)

---

*Structure analysis: 2026-03-17*
