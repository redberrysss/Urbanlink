import { useMemo } from 'react';
import { Accessibility, AlertTriangle, Gauge, Route, TrendingUp } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Meter } from '@/components/common/Progress';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import {
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
import { ROUTE_EDGES } from '@/data/township';
import { computeEdgeProfile } from '@/services/routing/engine';
import {
  accessibilityConditionStats,
  computeAccessibilityScore,
} from '@/services/analytics/aggregations';
import type { AccessibilityObstacle } from '@/types';

import { EMPTY_LIST } from '@/utils/empty';
export function AccessibilityAnalyticsPage() {
  const { obstacles } = useTownshipData();

  const all = obstacles.data ?? EMPTY_LIST;

  const condition = useMemo(() => accessibilityConditionStats(all), [all]);
  const score = useMemo(() => computeAccessibilityScore(all), [all]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { label: string; count: number; severity: number }>();
    all.forEach((o) => {
      const current = map.get(o.category) ?? {
        label: o.category.replace(/_/g, ' '),
        count: 0,
        severity: 0,
      };
      current.count += 1;
      current.severity += o.severity;
      map.set(o.category, current);
    });
    return [...map.entries()].map(([key, v]) => ({
      key,
      label: v.label,
      count: v.count,
      severity: v.severity / v.count,
    }));
  }, [all]);

  const worstSegments = useMemo(
    () =>
      ROUTE_EDGES.map((edge) => ({ edge, profile: computeEdgeProfile(edge, all) }))
        .sort((a, b) => a.profile.effectiveAccessibility - b.profile.effectiveAccessibility)
        .slice(0, 8),
    [all],
  );

  const open = all.filter((o) => o.status !== 'resolved');
  const blocking = open.filter((o) => o.severity >= 0.7);

  return (
    <div>
      <PageHeader
        eyebrow="Township Administration · AccessAble Analytics"
        title="Accessibility analytics"
        description="Walkway condition across the pedestrian network, obstacle distribution and the segments that most need attention."
      />

      <PageBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Accessibility Score"
            value={`${score}%`}
            icon={<Accessibility className="h-5 w-5" />}
            accent="#176B5B"
          />
          <StatCard
            label="Total Obstacles"
            value={all.length}
            icon={<AlertTriangle className="h-5 w-5" />}
            accent="#FB5A36"
          />
          <StatCard
            label="Currently Blocking"
            value={blocking.length}
            icon={<Gauge className="h-5 w-5" />}
            accent="#F0330F"
          />
          <StatCard
            label="Network Segments"
            value={ROUTE_EDGES.length}
            icon={<Route className="h-5 w-5" />}
            accent="#0EA5E9"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              icon={<Gauge className="h-5 w-5" />}
              title="Walkway condition"
              subtitle="Share of network segments by condition"
            />
            <CardBody>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={condition}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={52}
                      outerRadius={90}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {condition.map((c) => (
                        <Cell key={c.label} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {condition.map((c) => (
                  <div key={c.label} className="rounded-xl bg-ink-50 p-3 dark:bg-white/[0.04]">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-400">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.label}
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-ink-900 dark:text-white">
                      {c.value}%
                    </p>
                    <p className="text-[10px] text-ink-400">{c.detail}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={<AlertTriangle className="h-5 w-5" />}
              title="Obstacles by category"
              subtitle="Average severity shown against the bar height"
            />
            <CardBody>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byCategory}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={130}
                      tick={{ fontSize: 10, fill: '#94A3B8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: string) => v.replace(/_/g, ' ')}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" name="Obstacles" fill="#176B5B" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            icon={<TrendingUp className="h-5 w-5" />}
            title="Lowest-scoring segments"
            subtitle="The walkways the router penalises most heavily"
          />
          <CardBody className="space-y-3">
            {worstSegments.map(({ edge, profile }) => (
              <div
                key={edge.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/10"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
                  style={{
                    backgroundColor:
                      profile.condition === 'blocked'
                        ? '#9F1239'
                        : profile.condition === 'poor'
                          ? '#F0330F'
                          : profile.condition === 'fair'
                            ? '#F59E0B'
                            : '#047857',
                  }}
                >
                  <Route className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink-800 dark:text-ink-100">
                    {edge.from} → {edge.to}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-400">
                    {profile.condition} condition · {profile.obstacleCount} obstacle
                    {profile.obstacleCount === 1 ? '' : 's'} · step-free{' '}
                    {edge.stepFree ? 'yes' : 'no'} · {edge.surfaceNote}
                  </p>
                </div>
                <div className="w-40">
                  <Meter
                    label="Accessibility"
                    value={profile.effectiveAccessibility}
                    suffix="/100"
                    color={profile.effectiveAccessibility < 50 ? '#F0330F' : '#176B5B'}
                  />
                </div>
                <Badge
                  color={profile.condition === 'good' ? '#047857' : '#C2410C'}
                  bg={profile.condition === 'good' ? '#D1FAE5' : '#FFEDD5'}
                >
                  {profile.condition}
                </Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Blocking obstacles"
            subtitle="Obstacles currently preventing step-free passage"
          />
          <CardBody>
            {blocking.length === 0 ? (
              <EmptyState
                icon={<Accessibility className="h-5 w-5" />}
                title="No blocking obstacles"
                description="Every reported obstacle has been resolved or is below the blocking threshold."
              />
            ) : (
              <div className="space-y-2.5">
                {blocking.map((o: AccessibilityObstacle) => (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/10"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-ink-800 dark:text-ink-100">{o.title}</p>
                      <p className="mt-0.5 text-[10px] text-ink-400">
                        {o.category.replace(/_/g, ' ')} · {o.status} · {o.votes} votes
                      </p>
                    </div>
                    <Badge color="#9F1239" bg="#FFE4E6">
                      severity {Math.round(o.severity * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
