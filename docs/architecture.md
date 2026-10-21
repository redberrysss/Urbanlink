# TownSync architecture

This document describes how the four township modules are composed into a single
application: the shared domain model, the repository contract, the routing engine,
the analytics layer and the cross-module business rules.

---

## 1. Layering

```
Presentation    pages/            React components, one per screen
                components/       Reusable UI, charts, maps, app shell
State           contexts/         AuthContext, ThemeContext, TownshipDataContext
Domain          services/         routing engine, analytics aggregations, actions
                types/            shared domain model
Infrastructure  services/data/    Repository interface + demo repository
                services/firebase/ Firestore repository + client bootstrap
```

Dependencies only ever point downwards. Pages never import a backend directly; they call
`useTownshipData()` and receive queries, mutations and helpers.

---

## 2. Domain model

All shared types live in `src/types/index.ts`.

| Entity | Purpose | Key relationships |
| --- | --- | --- |
| `User` | A township account with a `role` and Green Reward points. | Owns reports, activities, transactions. |
| `Report` | A FixMyTown community issue. | Optional `obstacleId`, `safetyHazardId`, `maintenanceTaskId`. |
| `AccessibilityObstacle` | An AccessAble walkway defect on a route edge. | `edgeId`, optional `reportId`. |
| `SafetyHazard` | A SafeSpot hazard with type, severity and lighting status. | Optional `reportId`. |
| `RecyclingStation` | A RecycleMate drop-off point with capacity and totals. | Referenced by activities. |
| `RecyclingActivity` | A resident's recycling submission. | `userId`, `stationId`, verification status. |
| `RewardTransaction` | An immutable points ledger entry. | `userId`, optional `activityId`. |
| `MaintenanceTask` | A unit of field work. | `teamId`, optional `reportId`. |
| `AppNotification` | An in-app notification for a user. | `userId`, optional `reportId`/`taskId`. |

Roles are `resident`, `maintenance`, `operator` and `admin`. The role decides which
navigation sections render, which routes are reachable and what the data layer allows.

---

## 3. Repository contract

`src/services/data/types.ts` defines the single interface both backends implement:

- **Reads** — `listReports`, `listObstacles`, `listHazards`, `listStations`,
  `listActivities`, `listTransactions`, `listTasks`, `listNotifications(userId)`,
  `listUsers`.
- **Writes** — `create*` and `update*` for every entity, plus `updateUser`.

### Demo repository

`src/services/data/demoRepository.ts` hydrates itself from `src/data/seed.ts` on first run,
then serialises the entire dataset to `localStorage` under `townsync.demo.v1`. Writes mutate
the in-memory copy and re-serialise. A "reset demo data" action in Settings clears the key
and reloads the seed.

### Firebase repository

`src/services/firebase/firebaseRepository.ts` maps the same interface onto Firestore
collections. Reads use `getDocs`; writes use `setDoc({ merge: true })` and `updateDoc` with
`undefined` values stripped so partial updates never write `null` over real values.

`src/services/firebase/config.ts` decides which backend is active:

```ts
export const useFirebaseBackend = firebaseConfigured && !demoForced;
```

---

## 4. Township data context

`src/contexts/TownshipDataContext.tsx` is the single data entry point for the UI.

- Every list is a TanStack Query keyed by collection name with a 30 second stale time.
- Mutations invalidate the collections they affect, so a maintenance task closing
  immediately refreshes the report, the obstacle, the hazard and the notification list.
- `resetDemoData()` clears the demo storage and resets every query.
- `refreshAll()` invalidates the whole cache.

---

## 5. Cross-module actions

`src/services/data/actions.ts` holds the business rules that span modules:

| Action | Effect |
| --- | --- |
| `submitReport` | Creates a report, computes priority, detects duplicates, raises notifications. |
| `triageReport` | Moves a report to `under_review`, creates the maintenance task, notifies the assigned team. |
| `completeTask` | Marks the task complete and resolves the linked report. |
| `resolveReport` | Resolves the report, clears the linked obstacle and hazard, notifies the reporter. |
| `verifyRecycling` | Verifies an activity, credits points, writes a ledger transaction, updates station totals. |
| `registerActivity` | Accepts a resident submission for operator verification. |
| `flagHazard` / `clearHazard` | Adds or removes a safety hazard with notifications. |

---

## 6. Routing engine

`src/services/routing/engine.ts` implements A\* over the pedestrian graph in
`src/data/township.ts`.

**Graph** — 24 nodes and 36 edges. Each edge stores static `accessibilityScore`,
`safetyScore` and `smoothness` values (0–100).

**Mobility profiles** — standard, wheelchair, stroller, visually impaired and elderly.
Each profile weights accessibility, safety and smoothness differently, and sets a maximum
gradient and a minimum clearance.

**Edge profiles** — `computeEdgeProfile()` merges the static attributes with the live
community obstacles on that edge, producing an `effectiveAccessibility`, `effectiveSafety`,
`effectiveSmoothness`, severity total, condition (`good` / `fair` / `poor` / `blocked`) and
human-readable notes.

**Strategies** — `fastest`, `balanced` and `accessible`. The accessible strategy penalises
segments below the profile's clearance and smoothness thresholds.

**Advisories** — the route planner surfaces obstacles, hazards and blocked segments along the
chosen path so the resident knows what to expect before leaving.

---

## 7. Analytics

`src/services/analytics/aggregations.ts` derives every dashboard number from the same
underlying records, so no figure is hardcoded:

| Function | Output |
| --- | --- |
| `computeTownshipStats` | Active reports, resolution rate, average resolution days, duplicate rate, open tasks, contributions. |
| `monthlyIssueSeries` | Submitted vs resolved per month. |
| `categoryDistribution` | Share of reports per category. |
| `maintenancePerformance` | Per-team completion rate, average turnaround and workload. |
| `recyclingTrend` | Verified kilograms and points per month. |
| `computeNeighbourhoodRisks` | Zone risk score from hazards, open reports and accessibility issues. |
| `buildLeaderboard` | Top recyclers ranked by verified kilograms. |
| `buildActivityFeed` | Merged, timestamped feed across reports, tasks, hazards and recycling. |
| `accessibilityConditionStats` | Share of the walkway network in each condition. |

All accessibility, safety-risk and environmental-impact figures are prototype estimates and
are labelled as such in the interface.

---

## 8. Presentation layer

- **App shell** — collapsible sidebar, role-aware navigation, top bar with search, theme
  toggle and the demo role switcher, plus a command palette (⌘K).
- **Maps** — one Leaflet map component reused by the overview, navigation planner, report
  form, safety map and admin dashboards. Layers are toggled through the `MapLayers` contract
  in `src/config/mapLayers.ts`.
- **Charts** — Recharts with a shared `ChartTooltip` so every chart renders identically in
  light and dark mode.
- **Theming** — Tailwind `class` strategy, persisted under `townsync.theme`. The theme
  toggle switches between light and dark; the system preference is followed only on the
  first visit.
- **Accessibility** — semantic landmarks, labelled form controls, `aria-*` states on tabs and
  disclosures, keyboard-operable cards, visible focus rings and `prefers-reduced-motion`
  handling.

---

## 9. Build configuration

`vite.config.ts` defines the `@` alias to `src/` and splits the vendor bundle into
`react`, `maps`, `charts` and `motion` chunks so the initial download stays small. The
production build is emitted to `dist/`.
