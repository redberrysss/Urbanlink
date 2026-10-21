import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Accessibility,
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Recycle,
  ShieldCheck,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
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
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { MAINTENANCE_TEAMS } from '@/data/seed';
import {
  categoryDistribution,
  computeNeighbourhoodRisks,
  computeTownshipStats,
  maintenancePerformance,
  monthlyIssueSeries,
  recyclingTrend,
} from '@/services/analytics/aggregations';
import { PRIORITY_META, REPORT_CATEGORY_META, formatRelative } from '@/utils/constants';

import { EMPTY_LIST } from '@/utils/empty';
export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { reports, obstacles, hazards, stations, activities, tasks, users } = useTownshipData();

  const bundle = useMemo(
    () => ({
      reports: reports.data ?? EMPTY_LIST,
      obstacles: obstacles.data ?? EMPTY_LIST,
      hazards: hazards.data ?? EMPTY_LIST,
      stations: stations.data ?? EMPTY_LIST,
      activities: activities.data ?? EMPTY_LIST,
      tasks: tasks.data ?? EMPTY_LIST,
      teams: MAINTENANCE_TEAMS,
      users: users.data ?? EMPTY_LIST,
    }),
    [reports.data, obstacles.data, hazards.data, stations.data, activities.data, tasks.data, users.data],
  );

  const stats = useMemo(() => computeTownshipStats(bundle), [bundle]);
  const monthly = useMemo(() => monthlyIssueSeries(bundle.reports, 8), [bundle.reports]);
  const categories = useMemo(() => categoryDistribution(bundle.reports), [bundle.reports]);
  const recycling = useMemo(() => recyclingTrend(bundle.activities, 6), [bundle.activities]);
  const performance = useMemo(
    () => maintenancePerformance(MAINTENANCE_TEAMS, bundle.tasks),
    [bundle.tasks],
  );
  const risks = useMemo(() => computeNeighbourhoodRisks(bundle), [bundle]);

  const backlog = useMemo(
    () =>
      [...bundle.reports]
        .filter((r) => r.status !== 'resolved' && r.status !== 'rejected')
        .sort((a, b) => b.priority.total - a.priority.total)
        .slice(0, 6),
    [bundle.reports],
  );

  const teamLoad = useMemo(
    () =>
      MAINTENANCE_TEAMS.map((team) => ({
        team: team.name.replace('Team ', '').split(' — ')[0],
        open: bundle.tasks.filter((t) => t.teamId === team.id && t.status !== 'completed').length,
        resolved: bundle.tasks.filter((t) => t.teamId === team.id && t.status === 'completed').length,
        color: team.color,
      })),
    [bundle.tasks],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Township Administration"
        title="Management dashboard"
        description="Whole-township oversight: triage backlog, maintenance throughput, safety exposure, accessibility health and recycling participation."
      />

      <PageBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatCard
            label="Active Reports"
            value={stats.activeReports}
            icon={<ClipboardList className="h-5 w-5" />}
            accent="#FB5A36"
            onClick={() => navigate('/app/admin/issues')}
            spark={monthly.map((m) => m.submitted)}
          />
          <StatCard
            label="Resolved"
            value={stats.resolvedIssues}
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="#047857"
            spark={monthly.map((m) => m.resolved)}
          />
          <StatCard
            label="Avg Resolution"
            value={stats.avgResolutionDays}
            unit="days"
            icon={<TrendingUp className="h-5 w-5" />}
            accent="#0EA5E9"
          />
          <StatCard
            label="Duplicate Rate"
            value={stats.duplicateRate}
            unit="%"
            icon={<BarChart3 className="h-5 w-5" />}
            accent="#7C3AED"
          />
          <StatCard
            label="Open Tasks"
            value={stats.openTasks}
            icon={<Wrench className="h-5 w-5" />}
            accent="#C2410C"
          />
          <StatCard
            label="Registered Users"
            value={bundle.users.length}
            icon={<Users className="h-5 w-5" />}
            accent="#176B5B"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Card>
              <CardHeader
                icon={<Activity className="h-5 w-5" />}
                title="Submission vs resolution"
                subtitle="Eight-month operational trend"
              />
              <CardBody>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id="adminGradSub" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FB5A36" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#FB5A36" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#FB5A36" strokeWidth={2.5} fill="url(#adminGradSub)" />
                      <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#047857" strokeWidth={2.5} fill="none" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader
                  icon={<BarChart3 className="h-5 w-5" />}
                  title="Team workload"
                  subtitle="Open versus completed tasks"
                />
                <CardBody>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teamLoad} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" vertical={false} />
                        <XAxis dataKey="team" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="open" name="Open" fill="#FB5A36" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="resolved" name="Completed" fill="#047857" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  icon={<Recycle className="h-5 w-5" />}
                  title="Recycling volume"
                  subtitle="Verified kilograms per month"
                />
                <CardBody>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={recycling} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="kg" name="Kilograms" fill="#047857" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader
                icon={<ClipboardList className="h-5 w-5" />}
                title="Triage backlog"
                subtitle="Highest priority unresolved reports"
                action={
                  <Link to="/app/admin/issues">
                    <Button size="sm" variant="secondary">
                      Manage all
                    </Button>
                  </Link>
                }
              />
              <CardBody className="space-y-2.5">
                {backlog.map((r) => {
                  const priority = PRIORITY_META[r.priority.level];
                  return (
                    <Link
                      key={r.id}
                      to={`/app/reports/${r.id}`}
                      className="flex items-start gap-3 rounded-xl border border-ink-100 p-3.5 transition hover:border-primary-300 dark:border-white/10"
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
                        style={{ backgroundColor: REPORT_CATEGORY_META[r.category].color }}
                      >
                        <ClipboardList className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-ink-900 dark:text-white">{r.title}</p>
                          <Badge color={priority.color} bg={priority.bg}>
                            {priority.label}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">
                          {r.reference} · {r.address} · {formatRelative(r.reportedAt)}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold text-ink-900 dark:text-white">
                        {r.priority.total}
                      </span>
                    </Link>
                  );
                })}
              </CardBody>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            <Card>
              <CardHeader
                icon={<BarChart3 className="h-5 w-5" />}
                title="Category mix"
                subtitle="Share of all reports"
              />
              <CardBody>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={84}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {categories.map((c) => (
                          <Cell key={c.name} fill={c.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={<AlertTriangle className="h-5 w-5" />}
                title="Zone risk"
                subtitle="Highest exposure first"
              />
              <CardBody className="space-y-2.5">
                {[...risks]
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .map((z) => (
                    <div
                      key={z.zoneId}
                      className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3 dark:border-white/10"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-ink-800 dark:text-ink-100">
                          {z.zoneName}
                        </p>
                        <p className="text-[10px] text-ink-400">{z.factors.join(' · ')}</p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor:
                            z.riskScore > 60 ? '#FFE4E6' : z.riskScore > 30 ? '#FEF3C7' : '#D1FAE5',
                          color: z.riskScore > 60 ? '#9F1239' : z.riskScore > 30 ? '#B45309' : '#047857',
                        }}
                      >
                        {z.riskScore}
                      </span>
                    </div>
                  ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={<Wrench className="h-5 w-5" />}
                title="Team completion"
                subtitle="Resolved versus active tasks"
              />
              <CardBody className="space-y-3">
                {performance.map((p) => (
                  <div key={p.team}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-ink-700 dark:text-ink-200">{p.team}</span>
                      <span className="font-semibold text-ink-400">{p.completionRate}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${p.completionRate}%`, backgroundColor: p.color }}
                      />
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { to: '/app/admin/accessibility', label: 'Accessibility', icon: Accessibility, color: '#176B5B' },
                    { to: '/app/admin/safety', label: 'Safety', icon: ShieldCheck, color: '#F59E0B' },
                    { to: '/app/admin/recycling', label: 'Recycling', icon: Recycle, color: '#047857' },
                    { to: '/app/admin/users', label: 'Users', icon: Users, color: '#7C3AED' },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <Link
                        key={m.to}
                        to={m.to}
                        className="surface flex flex-col items-start gap-2 p-3.5 transition hover:shadow-card-hover"
                      >
                        <span
                          className="grid h-8 w-8 place-items-center rounded-lg text-white"
                          style={{ backgroundColor: m.color }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-xs font-bold text-ink-800 dark:text-ink-100">{m.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
