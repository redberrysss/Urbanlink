import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Accessibility,
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Layers,
  Map as MapIcon,
  Recycle,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonCard } from '@/components/common/Skeleton';
import { TownshipMap, type MapLayers } from '@/components/maps/TownshipMap';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import {
  buildActivityFeed,
  categoryDistribution,
  computeAccessibilityScore,
  computeTownshipStats,
  maintenancePerformance,
  monthlyIssueSeries,
  recyclingTrend,
} from '@/services/analytics/aggregations';
import { MAINTENANCE_TEAMS } from '@/data/seed';
import {
  PRIORITY_META,
  REPORT_CATEGORY_META,
  formatRelative,
  formatWeight,
} from '@/utils/constants';
import { cn } from '@/utils/cn';
import type { ReportCategory } from '@/types';

import { EMPTY_LIST } from '@/utils/empty';
const LAYER_OPTIONS: { key: keyof MapLayers; label: string; color: string }[] = [
  { key: 'routes', label: 'Accessibility Routes', color: '#176B5B' },
  { key: 'issues', label: 'Maintenance Issues', color: '#FB5A36' },
  { key: 'hazards', label: 'Safety Hazards', color: '#F59E0B' },
  { key: 'stations', label: 'Recycling Stations', color: '#047857' },
];

export function OverviewPage() {
  const { user } = useAuth();
  const { reports, obstacles, hazards, stations, activities, tasks, notifications } = useTownshipData();
  const navigate = useNavigate();

  const [layers, setLayers] = useState<MapLayers>({
    routes: true,
    issues: true,
    hazards: true,
    stations: true,
  });

  const bundle = useMemo(
    () => ({
      reports: reports.data ?? EMPTY_LIST,
      obstacles: obstacles.data ?? EMPTY_LIST,
      hazards: hazards.data ?? EMPTY_LIST,
      stations: stations.data ?? EMPTY_LIST,
      activities: activities.data ?? EMPTY_LIST,
      tasks: tasks.data ?? EMPTY_LIST,
      teams: MAINTENANCE_TEAMS,
      users: [],
    }),
    [reports.data, obstacles.data, hazards.data, stations.data, activities.data, tasks.data],
  );

  const stats = useMemo(() => computeTownshipStats(bundle), [bundle]);
  const monthly = useMemo(() => monthlyIssueSeries(bundle.reports, 8), [bundle.reports]);
  const categories = useMemo(() => categoryDistribution(bundle.reports), [bundle.reports]);
  const recycling = useMemo(() => recyclingTrend(bundle.activities, 6), [bundle.activities]);
  const performance = useMemo(
    () => maintenancePerformance(MAINTENANCE_TEAMS, bundle.tasks),
    [bundle.tasks],
  );
  const accessScore = useMemo(
    () => computeAccessibilityScore(bundle.obstacles),
    [bundle.obstacles],
  );

  const feed = useMemo(
    () => buildActivityFeed(bundle, notifications.data ?? EMPTY_LIST, 10),
    [bundle, notifications.data],
  );

  const isAdmin = user?.role === 'admin';
  const isResident = user?.role === 'resident';

  const myReports = useMemo(
    () =>
      bundle.reports
        .filter((r) => r.reportedBy === user?.id || r.supporters.includes(user?.id ?? ''))
        .sort((a, b) => (a.reportedAt < b.reportedAt ? 1 : -1)),
    [bundle.reports, user?.id],
  );

  const loading = reports.isLoading || obstacles.isLoading;

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div>
      <PageHeader
        eyebrow={isAdmin ? 'Management overview' : 'Township overview'}
        title={`Welcome back, ${firstName}`}
        description={
          isAdmin
            ? 'A live view of report triage, maintenance throughput, safety exposure and recycling participation across the township.'
            : 'Everything happening in your township right now — reports you filed, hazards near you, and the recycling points you have earned.'
        }
        actions={
          <>
            {isAdmin ? (
              <Link to="/app/admin">
                <Button icon={<TrendingUp className="h-4 w-4" />}>Management dashboard</Button>
              </Link>
            ) : null}
            <Link to="/app/reports/new">
              <Button variant="secondary" icon={<ClipboardList className="h-4 w-4" />}>
                Report an issue
              </Button>
            </Link>
          </>
        }
      />

      <PageBody className="space-y-6">
        {/* ---------- Stat cards ---------- */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                label="Active Reports"
                value={stats.activeReports}
                icon={<ClipboardList className="h-5 w-5" />}
                accent="#FB5A36"
                delta={12}
                deltaLabel="vs last week"
                onClick={() => navigate('/app/reports')}
                spark={monthly.map((m) => m.submitted)}
              />
              <StatCard
                label="Resolved Issues"
                value={stats.resolvedIssues}
                icon={<CheckCircle2 className="h-5 w-5" />}
                accent="#047857"
                delta={8}
                deltaLabel="vs last week"
                onClick={() => navigate('/app/reports?status=resolved')}
                spark={monthly.map((m) => m.resolved)}
              />
              <StatCard
                label="Accessibility Score"
                value={`${accessScore}%`}
                icon={<Accessibility className="h-5 w-5" />}
                accent="#176B5B"
                onClick={() => navigate('/app/navigation')}
                spark={[70, 72, 68, 74, 76, 78]}
              />
              <StatCard
                label="Active Hazards"
                value={stats.activeHazards}
                icon={<ShieldCheck className="h-5 w-5" />}
                accent="#F59E0B"
                onClick={() => navigate('/app/safety')}
                spark={[6, 7, 9, 8, 7, stats.activeHazards]}
              />
              <StatCard
                label="Recycling Participation"
                value={stats.recyclingParticipation}
                unit="residents"
                icon={<Recycle className="h-5 w-5" />}
                accent="#047857"
                onClick={() => navigate('/app/recycling')}
                spark={recycling.map((r) => r.activities)}
              />
              <StatCard
                label="Total Recycled"
                value={formatWeight(stats.totalRecycledKg)}
                icon={<Activity className="h-5 w-5" />}
                accent="#0EA5E9"
                delta={18}
                deltaLabel="vs last month"
                onClick={() => navigate('/app/recycling')}
                spark={recycling.map((r) => r.kg)}
              />
            </>
          )}
        </div>

        {/* ---------- Map + layers ---------- */}
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <Card className="overflow-hidden">
            <CardHeader
              icon={<MapIcon className="h-5 w-5" />}
              title="Interactive township map"
              subtitle="Toggle layers to see how every module shares the same geography."
              action={
                <div className="flex flex-wrap items-center gap-1.5">
                  {LAYER_OPTIONS.map((option) => {
                    const active = layers[option.key];
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setLayers((l) => ({ ...l, [option.key]: !l[option.key] }))}
                        aria-pressed={active}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition',
                          active
                            ? 'border-transparent text-white'
                            : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300 dark:border-white/10 dark:bg-white/5 dark:text-ink-400',
                        )}
                        style={active ? { backgroundColor: option.color } : undefined}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: active ? '#fff' : option.color }}
                        />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              }
            />
            <div className="h-[420px] w-full sm:h-[480px]">
              <TownshipMap
                layers={layers}
                reports={bundle.reports}
                obstacles={bundle.obstacles}
                hazards={bundle.hazards}
                stations={bundle.stations}
                onSelectReport={(r) => navigate(`/app/reports/${r.id}`)}
                onSelectHazard={(h) => navigate(`/app/safety/${h.id}`)}
                onSelectStation={(s) => navigate(`/app/recycling?station=${s.id}`)}
                onSelectObstacle={() => navigate('/app/navigation')}
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-100 px-5 py-3 dark:border-white/10">
              {LAYER_OPTIONS.map((option) => (
                <span key={option.key} className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-500 dark:text-ink-400">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: option.color }} />
                  {option.label}
                </span>
              ))}
              <span className="ml-auto text-[11px] text-ink-400">
                Maps © OpenStreetMap contributors
              </span>
            </div>
          </Card>

          {/* Right rail */}
          <div className="space-y-6">
            <Card>
              <CardHeader
                icon={<Activity className="h-5 w-5" />}
                title="Recent activity"
                subtitle="Live feed across all modules"
              />
              <CardBody className="space-y-3">
                {feed.length === 0 ? (
                  <EmptyState
                    icon={<Activity className="h-5 w-5" />}
                    title="No activity yet"
                    description="Reports and updates will appear here as they happen."
                  />
                ) : (
                  feed.slice(0, 7).map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <span
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          item.kind === 'report'
                            ? 'bg-coral-500'
                            : item.kind === 'maintenance'
                              ? 'bg-sky-500'
                              : item.kind === 'recycling'
                                ? 'bg-emerald-500'
                                : item.kind === 'hazard'
                                  ? 'bg-amber-500'
                                  : 'bg-primary-500',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-ink-800 dark:text-ink-100">
                          {item.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                          {item.description}
                        </p>
                        <p className="mt-1 text-[10px] font-medium text-ink-400">
                          {formatRelative(item.at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>

            {isResident ? (
              <Card>
                <CardHeader
                  icon={<ClipboardList className="h-5 w-5" />}
                  title="My reports"
                  subtitle={`${myReports.length} submitted or supported`}
                />
                <CardBody className="space-y-2.5">
                  {myReports.length === 0 ? (
                    <EmptyState
                      icon={<ClipboardList className="h-5 w-5" />}
                      title="Nothing reported yet"
                      description="Spot a problem in the township? Report it and track the fix."
                      actionLabel="Report an issue"
                      onAction={() => navigate('/app/reports/new')}
                    />
                  ) : (
                    myReports.slice(0, 5).map((r) => {
                      const p = PRIORITY_META[r.priority.level];
                      return (
                        <Link
                          key={r.id}
                          to={`/app/reports/${r.id}`}
                          className="block rounded-xl border border-ink-100 p-3 transition hover:border-primary-300 hover:bg-primary-50/40 dark:border-white/10 dark:hover:bg-primary-500/10"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-1 text-xs font-bold text-ink-800 dark:text-ink-100">
                              {r.title}
                            </p>
                            <Badge color={p.color} bg={p.bg} className="shrink-0">
                              {p.label}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[10px] text-ink-400">
                            {r.reference} · updated {formatRelative(r.updatedAt)}
                          </p>
                        </Link>
                      );
                    })
                  )}
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardHeader
                  icon={<Wrench className="h-5 w-5" />}
                  title="Maintenance queue"
                  subtitle={`${stats.openTasks} open tasks`}
                />
                <CardBody className="space-y-2.5">
                  {bundle.tasks
                    .filter((t) => t.status !== 'completed')
                    .slice(0, 6)
                    .map((t) => (
                      <Link
                        key={t.id}
                        to={`/app/reports?task=${t.id}`}
                        className="block rounded-xl border border-ink-100 p-3 transition hover:border-primary-300 dark:border-white/10"
                      >
                        <p className="line-clamp-1 text-xs font-bold text-ink-800 dark:text-ink-100">
                          {t.title}
                        </p>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-ink-400">
                          {t.status.replace(/_/g, ' ')}
                        </p>
                      </Link>
                    ))}
                </CardBody>
              </Card>
            )}
          </div>
        </div>

        {/* ---------- Charts ---------- */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              icon={<TrendingUp className="h-5 w-5" />}
              title="Monthly issue reports vs resolution"
              subtitle="Eight-month submission and resolution trend"
            />
            <CardBody>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FB5A36" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#FB5A36" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#047857" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Area
                      type="monotone"
                      dataKey="submitted"
                      name="Submitted"
                      stroke="#FB5A36"
                      strokeWidth={2.5}
                      fill="url(#gradSubmitted)"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      name="Resolved"
                      stroke="#047857"
                      strokeWidth={2.5}
                      fill="url(#gradResolved)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={<Layers className="h-5 w-5" />}
              title="Issue categories"
              subtitle="Distribution of all community reports"
            />
            <CardBody>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={92}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {categories.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value: string) =>
                        REPORT_CATEGORY_META[value as ReportCategory]?.label ?? value
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={<Recycle className="h-5 w-5" />}
              title="Recycling activity trend"
              subtitle="Verified kilograms collected per month"
            />
            <CardBody>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recycling} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="kg" name="Kilograms" fill="#047857" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="points" name="Points" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={<Wrench className="h-5 w-5" />}
              title="Maintenance performance"
              subtitle="Completion rate by team"
            />
            <CardBody>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performance}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="team"
                      tick={{ fontSize: 10, fill: '#94A3B8' }}
                      axisLine={false}
                      tickLine={false}
                      width={110}
                      tickFormatter={(v: string) => v.replace('Team ', '').split(' — ')[0]}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="completionRate" name="Completion %" radius={[0, 6, 6, 0]}>
                      {performance.map((p) => (
                        <Cell key={p.team} fill={p.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* ---------- Module shortcuts ---------- */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              to: '/app/navigation',
              title: 'Plan an accessible route',
              body: 'Three strategies computed live over the pedestrian graph.',
              icon: Accessibility,
              color: '#176B5B',
            },
            {
              to: '/app/safety',
              title: 'Check neighbourhood safety',
              body: `${bundle.hazards.filter((h) => h.status !== 'resolved').length} active hazards and zone risk indicators.`,
              icon: ShieldCheck,
              color: '#F59E0B',
            },
            {
              to: '/app/recycling',
              title: 'Find a recycling station',
              body: `${bundle.stations.length} stations with hours, accepted materials and status.`,
              icon: Recycle,
              color: '#047857',
            },
            {
              to: '/app/activities',
              title: 'Track your activities',
              body: 'Recycling submissions, reward points and achievement badges.',
              icon: Activity,
              color: '#0EA5E9',
            },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.to}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <Link
                  to={m.to}
                  className="group surface card-hover flex h-full flex-col p-5"
                >
                  <span
                    className="grid h-10 w-10 place-items-center rounded-xl text-white"
                    style={{ backgroundColor: m.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3.5 text-sm font-bold text-ink-900 dark:text-white">{m.title}</p>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                    {m.body}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 transition group-hover:gap-2.5 dark:text-primary-300">
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </PageBody>
    </div>
  );
}
