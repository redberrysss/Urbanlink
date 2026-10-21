import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Accessibility,
  AlertTriangle,
  Armchair,
  Baby,
  Bandage,
  ChevronDown,
  Footprints,
  HeartPulse,
  Info,
  Navigation,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { Meter } from '@/components/common/Progress';
import { TownshipMap } from '@/components/maps/TownshipMap';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useToast } from '@/components/common/Toast';
import { PLACES, ROUTE_NODES } from '@/data/township';
import {
  buildGraph,
  computeAllRoutes,
  nearestNode,
  routeGeometry,
  STRATEGY_DESCRIPTIONS,
  STRATEGY_LABELS,
} from '@/services/routing/engine';
import { MOBILITY_PROFILES, formatDistance, formatDuration } from '@/utils/constants';
import type { MobilityProfile, RouteResult, RouteStrategy } from '@/types';
import { cn } from '@/utils/cn';

import { EMPTY_LIST } from '@/utils/empty';
const PROFILE_ICONS: Record<MobilityProfile, typeof Accessibility> = {
  wheelchair: Accessibility,
  older_adult: HeartPulse,
  stroller: Baby,
  temporary_limitation: Bandage,
  general: Footprints,
};

const STRATEGY_COLORS: Record<RouteStrategy, string> = {
  shortest: '#0EA5E9',
  accessible: '#176B5B',
  comfortable: '#FB5A36',
};

const STRATEGY_ICONS: Record<RouteStrategy, typeof RouteIcon> = {
  shortest: Navigation,
  accessible: Accessibility,
  comfortable: Star,
};

export function NavigationPage() {
  const { obstacles, reports } = useTownshipData();
  const { toast } = useToast();

  const [startId, setStartId] = useState('n7');
  const [endId, setEndId] = useState('n13');
  const [profile, setProfile] = useState<MobilityProfile>('wheelchair');
  const [selected, setSelected] = useState<RouteStrategy>('accessible');
  const [showAllObstacles, setShowAllObstacles] = useState(false);

  const graph = useMemo(
    () => buildGraph(obstacles.data ?? EMPTY_LIST),
    [obstacles.data],
  );

  const routes = useMemo(
    () => computeAllRoutes(graph, startId, endId, profile),
    [graph, startId, endId, profile],
  );

  useEffect(() => {
    if (routes.length > 0 && !routes.some((r) => r.strategy === selected)) {
      setSelected(routes[0].strategy);
    }
  }, [routes, selected]);

  const activeRoute = routes.find((r) => r.strategy === selected) ?? routes[0];
  const path = activeRoute ? routeGeometry(activeRoute) : [];

  const openObstacles = useMemo(
    () => (obstacles.data ?? EMPTY_LIST).filter((o) => o.status !== 'resolved'),
    [obstacles.data],
  );

  const relatedReports = useMemo(
    () => (reports.data ?? EMPTY_LIST).filter((r) => r.obstacleId),
    [reports.data],
  );

  const placeOptions = [
    { value: '', label: 'Roadside landmarks' },
    ...PLACES.map((p) => ({ value: p.id, label: p.name, group: 'Landmarks' })),
    ...ROUTE_NODES.map((n) => ({ value: n.id, label: n.name, group: 'Route nodes' })),
  ];

  const resolvePlace = (id: string) => {
    const place = PLACES.find((p) => p.id === id);
    if (place) return nearestNode({ lat: place.lat, lng: place.lng }).id;
    return id;
  };

  return (
    <div>
      <PageHeader
        eyebrow="AccessAble · Inclusive Township Navigator"
        title="Plan an accessible route"
        description="Choose where you are going and how you travel. TownSync computes three routes over the pedestrian graph, weighting live community-reported obstacles, walkway condition, shelter and safety."
      />

      <PageBody className="space-y-6">
        {/* ---------- Planner ---------- */}
        <Card>
          <CardBody>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr_auto] lg:items-end">
              <Select
                label="Starting location"
                value={startId}
                onChange={(v) => setStartId(resolvePlace(v))}
                options={placeOptions}
              />
              <Select
                label="Destination"
                value={endId}
                onChange={(v) => setEndId(resolvePlace(v))}
                options={placeOptions}
              />

              <div>
                <span className="label">Mobility preference</span>
                <div className="flex flex-wrap gap-1.5">
                  {MOBILITY_PROFILES.map((p) => {
                    const Icon = PROFILE_ICONS[p.id];
                    const active = profile === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProfile(p.id)}
                        aria-pressed={active}
                        title={p.description}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition',
                          active
                            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-200'
                            : 'border-ink-200 text-ink-600 hover:border-primary-300 hover:text-primary-700 dark:border-white/10 dark:text-ink-300',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{p.label.replace(' user', '').replace('Parent with ', 'Parent + ')}</span>
                        <span className="sm:hidden">{p.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="hint">
                  {MOBILITY_PROFILES.find((p) => p.id === profile)?.description}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-3 text-primary-800 dark:bg-primary-500/10 dark:text-primary-200">
                <Sparkles className="h-4 w-4 shrink-0" />
                <p className="text-xs font-semibold">
                  {routes.length} route{routes.length === 1 ? '' : 's'} computed live
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* ---------- Map + route cards ---------- */}
        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <Card className="overflow-hidden">
            <div className="h-[420px] sm:h-[520px]">
              <TownshipMap
                layers={{ routes: true, issues: false, hazards: false, stations: false }}
                obstacles={obstacles.data ?? EMPTY_LIST}
                routePath={path}
                routeColor={activeRoute ? STRATEGY_COLORS[activeRoute.strategy] : '#176B5B'}
                reports={[]}
                hazards={[]}
                stations={[]}
                onSelectObstacle={(o) =>
                  toast({
                    kind: 'info',
                    title: o.title,
                    description: `${o.description} — this obstacle reduces the accessibility score of the affected segment.`,
                  })
                }
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink-100 px-5 py-3 dark:border-white/10">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-500 dark:text-ink-400">
                <span className="h-2 w-2 rounded-full bg-primary-600" />
                Pedestrian graph
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-500 dark:text-ink-400">
                <span className="h-2 w-2 rounded-full bg-ink-400" />
                Segment with steps
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-500 dark:text-ink-400">
                <span className="h-2 w-2 rounded-sm bg-primary-600" />
                Reported obstacle
              </span>
              <span className="ml-auto text-[11px] text-ink-400">
                Maps © OpenStreetMap contributors
              </span>
            </div>
          </Card>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {routes.map((route) => (
                <motion.div
                  key={route.strategy}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <RouteCard
                    route={route}
                    active={selected === route.strategy}
                    onSelect={() => setSelected(route.strategy)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {activeRoute ? (
              <Card>
                <CardHeader
                  icon={<RouteIcon className="h-5 w-5" />}
                  title="Segment detail"
                  subtitle={`${activeRoute.legs.length} segments on the ${STRATEGY_LABELS[activeRoute.strategy].toLowerCase()}`}
                />
                <CardBody className="space-y-3">
                  {activeRoute.legs.map((leg, i) => {
                    const from = ROUTE_NODES.find((n) => n.id === leg.from);
                    const to = ROUTE_NODES.find((n) => n.id === leg.to);
                    const conditionColor =
                      leg.condition === 'good'
                        ? '#047857'
                        : leg.condition === 'fair'
                          ? '#F59E0B'
                          : '#F0330F';
                    return (
                      <div key={leg.edgeId} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: conditionColor }}
                          >
                            {i + 1}
                          </span>
                          {i < activeRoute.legs.length - 1 ? (
                            <span className="mt-1 w-px flex-1 bg-ink-200 dark:bg-white/10" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1 pb-3">
                          <p className="text-xs font-bold text-ink-800 dark:text-ink-100">
                            {from?.name} → {to?.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">
                            {formatDistance(leg.distanceM)} · accessibility {leg.accessibilityScore}/100 ·
                            ramp {leg.rampCount === 0 ? 'none' : `×${leg.rampCount}`} · {leg.condition} condition
                          </p>
                          {leg.notes.length > 0 ? (
                            <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-ink-400">
                              {leg.notes.join(' · ')}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            ) : null}
          </div>
        </div>

        {/* ---------- Active route summary ---------- */}
        {activeRoute ? (
          <Card>
            <CardHeader
              icon={<Target className="h-5 w-5" />}
              title="Route profile"
              subtitle={STRATEGY_DESCRIPTIONS[activeRoute.strategy]}
            />
            <CardBody className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="grid gap-4 sm:grid-cols-2">
                <Meter
                  label="Accessibility score"
                  value={activeRoute.accessibilityScore}
                  suffix="/100"
                  color="#176B5B"
                />
                <Meter
                  label="Comfort score"
                  value={activeRoute.comfortScore}
                  suffix="/100"
                  color="#0EA5E9"
                />
                <Meter
                  label="Safety indicator"
                  value={activeRoute.safetyScore}
                  suffix="/100"
                  color="#F59E0B"
                />
                <Meter
                  label="Sheltered coverage"
                  value={activeRoute.hasShelter ? 78 : 32}
                  suffix="%"
                  color="#7C3AED"
                />
              </div>
              <div className="space-y-2.5">
                {activeRoute.warnings.length > 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-500/30 dark:bg-amber-500/10">
                    <p className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Route advisories
                    </p>
                    <ul className="mt-2 space-y-1">
                      {activeRoute.warnings.map((w) => (
                        <li key={w} className="text-xs leading-relaxed text-amber-900/90 dark:text-amber-100/80">
                          • {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <p className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      No active advisories on this route
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-emerald-900/80 dark:text-emerald-100/80">
                      No community-reported obstacles or degraded segments were found along this path.
                    </p>
                  </div>
                )}
                <div className="rounded-xl border border-ink-200 bg-ink-50 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="flex items-center gap-2 text-xs font-bold text-ink-700 dark:text-ink-200">
                    <Info className="h-3.5 w-3.5" />
                    Prototype notice
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                    Segment accessibility, shelter and safety attributes are simulated prototype data
                    authored for this demonstration. They are not derived from an audited accessibility
                    survey and should not be relied on for real navigation decisions.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : null}

        {/* ---------- Obstacles ---------- */}
        <Card>
          <CardHeader
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Reported accessibility obstacles"
            subtitle={`${openObstacles.length} active obstacles across the pedestrian network`}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAllObstacles((s) => !s)}
                icon={<ChevronDown className={cn('h-3.5 w-3.5 transition', showAllObstacles && 'rotate-180')} />}
              >
                {showAllObstacles ? 'Show less' : 'Show all'}
              </Button>
            }
          />
          <CardBody>
            {openObstacles.length === 0 ? (
              <EmptyState
                icon={<Accessibility className="h-5 w-5" />}
                title="No active obstacles recorded"
                description="Every reported obstacle has been resolved and the route graph is fully open."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {openObstacles.slice(0, showAllObstacles ? 99 : 6).map((o) => {
                  const linked = relatedReports.find((r) => r.id === o.reportId);
                  return (
                    <div
                      key={o.id}
                      className="rounded-xl border border-ink-200 p-4 transition hover:border-primary-300 dark:border-white/10"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-ink-900 dark:text-white">{o.title}</p>
                        <Badge
                          color={o.status === 'open' ? '#C2410C' : '#0369A1'}
                          bg={o.status === 'open' ? '#FFEDD5' : '#E0F2FE'}
                        >
                          {o.status}
                        </Badge>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                        {o.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold">
                        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-ink-600 dark:bg-white/10 dark:text-ink-300">
                          {o.category.replace(/_/g, ' ')}
                        </span>
                        <span className="rounded-full bg-coral-50 px-2 py-0.5 text-coral-700 dark:bg-coral-500/15 dark:text-coral-300">
                          severity {Math.round(o.severity * 100)}%
                        </span>
                        {linked ? (
                          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-primary-700 dark:bg-primary-500/15 dark:text-primary-200">
                            linked to {linked.reference}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* ---------- Profile explainer ---------- */}
        <Card>
          <CardHeader
            icon={<Armchair className="h-5 w-5" />}
            title="How mobility profiles change the route"
            subtitle="Each profile applies different weights to the same graph"
          />
          <CardBody className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {MOBILITY_PROFILES.map((p) => {
              const Icon = PROFILE_ICONS[p.id];
              const active = profile === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProfile(p.id)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition',
                    active
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                      : 'border-ink-200 hover:border-primary-300 dark:border-white/10',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      active ? 'text-primary-600 dark:text-primary-300' : 'text-ink-400',
                    )}
                  />
                  <p className="mt-2.5 text-sm font-bold text-ink-900 dark:text-white">{p.label}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                    {p.description}
                  </p>
                  <p className="mt-2.5 text-[10px] font-semibold text-ink-400">
                    {p.requireStepFree ? 'Step-free only' : 'Steps permitted'} · min accessibility{' '}
                    {p.minAccessibility || '—'}
                  </p>
                </button>
              );
            })}
          </CardBody>
        </Card>

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-ink-400">
          <Sun className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Route computation uses A* over the seeded pedestrian graph with weighted edge costs. Live
          community obstacles reduce the effective accessibility, smoothness and safety of the
          segments they affect.
        </p>
      </PageBody>
    </div>
  );
}

function RouteCard({
  route,
  active,
  onSelect,
}: {
  route: RouteResult;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = STRATEGY_ICONS[route.strategy];
  const color = STRATEGY_COLORS[route.strategy];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'w-full rounded-2xl border p-4 text-left transition',
        active
          ? 'border-transparent shadow-card-hover ring-2'
          : 'border-ink-200 bg-white hover:border-primary-300 dark:border-white/10 dark:bg-ink-900',
      )}
      style={active ? { backgroundColor: `${color}0D`, boxShadow: `0 0 0 2px ${color}` } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
            style={{ backgroundColor: color }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-ink-900 dark:text-white">
              {STRATEGY_LABELS[route.strategy]}
            </p>
            <p className="text-[11px] leading-snug text-ink-500 dark:text-ink-400">
              {route.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Distance', value: formatDistance(route.distanceM) },
          { label: 'Duration', value: formatDuration(route.durationMin) },
          { label: 'Accessibility', value: `${route.accessibilityScore}%` },
          { label: 'Obstacles', value: String(route.obstacleCount) },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">{s.label}</p>
            <p className="mt-0.5 text-sm font-extrabold text-ink-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600 dark:bg-white/10 dark:text-ink-300">
          Ramps ×{route.rampCount}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600 dark:bg-white/10 dark:text-ink-300">
          {route.degradedSegmentCount} degraded segment{route.degradedSegmentCount === 1 ? '' : 's'}
        </span>
        {route.hasShelter ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            Sheltered sections
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
          Safety {route.safetyScore}/100
        </span>
      </div>
    </button>
  );
}
