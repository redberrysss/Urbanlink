import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Accessibility,
  ArrowRight,
  Building2,
  ClipboardList,
  Database,
  Gauge,
  Map,
  Recycle,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/common/Button';

const PILLARS = [
  {
    icon: Accessibility,
    title: 'Accessibility as a first-class concern',
    body: 'Accessibility is not a filter applied at the end — the route graph, the issue taxonomy and the safety model all understand step-free movement, curb ramps, surface smoothness and shelter.',
    color: '#176B5B',
  },
  {
    icon: Database,
    title: 'One shared data model',
    body: 'Reports, obstacles, hazards, maintenance tasks and recycling activities reference each other by ID. A resolution in one module is immediately visible in every other module.',
    color: '#0EA5E9',
  },
  {
    icon: Gauge,
    title: 'Evidence-driven decisions',
    body: 'Priority scoring, duplicate detection and risk indicators give the township office a defensible queue instead of a wall of complaints.',
    color: '#FB5A36',
  },
  {
    icon: Users,
    title: 'Community participation loop',
    body: 'Residents report, support, track and verify. Maintenance crews document their work with photo evidence. Operators confirm recycling claims. Everyone sees the same status.',
    color: '#047857',
  },
];

const STACK = [
  { layer: 'Experience', items: ['React + TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion', 'React Leaflet + OpenStreetMap'] },
  { layer: 'Interface', items: ['React Router', 'TanStack Query', 'React Hook Form + Zod', 'Recharts', 'Lucide icons'] },
  { layer: 'Service', items: ['Firebase Authentication', 'Cloud Firestore', 'Firebase Storage', 'Cloud Functions (optional)', 'Security rules'] },
  { layer: 'Intelligence', items: ['A* route search', 'Weighted edge costs', 'Priority scoring', 'Duplicate detection', 'Zone risk aggregation'] },
];

export function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-200 bg-ink-50 dark:border-white/10 dark:bg-ink-950">
        <div className="mesh-hero absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-300"
          >
            About TownSync
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-4 text-balance text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl dark:text-white"
          >
            Township problems are connected. So is TownSync.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg dark:text-ink-300"
          >
            Most municipal platforms digitise the paperwork around a problem without connecting the
            problem itself. TownSync is built on the opposite premise: capture what residents
            experience once, and let every team that needs to respond see the same truth.
          </motion.p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                Built around one idea
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-600 dark:text-ink-300">
                A resident who uses a wheelchair, a township manager triaging a queue and a
                maintenance crew repairing a ramp are looking at the same street. TownSync is the
                layer that lets them collaborate without duplicating data.
              </p>
              <p className="mt-4 text-base leading-relaxed text-ink-600 dark:text-ink-300">
                The result is a platform where a broken curb ramp is simultaneously a routing
                constraint, a safety hazard, a maintenance ticket and a verified repair — all from
                a single submission.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {PILLARS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="surface card-hover p-5"
                  >
                    <span
                      className="grid h-11 w-11 place-items-center rounded-xl text-white"
                      style={{ backgroundColor: p.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-base font-bold text-ink-900 dark:text-white">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                      {p.body}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink-200 bg-ink-50 py-20 dark:border-white/10 dark:bg-ink-950/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
              Architecture
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-500 dark:text-ink-400">
              A modular, layered structure that keeps the four modules independent in code and
              unified in data.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {STACK.map((layer, i) => (
              <motion.div
                key={layer.layer}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="surface flex flex-col gap-4 p-6 lg:flex-row lg:items-center"
              >
                <div className="flex items-center gap-3 lg:w-48 lg:shrink-0">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
                    {i === 0 ? (
                      <Map className="h-4 w-4" />
                    ) : i === 1 ? (
                      <ClipboardList className="h-4 w-4" />
                    ) : i === 2 ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <Gauge className="h-4 w-4" />
                    )}
                  </span>
                  <p className="text-sm font-bold text-ink-900 dark:text-white">{layer.layer}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {layer.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-600 dark:border-white/10 dark:bg-white/5 dark:text-ink-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Accessibility, label: 'AccessAble' },
              { icon: ClipboardList, label: 'FixMyTown' },
              { icon: ShieldCheck, label: 'SafeSpot' },
              { icon: Recycle, label: 'RecycleMate' },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="surface p-6">
                  <Icon className="mx-auto h-7 w-7 text-primary-600 dark:text-primary-300" />
                  <p className="mt-3 text-sm font-bold text-ink-900 dark:text-white">{m.label}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-12">
            <Link to="/register">
              <Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                Try the platform
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
