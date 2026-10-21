# TownSync demo guide

A scripted walkthrough of every role. Use it for demos, reviews and screenshots.

## Before you start

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The application starts in local demo mode, so every action you
take is persisted to `localStorage` and survives a refresh.

> Reset at any time: **Settings → Data → Reset demo data**. That clears the
> `townsync.demo.v1` key and restores the seeded dataset.

---

## 1. Public site (no sign-in)

| Page | Route | What to show |
| --- | --- | --- |
| Home | `/` | Hero, the four modules, live preview of the township, CTA to register. |
| About | `/about` | Mission and the simulated-township disclosure. |
| Features | `/features` | Anchored sections for AccessAble, FixMyTown, SafeSpot and RecycleMate. |
| How it works | `/how-it-works` | The report → task → resolution workflow. |
| 404 | `/app/does-not-exist` | Public layout with the "off the map" screen. |

The header collapses into a slide-down menu below `md` and carries a light/dark toggle.

---

## 2. Resident

Sign in with **resident@townsync.demo** (or use the one-click demo button). You land on the
overview.

1. **Overview** — township stat cards, the live map with layer switches, the activity feed
   and the submission/resolution trend chart.
2. **Smart Navigation** → *Smart Navigation*
   - Pick a destination and a mobility profile (standard, wheelchair, stroller, visually
     impaired, elderly).
   - Compare the three strategies (fastest / balanced / accessible).
   - Select a route and read the segment-by-segment breakdown, the advisories and the
     accessible features encountered along the way.
   - Change the profile and watch the accessible route move off the obstructed segment.
3. **Community Reports** → *Community Reports*
   - Filter by status and category, search by reference.
   - Open a report to see its timeline, priority score, duplicate candidates and the linked
     maintenance task.
4. **Raise a report** → *New Report*
   - Drop a pin on the map, pick a category, add a description and upload a photo.
   - Watch the live priority preview and the duplicate warnings.
   - Submit and confirm the reference number.
5. **Safety Map** → *Safety Map*
   - Toggle hazard types, open a hazard for severity, lighting status and advisory.
   - Switch to the zone risk panel to see neighbourhood risk scores.
6. **Recycling Hub** → *Recycling Hub*
   - Find a station by material or search, check capacity and accepted materials.
   - Log a submission (material + weight) and see it appear as *pending verification*.
7. **My Activities** → *My Activities*
   - Switch between *Activities*, *Rewards* and *Achievements*.
   - Watch the leaderboard and the points ledger.
8. **Notifications, Profile and Settings**
   - Read and mark notifications as read.
   - Edit the profile, switch theme, change the map default layer, reset demo data.

---

## 3. Maintenance

Sign in with **maintenance@townsync.demo**. You land on the task queue.

1. **Task queue** → *Maintenance Tasks*
   - Filter by status and team; open a task to read the linked report and the access notes.
   - Move a task to *In Progress*, then to *Completed* with a resolution note.
   - Upload evidence photos before completing.
2. **Verify the cross-module effect**
   - Open the linked report: its status has moved to *Resolved*.
   - The linked accessibility obstacle and safety hazard have been cleared.
   - The resident has a new notification.
3. **Map view** — the completed segment is no longer flagged on the shared map.

---

## 4. Recycling operator

Sign in with **operator@townsync.demo**. You land on the verification queue.

1. **Verification queue** → *Verification Queue*
   - Review a pending submission, confirm the material type and weight.
   - Approve or reject with a reason.
2. **Check the effect**
   - The resident's points and the reward ledger are updated.
   - The station totals increase.
   - The leaderboard in the Recycling Hub reorders.
   - Achievements are re-evaluated.
3. **Recycling Hub** → station directory — check the updated station capacity figures.

---

## 5. Admin

Sign in with **admin@townsync.demo**. You land on the management dashboard.

1. **Management Dashboard** — backlog triage list, submission vs resolution trend, team
   workload, zone risk, module shortcuts.
2. **Issue Management** — triage a report into a maintenance task, assign a team, change
   priority and status, and link or unlink hazards and obstacles.
3. **Maintenance Teams** — team roster, workload split and completion rates.
4. **Accessibility Analytics** — walkway condition distribution, obstacle categories,
   severity, the worst segments and the affected zones.
5. **Safety Monitoring** — hazard register, lighting status, resolution performance and
   neighbourhood risk breakdown.
6. **Recycling Management** — station utilisation, pending submissions, verification
   throughput and monthly tonnage.
7. **Users** — registered users, roles, blocks, contribution counts and points circulation.
   Filter by role or search by name, email or block.
8. **Reports & Analytics** — submission trend, category split, resolution rate per category,
   time-to-resolution distribution, priority mix and status overview. Use the category filter
   to scope every chart on the page.

---

## 6. Role switching

The top bar has a role switcher (only visible in demo mode). Switching roles swaps the
navigation, the landing page and the available actions instantly — no sign-out required.
Use it to show the same record travelling through the workflow.

---

## 7. Verifying the build

The scripted walkthrough above is automated, so a presenter can confirm the demo still works
before a session:

```bash
npm run build
npm run test:e2e
```

This serves the production bundle and drives headless Chrome through two suites: every route
of all four roles, and the full report → triage → task → resolution → points chain. A green
run means the demo path in this guide is intact.

---

## 8. Presentation tips

- Toggle **dark mode** in the header for the more striking screenshots.
- The map is the strongest visual: open the overview at the "Reports" layer, then drill into
  the navigation planner to show the accessible route highlighting a blocked segment.
- Always mention that the township data is simulated and the impact figures are estimates.
