import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Accessibility,
  ArrowRight,
  Bell,
  ClipboardList,
  MapPin,
  PlayCircle,
  Recycle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/common/Button';

const MODULES = [
  {
    id: 'accessable',
    name: 'AccessAble',
    tagline: 'Inclusive Township Navigator',
    icon: Accessibility,
    color: '#176B5B',
    description:
      'Pick a start, destination and mobility profile. TownSync ranks three real routes over a pedestrian graph — weighting accessibility, obstacles, shelter and safety.',
    points: ['Three route strategies', 'Live obstacle avoidance', 'Accessibility score per route'],
  },
  {
    id: 'fixmytown',
    name: 'FixMyTown',
    tagline: 'Smart Community Maintenance',
    icon: ClipboardList,
    color: '#FB5A36',
    description:
      'Residents report potholes, broken lights and blocked paths. Management triages with a priority score, duplicate detection and a full status timeline.',
    points: ['Smart prioritisation', 'Duplicate detection', 'Maintenance assignment'],
  },
  {
    id: 'safespot',
    name: 'SafeSpot',
    tagline: 'Neighbourhood Safety Monitoring',
    icon: ShieldCheck,
    color: '#F59E0B',
    description:
      'Safety intelligence derived from the same community reports — no duplicate records — shown as an interactive hazard map with illustrative risk scores.',
    points: ['Shared issue records', 'Zone risk overview', 'Active warnings'],
  },
  {
    id: 'recyclemate',
    name: 'RecycleMate',
    tagline: 'Smart Recycling & Rewards',
    icon: Recycle,
    color: '#047857',
    description:
      'Find stations, check if an item is recyclable, submit your activity and earn Green Reward points verified by a recycling operator.',
    points: ['Station locator', 'Material guide', 'Points & badges'],
  },
];

const FLOW = [
  {
    step: '01',
    title: 'Resident reports a damaged walkway',
    body: 'A photo and a pinned location are submitted through FixMyTown in under a minute.',
    icon: ClipboardList,
    color: '#FB5A36',
  },
  {
    step: '02',
    title: 'The route engine reacts instantly',
    body: 'The report is flagged as an accessibility obstacle, so AccessAble re-ranks every route for wheelchair users.',
    icon: Accessibility,
    color: '#176B5B',
  },
  {
    step: '03',
    title: 'SafeSpot highlights the hazard',
    body: 'Because it carries a safety dimension, the same record appears on the neighbourhood hazard map.',
    icon: ShieldCheck,
    color: '#F59E0B',
  },
  {
    step: '04',
    title: 'A team is assigned and verified',
    body: 'Management assigns a crew, staff upload repair evidence, and the repair is verified before closure.',
    icon: Users,
    color: '#0EA5E9',
  },
  {
    step: '05',
    title: 'The graph updates',
    body: 'On verification the hazard clears, the obstacle is removed and the route graph returns to normal.',
    icon: Zap,
    color: '#047857',
  },
];

const STATS = [
  { label: 'Modules on one platform', value: '4' },
  { label: 'Route strategies per trip', value: '3' },
  { label: 'Roles with dedicated workspaces', value: '4' },
  { label: 'Shared data models', value: '15' },
];

export function HomePage() {
  return (
    <div>
      {/* ------------------------- Hero ------------------------- */}
      <section className="relative overflow-hidden bg-ink-50 dark:bg-ink-950">
        <div className="mesh-hero absolute inset-0" aria-hidden />
        <div className="grid-pattern absolute inset-0 opacity-60" aria-hidden />
        <div
          className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24 lg:px-8">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-primary-700 shadow-sm backdrop-blur dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-200"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Smart township, one connected platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="mt-5 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-5xl lg:text-[56px] dark:text-white"
            >
              Accessible mobility, community maintenance, neighbourhood safety and{' '}
              <span className="gradient-text">sustainable living</span> — unified.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg dark:text-ink-300"
            >
              TownSync links what residents notice with what townships can act on. A single
              community report becomes a route recalculation, a safety warning, a maintenance
              ticket and a verified resolution.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to="/register">
                <Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                  Explore the live demo
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="secondary" icon={<PlayCircle className="h-4 w-4" />}>
                  See how it works
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4"
            >
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-3xl font-extrabold tracking-tight text-primary-600 dark:text-primary-300">
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold leading-snug text-ink-500 dark:text-ink-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <DashboardMock />
          </motion.div>
        </div>
      </section>

      {/* ------------------------- Modules ------------------------- */}
      <section className="border-y border-ink-200 bg-white py-20 dark:border-white/10 dark:bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-300">
              Four modules, one data model
            </p>
            <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl dark:text-white">
              Not four apps. One responsive township platform.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-500 dark:text-ink-400">
              Every module reads and writes the same collections, so information is captured once
              and reused everywhere it matters.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {MODULES.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                >
                  <Link
                    to={`/features#${m.id}`}
                    className="group relative block h-full overflow-hidden rounded-3xl border border-ink-200 bg-ink-50/60 p-7 transition duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ background: `linear-gradient(90deg, ${m.color}, ${m.color}22)` }}
                    />
                    <div className="flex items-start gap-4">
                      <span
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-sm"
                        style={{ backgroundColor: m.color }}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                          {m.name}
                        </h3>
                        <p className="text-sm font-semibold" style={{ color: m.color }}>
                          {m.tagline}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                      {m.description}
                    </p>
                    <ul className="mt-5 space-y-2">
                      {m.points.map((p) => (
                        <li key={p} className="flex items-center gap-2.5 text-sm text-ink-600 dark:text-ink-300">
                          <span
                            className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: m.color }}
                          >
                            ✓
                          </span>
                          {p}
                        </li>
                      ))}
                    </ul>
                    <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-ink-900 transition group-hover:gap-2.5 dark:text-white">
                      Explore {m.name}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------- Integration flow ------------------------- */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral-500">
                The integration layer
              </p>
              <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl dark:text-white">
                One report, five consequences.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-600 dark:text-ink-300">
                This is what separates TownSync from a stack of disconnected tools. When a resident
                reports a damaged walkway, the platform responds across every module — without a
                second record ever being created.
              </p>
              <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                  Prototype data notice
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/80">
                  Accessibility attributes, risk scores and environmental proxies in this build are
                  illustrative simulations for demonstration — not audited field data or verified
                  predictions.
                </p>
              </div>
            </div>

            <ol className="relative space-y-4 before:absolute before:left-[27px] before:top-6 before:h-[calc(100%-3rem)] before:w-px before:bg-gradient-to-b before:from-primary-300 before:via-coral-200 before:to-transparent dark:before:from-primary-700 dark:before:via-coral-900">
              {FLOW.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.li
                    key={f.step}
                    initial={{ opacity: 0, x: 18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="relative flex gap-4"
                  >
                    <span
                      className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-4 border-white text-white shadow-sm dark:border-ink-950"
                      style={{ backgroundColor: f.color }}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="surface flex-1 p-5">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-extrabold"
                          style={{ color: f.color }}
                        >
                          STEP {f.step}
                        </span>
                      </div>
                      <h3 className="mt-1 text-base font-bold text-ink-900 dark:text-white">
                        {f.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                        {f.body}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* ------------------------- Capabilities ------------------------- */}
      <section className="border-y border-ink-200 bg-ink-50 py-20 dark:border-white/10 dark:bg-ink-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-300">
              Built for real operations
            </p>
            <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl dark:text-white">
              Everything a township office needs on day one.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: MapPin, title: 'One interactive map', body: 'Toggle accessibility routes, maintenance issues, safety hazards and recycling stations together.' },
              { icon: TrendingUp, title: 'Decision-ready analytics', body: 'Issue trends, resolution performance, accessibility condition and recycling participation in real charts.' },
              { icon: Bell, title: 'Role-aware notifications', body: 'Residents, crews, operators and managers each receive the alerts that matter to them.' },
              { icon: Users, title: 'Four dedicated workspaces', body: 'Resident, admin, maintenance and operator views with the right controls in each.' },
              { icon: Accessibility, title: 'WCAG 2.2 AA oriented', body: 'Keyboard navigation, focus management, contrast-checked colours and reduced-motion support.' },
              { icon: Sparkles, title: 'Works with no backend', body: 'A fully interactive demo mode with persisted data, so the platform can be shown anywhere.' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="surface card-hover p-6"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-ink-900 dark:text-white">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                    {f.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------- Roles ------------------------- */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-300">
                Built for everyone in the township
              </p>
              <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl dark:text-white">
                One platform, four ways of working.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-600 dark:text-ink-300">
                Each role gets a workspace shaped around the decisions they actually make, and they
                all operate on the same underlying records.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { role: 'Residents', body: 'Navigate, report, track and earn' },
                  { role: 'Township Admin', body: 'Triage, assign and analyse' },
                  { role: 'Maintenance Crew', body: 'Execute, document and close' },
                  { role: 'Recycling Operator', body: 'Verify, manage and reward' },
                ].map((r) => (
                  <div key={r.role} className="surface p-4">
                    <p className="text-sm font-bold text-ink-900 dark:text-white">{r.role}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                      {r.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="surface overflow-hidden">
                <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3 dark:border-white/10">
                  <span className="h-3 w-3 rounded-full bg-coral-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-semibold text-ink-400">
                    townsync / township overview
                  </span>
                </div>
                <div className="space-y-3 bg-ink-50 p-5 dark:bg-ink-950/50">
                  {[
                    { label: 'Active Community Reports', value: '11', delta: '+3 this week', color: '#FB5A36' },
                    { label: 'Accessibility Score', value: '78%', delta: '+4 after repairs', color: '#176B5B' },
                    { label: 'Active Safety Hazards', value: '8', delta: '2 high priority', color: '#F59E0B' },
                    { label: 'Total Recycled', value: '86.4 kg', delta: '15 activities', color: '#047857' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-4 rounded-xl border border-ink-200 bg-white p-3.5 dark:border-white/10 dark:bg-ink-900"
                    >
                      <span
                        className="h-9 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-ink-500 dark:text-ink-400">
                          {s.label}
                        </p>
                        <p className="text-xl font-extrabold text-ink-900 dark:text-white">
                          {s.value}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold text-ink-400">{s.delta}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------- CTA ------------------------- */}
      <section className="relative overflow-hidden bg-primary-700 py-20">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(40rem 30rem at 20% 0%, rgba(255,255,255,0.3), transparent 60%), radial-gradient(35rem 30rem at 100% 100%, rgba(251,90,54,0.4), transparent 60%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            See the whole township working together.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-primary-100/90">
            The demo runs entirely in your browser with realistic simulated data — pick any role and
            every module responds live.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" variant="accent" icon={<ArrowRight className="h-4 w-4" />}>
                Start the demo
              </Button>
            </Link>
            <Link to="/signin">
              <Button
                size="lg"
                variant="secondary"
                className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Animated dashboard mock
 * ------------------------------------------------------------------ */

function DashboardMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary-500/20 via-transparent to-coral-500/20 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-card-hover dark:border-white/10 dark:bg-ink-900">
        <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3 dark:border-white/10">
          <span className="h-2.5 w-2.5 rounded-full bg-coral-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-[11px] font-semibold text-ink-400">
            TownSync · Bandar Seri Damai
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          {[
            { label: 'Reports', value: '11', color: '#FB5A36' },
            { label: 'Resolved', value: '9', color: '#047857' },
            { label: 'Access score', value: '78%', color: '#176B5B' },
            { label: 'Hazards', value: '8', color: '#F59E0B' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 + i * 0.08 }}
              className="rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">{s.label}</p>
              <p
                className="mt-1 text-xl font-extrabold tracking-tight"
                style={{ color: s.color }}
              >
                {s.value}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-3 px-4 pb-4 sm:grid-cols-[1.35fr_1fr]">
          <div className="relative overflow-hidden rounded-xl border border-ink-100 bg-ink-100 dark:border-white/10 dark:bg-ink-950">
            <div className="grid-pattern absolute inset-0 opacity-70" aria-hidden />
            <svg viewBox="0 0 300 190" className="relative h-[190px] w-full" role="img" aria-label="Illustrative township map">
              <defs>
                <linearGradient id="mapFade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#176B5B" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#176B5B" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path
                d="M0 150 C60 130, 90 170, 140 140 S230 100, 300 120 L300 190 L0 190 Z"
                fill="url(#mapFade)"
              />
              <path
                d="M20 160 C60 130, 92 168, 140 140 S232 98, 300 118"
                fill="none"
                stroke="#176B5B"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.85"
              />
              <path
                d="M70 20 L120 175"
                stroke="#94A3B8"
                strokeWidth="2.5"
                strokeDasharray="5 6"
                strokeLinecap="round"
              />
              <circle cx="70" cy="20" r="7" fill="#176B5B" stroke="#fff" strokeWidth="3" />
              <circle cx="120" cy="175" r="7" fill="#FB5A36" stroke="#fff" strokeWidth="3" />
              <circle cx="215" cy="96" r="6" fill="#F59E0B" stroke="#fff" strokeWidth="3" />
              <circle cx="168" cy="58" r="6" fill="#047857" stroke="#fff" strokeWidth="3" />
              <circle cx="238" cy="152" r="6" fill="#8B5CF6" stroke="#fff" strokeWidth="3" />
            </svg>
            <div className="absolute bottom-2 left-2 flex gap-1.5">
              {['bg-coral-500', 'bg-amber-500', 'bg-primary-600', 'bg-emerald-600'].map((c) => (
                <span key={c} className={`h-2 w-2 rounded-full ${c}`} />
              ))}
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-white/10 dark:bg-white/5">
            {[
              { label: 'Reports', pct: 74, color: '#FB5A36' },
              { label: 'Access', pct: 58, color: '#176B5B' },
              { label: 'Safety', pct: 41, color: '#F59E0B' },
              { label: 'Recycling', pct: 86, color: '#047857' },
            ].map((b, i) => (
              <div key={b.label}>
                <div className="flex items-center justify-between text-[10px] font-semibold text-ink-500 dark:text-ink-400">
                  <span>{b.label}</span>
                  <span>{b.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-200 dark:bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${b.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: b.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
