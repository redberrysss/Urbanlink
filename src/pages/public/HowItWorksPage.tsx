import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Accessibility,
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  MapPinned,
  Recycle,
  ShieldCheck,
  Upload,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/common/Button';

const STEPS = [
  {
    icon: MapPinned,
    title: 'Choose where you are going',
    body: 'Pick a start point and destination on the township map, then select the mobility profile that matches your journey today.',
    detail: 'Five mobility profiles change the route weights — wheelchair users, older adults, parents with strollers, temporary limitations and general pedestrians each get different recommendations.',
  },
  {
    icon: Accessibility,
    title: 'Compare three real routes',
    body: 'Shortest, most accessible and most comfortable paths are computed separately with A* over the pedestrian graph.',
    detail: 'Each route reports distance, duration, accessibility score, obstacle count, ramp availability, walkway condition and sheltered walkway coverage.',
  },
  {
    icon: ClipboardList,
    title: 'Report what you find',
    body: 'Photograph the problem and pin it on the map. It takes under a minute to submit a complete report.',
    detail: 'Category, severity, affected population and location feed directly into the priority score and the routing engine.',
  },
  {
    icon: Wrench,
    title: 'Watch it get handled',
    body: 'The status timeline shows every step: review, assignment, work in progress, uploaded evidence and verification.',
    detail: 'You can support an existing report instead of filing a duplicate, which raises its priority automatically.',
  },
  {
    icon: Recycle,
    title: 'Recycle and earn',
    body: 'Locate the nearest station, submit your activity with a photo and a weight, and earn Green Reward points.',
    detail: 'A recycling operator verifies each submission before points are awarded — residents can never approve their own.',
  },
];

const INTEGRATION = [
  {
    icon: ClipboardList,
    title: 'FixMyTown creates the record',
    body: 'Every community report is stored once, with an owner, a reference, timestamps and a status.',
    color: '#FB5A36',
  },
  {
    icon: Accessibility,
    title: 'AccessAble reads the obstacles',
    body: 'Reports flagged as accessibility issues are projected onto the route graph and change route weights immediately.',
    color: '#176B5B',
  },
  {
    icon: ShieldCheck,
    title: 'SafeSpot reads the hazards',
    body: 'Reports with a safety dimension become map hazards and zone risk contributors — no second record is created.',
    color: '#F59E0B',
  },
  {
    icon: Wrench,
    title: 'Maintenance executes the work',
    body: 'A task is created, assigned to a crew, and closed only after photographic evidence is verified.',
    color: '#0EA5E9',
  },
  {
    icon: Bell,
    title: 'Everyone is notified',
    body: 'Residents, crews, operators and managers receive the update that matches their role, through toasts and the notification centre.',
    color: '#047857',
  },
];

export function HowItWorksPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-200 bg-ink-50 dark:border-white/10 dark:bg-ink-950">
        <div className="mesh-hero absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-300">
            How it works
          </p>
          <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl dark:text-white">
            From observation to resolution in one flow.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg dark:text-ink-300">
            TownSync keeps one thread from the moment a resident notices something to the moment a
            repair is verified — and then it feeds that outcome back into every other module.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ol className="space-y-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.li
                  key={s.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  className="surface flex flex-col gap-5 p-6 sm:flex-row"
                >
                  <div className="flex items-start gap-4 sm:flex-col sm:items-center">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-600 text-white">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="hidden h-full w-px bg-ink-200 sm:block dark:bg-white/10" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                        Step {i + 1}
                      </span>
                    </div>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-ink-900 dark:text-white">
                      {s.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                      {s.body}
                    </p>
                    <p className="mt-3 rounded-xl bg-ink-50 px-4 py-3 text-sm leading-relaxed text-ink-500 dark:bg-white/[0.04] dark:text-ink-400">
                      {s.detail}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="border-y border-ink-200 bg-ink-50 py-20 dark:border-white/10 dark:bg-ink-950/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
              What happens behind the scenes
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-500 dark:text-ink-400">
              One submission, five coordinated consequences — without duplicated records.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-5">
            {INTEGRATION.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="surface relative p-5"
                >
                  <span
                    className="grid h-10 w-10 place-items-center rounded-xl text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3.5 text-sm font-bold text-ink-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                    {item.body}
                  </p>
                  {i < INTEGRATION.length - 1 ? (
                    <span className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-ink-200 bg-white text-ink-400 lg:grid dark:border-white/10 dark:bg-ink-900">
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="surface p-8 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                  Ready to see it run?
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                  The demo needs no Firebase project — pick a role and every module responds
                  instantly, with changes persisted locally.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/register">
                  <Button icon={<ArrowRight className="h-4 w-4" />}>Start the demo</Button>
                </Link>
                <Link to="/features">
                  <Button variant="secondary">Browse features</Button>
                </Link>
              </div>
            </div>
            <div className="mt-8 grid gap-3 border-t border-ink-100 pt-6 sm:grid-cols-3 dark:border-white/10">
              {[
                { icon: Upload, label: 'No installation required' },
                { icon: CheckCircle2, label: 'Realistic seeded data' },
                { icon: Recycle, label: 'Reset any time' },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <span key={b.label} className="flex items-center gap-2 text-xs font-semibold text-ink-500 dark:text-ink-400">
                    <Icon className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                    {b.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
