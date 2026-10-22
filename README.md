# TownSync — Smart & Inclusive Township Management System

TownSync is a single-page React application that unifies four township services into one
connected platform:

| Module | Purpose |
| --- | --- |
| **AccessAble** | Accessibility-aware pedestrian routing across the township walkway network, plus community reporting of accessibility obstacles. |
| **FixMyTown** | Community issue reporting with photo evidence, automatic priority scoring, duplicate detection and an end-to-end maintenance workflow. |
| **SafeSpot** | Neighbourhood hazard mapping, risk scoring, lighting status and safety advisories. |
| **RecycleMate** | Recycling station directory, submission verification, Green Reward points, achievements and a community leaderboard. |

The four modules read and write the same records. A single report can become a maintenance
task, spawn an accessibility obstacle and a safety hazard, trigger notifications, and — once
the work is verified — release recycling points.

> **Demonstration build.** `Bandar Seri Damai` is a simulated township. Accessibility scores,
> safety risk values, environmental impact figures and route weights are prototype estimates,
> not real-world measurements. Map tiles are © OpenStreetMap contributors.

---

## Table of contents

- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [Scripts](#scripts)
- [Application structure](#application-structure)
- [Architecture](#architecture)
- [Data backends](#data-backends)
- [Cross-module workflows](#cross-module-workflows)
- [Environment variables](#environment-variables)
- [Firebase setup](#firebase-setup)
- [Deployment](#deployment)
- [Quality gates](#quality-gates)
- [Further documentation](#further-documentation)

---

## Quick start

```bash
# 1. install dependencies
npm install

# 2. (optional) configure a Firebase project
cp .env.example .env.local

# 3. start the dev server
npm run dev
```

Open <http://localhost:5173>.

With no `.env.local` present the application starts in **local demo mode**: the complete
seeded dataset is loaded from `src/data/seed.ts` and every change is persisted to
`localStorage` under the `townsync.demo.v1` key. No credentials are required and nothing
leaves the browser.

---

## Demo accounts

The sign-in page lists one-click demo entry for each role. All demo accounts share the
password `demo1234` when signing in through the email form.

| Role | Email | Lands on | Scope |
| --- | --- | --- | --- |
| Resident | `resident@townsync.demo` | `/app` | Report issues, plan accessible routes, submit recycling, earn points — home is their action hub. |
| Maintenance | `maintenance@townsync.demo` | `/app/tasks` | Work the task queue, upload evidence, close jobs. |
| Operator | `operator@townsync.demo` | `/app/verification` | Verify recycling submissions, manage stations, award points. |
| Admin | `admin@townsync.demo` | `/app/admin` | Full oversight: triage, teams, hazards, users, analytics. |

Use the **role switcher** in the app shell to move between personas without signing out.
The active session is stored under the `townsync.session` key.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server on port 5173 with HMR. |
| `npm run typecheck` | Strict TypeScript project build check (no emit). |
| `npm run lint` | ESLint 9 flat config across `src/` and `tests/`. |
| `npm run build` | Type-checks and produces the production bundle in `dist/`. |
| `npm run preview` | Serves the production build locally. |
| `npm run test:e2e` | Builds nothing — serves `dist/` and runs the browser suites. Run `npm run build` first. |
| `npm run test:e2e:routes` | Route smoke suite on its own (`BASE_URL` selects the server). |
| `npm run test:e2e:workflow` | Cross-module workflow suite on its own. |
| `npm run test:e2e:refactor` | Resident-experience regression suite (home, bottom nav, report form, notifications, privacy, responsive). |

### End-to-end tests

The suites in `tests/e2e/` drive a real headless Chrome instance over the
DevTools Protocol, so the app is exercised exactly as a user would exercise
it. `npm run test:e2e` boots `vite preview` from `dist/`, runs all three suites and
shuts the server down again.

```bash
npm run build          # the suites run against the production bundle
npm run test:e2e
```

Set `BASE_URL` to point the suites at an already running dev server, and
`CHROME_PATH` if Chrome is not installed in a default location:

```bash
BASE_URL=http://localhost:5173 npm run test:e2e:workflow
```

| Suite | Covers |
| --- | --- |
| `tests/e2e/routes.mjs` | Every route of all four roles plus the public pages renders with content and no console errors. |
| `tests/e2e/workflow.mjs` | Report submission → admin triage → maintenance task → resolution (obstacle cleared, resident notified) → resident reopens the resolved report → recycling verification awards points. |
| `tests/e2e/refactor.mjs` | Resident home, the five-destination bottom nav, report form behaviour (suggested title, impact questions, draft recovery), report reopening, one notification feed with town-wide broadcasts, single hazard map, merged route profile, private recycling activity and rewards, logo behaviour, RBAC and mobile overflow. |

---

## Application structure

```
src/
├── components/
│   ├── charts/      Recharts wrappers (ChartTooltip, trend/series charts)
│   ├── common/      Buttons, cards, badges, tables, modals, toasts, tabs, uploads
│   ├── layout/      AppShell, sidebar, topbar, command palette, route guards
│   └── maps/        Leaflet map, layer switcher, marker icons
├── config/          Navigation model, map layer contract, static content
├── contexts/        Auth, theme and township data providers
├── data/            Simulated township geography, route graph and seed dataset
├── pages/
│   ├── public/      Marketing pages, sign-in/register, 404
│   ├── app/         Authenticated resident / maintenance / operator workspace
│   └── admin/       Admin dashboards, triage, analytics and management screens
├── services/
│   ├── analytics/   Aggregations: township stats, trends, risk, leaderboard
│   ├── data/        Repository interface, demo repository, cross-module actions
│   ├── firebase/    Client, environment config, Firestore repository
│   └── routing/     A* engine, mobility profiles, edge profiles
├── styles/          Tailwind layers, design tokens, dark mode, map markers
├── types/           Shared domain model
└── utils/           Formatting, constants, class-name helper
```

### Route map

**Public** — `/`, `/about`, `/features`, `/how-it-works`, `/signin`, `/register`, `*` (404).

**Authenticated** — `/app` (resident home), `/app/overview` (township overview),
`/app/navigation`, `/app/reports` (My reports by default, `?scope=all` for nearby),
`/app/reports/new`, `/app/reports/:reportId`, `/app/safety`, `/app/safety/:hazardId`,
`/app/recycling` (`?tab=activity` for your own submissions and rewards; `/app/activities`
redirects here), `/app/notifications`, `/app/profile`, `/app/settings`,
`/app/tasks` *(maintenance, admin)*, `/app/verification` *(operator, admin)*.

Residents get a five-destination bottom navigation (Home, Navigate, Reports, Safety,
Recycling) on small screens; their profile and settings are reached from the account menu.


**Admin** — `/app/admin`, `/app/admin/issues`, `/app/admin/teams`,
`/app/admin/accessibility`, `/app/admin/safety`, `/app/admin/recycling`, `/app/admin/users`,
`/app/admin/analytics`.

---

## Architecture

```
            ┌──────────────────────────────────────────────┐
            │              React Router (App.tsx)           │
            │  RequireAuth / RequireRole  ·  PublicLayout   │
            └───────────────┬──────────────────────────────┘
                            │
     ┌──────────────────────┼──────────────────────┐
     ▼                      ▼                      ▼
  Page components      useTownshipData()       useAuth()
     │                      │                      │
     │                      ▼                      ▼
     │              TanStack Query            Firebase Auth
     │                      │                or demo session
     │                      ▼
     └──────────────►  Repository interface
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
         DemoRepository          FirebaseRepository
       (localStorage)          (Firestore + Storage)
```

- **Repository pattern** — every page reads and writes through `Repository`
  (`src/services/data/types.ts`). `src/contexts/TownshipDataContext.tsx` owns the queries,
  mutations and cache invalidation so no page talks to a backend directly.
- **Query keys** — `['reports']`, `['tasks']`, `['activities']`, … Mutations invalidate the
  affected collections so every module sees the change immediately.
- **Cross-module actions** — `src/services/data/actions.ts` implements the business rules that
  span modules (resolve a report → clear its obstacle → close its hazard → notify the reporter).
- **Routing engine** — `src/services/routing/engine.ts` implements A\* over the walkway graph.
  Each edge carries static accessibility, safety and smoothness attributes plus live
  community obstacles, and is scored against the selected mobility profile (standard,
  wheelchair, stroller, visually impaired, elderly).
- **Design system** — Tailwind tokens in `tailwind.config.js`; primary `#176B5B`, emerald
  `#10B981`, coral `#FB5A36`, surface `#F8FAFC`, Plus Jakarta Sans. Dark mode is driven by
  a `class` strategy and persisted under `townsync.theme`.

---

## Data backends

The backend is selected automatically at startup:

| Condition | Backend |
| --- | --- |
| Firebase variables present and `VITE_FORCE_DEMO_MODE` is not `true` | Firebase (Auth + Firestore + Storage) |
| Firebase variables missing | Local demo repository (localStorage) |
| `VITE_FORCE_DEMO_MODE=true` | Local demo repository, even if Firebase is configured |

Both backends implement the same `Repository` interface, so every screen behaves identically.
See `docs/architecture.md` for the full data contract.

### Collections

`reports`, `accessibilityFeatures`, `safetyHazards`, `recyclingStations`,
`recyclingActivities`, `rewardTransactions`, `maintenanceTasks`, `notifications`, `users`.

---

## Cross-module workflows

**Report → resolution**

1. A resident submits a report with a map pin, category, description and optional photos.
2. The system scores priority (safety severity, foot traffic, vulnerable users, duplicates)
   and suggests matching duplicate reports.
3. An admin triages it into a maintenance task assigned to a team.
4. The team completes the task, uploads evidence, and closes it.
5. Resolving the report clears the linked accessibility obstacle and safety hazard and
   notifies the reporter.

**Recycling → rewards**

1. A resident submits a recycling activity at a station.
2. An operator verifies the submission, confirming material type and weight.
3. Points are credited, the station totals are updated and the leaderboard is refreshed.
4. Achievements are evaluated against the new totals.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_FORCE_DEMO_MODE` | No | `true` forces the local demo repository. |
| `VITE_FIREBASE_API_KEY` | For Firebase | Firebase Web API key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | For Firebase | Auth domain (`project-id.firebaseapp.com`). |
| `VITE_FIREBASE_PROJECT_ID` | For Firebase | Firebase project id. |
| `VITE_FIREBASE_STORAGE_BUCKET` | For Firebase | Cloud Storage bucket. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | For Firebase | Messaging sender id. |
| `VITE_FIREBASE_APP_ID` | For Firebase | Firebase Web app id. |

Never commit a populated `.env.local`. `.env.example` is the tracked template.

---

## Firebase setup

See [`docs/firebase-setup.md`](docs/firebase-setup.md) for the full walkthrough. In short:

1. Create a Firebase project and add a Web app.
2. Enable **Authentication → Email/Password** and **Firestore**.
3. Copy the web config into `.env.local` using the keys from `.env.example`.
4. Deploy the rules: `firebase deploy --only firestore:rules,storage`.
5. Seed the `users` collection with profile documents that carry a `role` field
   (`resident`, `maintenance`, `operator` or `admin`).

`firestore.rules`, `storage.rules`, `firestore.indexes.json` and `firebase.json` are already
in the repository root.

---

## Deployment

The app is a static SPA. `firebase.json` contains a Hosting configuration with a catch-all
rewrite to `index.html`, immutable caching for hashed assets and `no-cache` for the HTML
entry point.

```bash
npm run build
firebase deploy --only hosting
```

For Netlify, Vercel or any static host: publish `dist/` and rewrite every unknown path to
`/index.html`. Full instructions are in [`docs/deployment.md`](docs/deployment.md).

---

## Quality gates

```bash
npm run typecheck   # strict TypeScript, no emit
npm run lint        # ESLint 9, zero warnings
npm run build       # production bundle
npm run test:e2e    # headless-Chrome route + workflow suites
```

All four currently pass.

---

## Repository layout

```
tests/e2e/          Headless-Chrome route and workflow suites
docs/               Architecture, demo guide, Firebase setup, deployment
```

---

## Further documentation

- [`docs/architecture.md`](docs/architecture.md) — modules, data model, repository contract,
  routing engine, analytics.
- [`docs/demo-guide.md`](docs/demo-guide.md) — a scripted walkthrough of every role for
  presentations and reviews.
- [`docs/firebase-setup.md`](docs/firebase-setup.md) — project creation, seeding and rules.
- [`docs/deployment.md`](docs/deployment.md) — build and ship to Firebase Hosting or any
  static host.
