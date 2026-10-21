import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Accessibility,
  ArrowRight,
  Bell,
  BookOpen,
  Building,
  Camera,
  ChartPie,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Cpu,
  Crown,
  Flag,
  Gauge,
  Leaf,
  MapPinned,
  Recycle,
  Route,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wand2,
} from 'lucide-react';

const MODULE_SECTIONS = [
  {
    id: 'accessable',
    name: 'AccessAble',
    tagline: 'Inclusive Township Navigator',
    icon: Accessibility,
    color: '#176B5B',
    bg: 'from-primary-50 to-emerald-50 dark:from-primary-500/10 dark:to-emerald-500/5',
    intro:
      'A routing engine that treats accessibility as a first-class route attribute. Choose your mobility profile and TownSync returns three genuinely different paths over the pedestrian graph.',
    features: [
      { icon: Route, title: 'Three route strategies', body: 'Shortest, most accessible and most comfortable — each computed with its own edge weighting.' },
      { icon: Compass, title: 'Mobility profiles', body: 'Wheelchair, older adult, parent with stroller, temporary limitation and general pedestrian.' },
      { icon: Gauge, title: 'Live obstacle avoidance', body: 'Community-reported obstacles reduce the effective accessibility of affected segments in real time.' },
      { icon: Camera, title: 'Pin and photograph', body: 'Report a blocked pavement, damaged ramp, missing curb ramp or broken lift with photo evidence.' },
    ],
  },
  {
    id: 'fixmytown',
    name: 'FixMyTown',
    tagline: 'Smart Community Maintenance',
    icon: ClipboardList,
    color: '#FB5A36',
    bg: 'from-coral-50 to-orange-50 dark:from-coral-500/10 dark:to-orange-500/5',
    intro:
      'A complete issue lifecycle: submission, prioritisation, triage, assignment, in-progress work, evidence and verified resolution — with a timeline residents can follow.',
    features: [
      { icon: Wand2, title: 'Smart prioritisation', body: 'Safety impact, affected residents, accessibility impact, severity, ageing and duplicates combine into a priority score.' },
      { icon: Sparkles, title: 'Duplicate detection', body: 'Category, proximity and text similarity surface likely duplicates for review — nothing is deleted automatically.' },
      { icon: Users, title: 'Resident support', body: 'Support an existing report instead of repeating it, raising its priority automatically.' },
      { icon: ClipboardCheck, title: 'Evidence-based closure', body: 'Staff upload repair evidence; management verifies before a report is marked resolved.' },
    ],
  },
  {
    id: 'safespot',
    name: 'SafeSpot',
    tagline: 'Neighbourhood Safety Monitoring',
    icon: ShieldCheck,
    color: '#F59E0B',
    bg: 'from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/5',
    intro:
      'Safety intelligence derived from the reports the community already files — SafeSpot never creates a second copy of an issue.',
    features: [
      { icon: Flag, title: 'Hazard taxonomy', body: 'Faulty streetlights, unsafe walkways, flood-prone spots, damaged crossings and active township warnings.' },
      { icon: ChartPie, title: 'Zone risk overview', body: 'Illustrative risk indicators aggregate hazards, unresolved reports and accessibility issues per neighbourhood.' },
      { icon: Bell, title: 'Location-based alerts', body: 'Residents are notified about hazards reported near their home and block.' },
      { icon: BookOpen, title: 'Resolved history', body: 'Cleared hazards remain visible as history so patterns over time become visible.' },
    ],
  },
  {
    id: 'recyclemate',
    name: 'RecycleMate',
    tagline: 'Smart Recycling & Rewards',
    icon: Recycle,
    color: '#047857',
    bg: 'from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/5',
    intro:
      'Find a station, check whether an item is recyclable, submit your activity and earn points that a recycling operator verifies before they are awarded.',
    features: [
      { icon: MapPinned, title: 'Station locator', body: 'Six stations with operating hours, accepted materials, live status and directions.' },
      { icon: BookOpen, title: 'Searchable guide', body: 'Look up any material to learn whether it is recyclable, how to prepare it and where to take it.' },
      { icon: Leaf, title: 'Green Rewards', body: 'Demo points rules award points per kilogram by material, verified by an operator.' },
      { icon: Trophy, title: 'Badges and leaderboard', body: 'Achievement tiers, community rankings and an illustrative impact summary.' },
    ],
  },
];

const PLATFORM = [
  { icon: Building, title: 'Role-based workspaces', body: 'Dedicated experiences for residents, township administrators, maintenance crews and recycling operators.' },
  { icon: Cpu, title: 'Real algorithms', body: 'A* pathfinding with weighted edge costs, live obstacle penalties and accessibility scoring.' },
  { icon: ChartPie, title: 'Interactive analytics', body: 'Recharts visualisations for issue trends, category mix, accessibility condition and recycling activity.' },
  { icon: ShieldCheck, title: 'Secure by design', body: 'Firestore rules prevent residents approving their own rewards or closing their own reports.' },
  { icon: Bell, title: 'Notifications everywhere', body: 'Toast feedback, in-app notification centre and event-driven updates across modules.' },
  { icon: Sparkles, title: 'Demo mode built in', body: 'Runs with zero configuration, persists changes locally and can be reset on demand.' },
];

export function FeaturesPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-200 bg-ink-50 dark:border-white/10 dark:bg-ink-950">
        <div className="mesh-hero absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-300">
            Platform features
          </p>
          <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl dark:text-white">
            Everything township management needs, working together.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg dark:text-ink-300">
            Four modules, a shared data model, and the engineering to make community reporting
            actually change outcomes.
          </p>
        </div>
      </section>

      {MODULE_SECTIONS.map((module) => {
        const Icon = module.icon;
        return (
          <section
            key={module.id}
            id={module.id}
            className="scroll-mt-24 border-b border-ink-200 py-20 dark:border-white/10"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                <div className="lg:sticky lg:top-28">
                  <span
                    className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-sm"
                    style={{ backgroundColor: module.color }}
                  >
                    <Icon className="h-7 w-7" />
                  </span>
                  <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                    {module.name}
                  </h2>
                  <p className="mt-1 text-sm font-bold" style={{ color: module.color }}>
                    {module.tagline}
                  </p>
                  <p className="mt-4 text-base leading-relaxed text-ink-600 dark:text-ink-300">
                    {module.intro}
                  </p>
                  <Link
                    to="/register"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-ink-900 hover:gap-2.5 dark:text-white"
                  >
                    Try {module.name} in the demo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {module.features.map((f, i) => {
                    const FIcon = f.icon;
                    return (
                      <motion.div
                        key={f.title}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className={`rounded-2xl border border-ink-200 bg-gradient-to-br ${module.bg} p-5 dark:border-white/10`}
                      >
                        <FIcon className="h-5 w-5" style={{ color: module.color }} />
                        <h3 className="mt-3 text-sm font-bold text-ink-900 dark:text-white">
                          {f.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                          {f.body}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
              Platform capabilities
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-500 dark:text-ink-400">
              The shared infrastructure that makes the modules feel like one product.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="surface card-hover p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-ink-900 dark:text-white">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                    {p.body}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-ink-200 bg-ink-50 p-8 dark:border-white/10 dark:bg-white/[0.03]">
            {[
              { icon: CheckCircle2, label: 'WCAG 2.2 AA oriented' },
              { icon: CheckCircle2, label: 'Fully responsive' },
              { icon: CheckCircle2, label: 'Dark & light modes' },
              { icon: CheckCircle2, label: 'Reduced motion honoured' },
              { icon: Crown, label: 'Demo mode included' },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-2 text-xs font-semibold text-ink-600 dark:border-white/10 dark:bg-white/5 dark:text-ink-300"
                >
                  <Icon className="h-3.5 w-3.5 text-primary-600 dark:text-primary-300" />
                  {b.label}
                </span>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
