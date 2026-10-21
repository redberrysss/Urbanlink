import { useMemo, useState } from 'react';
import {
  BarChart3,
  Clock,
  Copy,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/common/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import {
  categoryDistribution,
  monthlyIssueSeries,
} from '@/services/analytics/aggregations';
import {
  PRIORITY_META,
  REPORT_CATEGORY_META,
  REPORT_STATUS_META,
} from '@/utils/constants';
import type { ReportCategory } from '@/types';

import { EMPTY_LIST } from '@/utils/empty';
export function ReportsAnalyticsPage() {
  const { reports } = useTownshipData();
  const [category, setCategory] = useState<ReportCategory | 'all'>('all');

  const all = reports.data ?? EMPTY_LIST;

  const scoped = useMemo(
    () => (category === 'all' ? all : all.filter((r) => r.category === category)),
    [all, category],
  );

  const monthly = useMemo(() => monthlyIssueSeries(scoped, 8), [scoped]);
  const categories = useMemo(() => categoryDistribution(scoped), [scoped]);

  const priorityMix = useMemo(() => {
    const map = new Map<string, number>();
    scoped.forEach((r) => map.set(r.priority.level, (map.get(r.priority.level) ?? 0) + 1));
    const palette: Record<string, string> = {
      critical: '#9F1239',
      high: '#C2410C',
      medium: '#0369A1',
      low: '#047857',
    };
    return [...map.entries()].map(([level, value]) => ({
      level,
      value,
      color: palette[level] ?? '#64748B',
    }));
  }, [scoped]);

  const resolutionByCategory = useMemo(() => {
    const map = new Map<ReportCategory, { total: number; resolved: number }>();
    scoped.forEach((r) => {
      const c = map.get(r.category) ?? { total: 0, resolved: 0 };
      c.total += 1;
      if (r.status === 'resolved') c.resolved += 1;
      map.set(r.category, c);
    });
    return [...map.entries()].map(([key, v]) => ({
      category: key,
      label: REPORT_CATEGORY_META[key].label,
      color: REPORT_CATEGORY_META[key].color,
      total: v.total,
      resolved: v.resolved,
      rate: v.total ? Math.round((v.resolved / v.total) * 100) : 0,
    }));
  }, [scoped]);

  const resolutionTimes = useMemo(() => {
    const buckets = [
      { label: '0-1 days', min: 0, max: 1 },
      { label: '1-3 days', min: 1, max: 3 },
      { label: '3-7 days', min: 3, max: 7 },
      { label: '7-14 days', min: 7, max: 14 },
      { label: '14+ days', min: 14, max: Infinity },
    ];
    return buckets.map((b) => ({
      label: b.label,
      count: scoped.filter((r) => {
        if (!r.resolvedAt) return false;
        const days =
          (new Date(r.resolvedAt).getTime() - new Date(r.reportedAt).getTime()) / 86_400_000;
        return days > b.min && days <= b.max;
      }).length,
    }));
  }, [scoped]);

  const duplicates = scoped.filter((r) => r.potentialDuplicates.length > 0);
  const escalated = scoped.filter((r) => r.safetyHazardId || r.obstacleId);
  const resolved = scoped.filter((r) => r.status === 'resolved');
  const avgDays = resolved.length
    ? (
        resolved.reduce(
          (s, r) =>
            s +
            (new Date(r.resolvedAt!).getTime() - new Date(r.reportedAt).getTime()) /
              86_400_000,
          0,
        ) / resolved.length
      ).toFixed(1)
    : '0';

  return (
    <div>
      <PageHeader
        eyebrow="Township Administration · Reporting Intelligence"
        title="Reports analytics"
        description="Submission volume, resolution performance, priority mix and cross-module escalation across the community reporting programme."
        actions={
          <Select
            value={category}
            onChange={(v) => setCategory(v as ReportCategory | 'all')}
            options={[
              { value: 'all', label: 'All categories' },
              ...(
                Object.keys(REPORT_CATEGORY_META) as ReportCategory[]
              ).map((c) => ({ value: c, label: REPORT_CATEGORY_META[c].label })),
            ]}
            className="w-[210px]"
          />
        }
      />

      <PageBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Reports Analysed"
            value={scoped.length}
            icon={<BarChart3 className="h-5 w-5" />}
            accent="#176B5B"
          />
          <StatCard
            label="Avg Resolution"
            value={avgDays}
            unit="days"
            icon={<Clock className="h-5 w-5" />}
            accent="#0EA5E9"
          />
          <StatCard
            label="Escalated to Other Modules"
            value={escalated.length}
            icon={<TrendingUp className="h-5 w-5" />}
            accent="#F59E0B"
          />
          <StatCard
            label="Duplicate Candidates"
            value={duplicates.length}
            icon={<Copy className="h-5 w-5" />}
            accent="#FB5A36"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              icon={<TrendingUp className="h-5 w-5" />}
              title="Submission trend"
              subtitle="Reports received each month"
            />
            <CardBody>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#FB5A36" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#047857" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={<BarChart3 className="h-5 w-5" />}
              title="Category split"
              subtitle="Share of the selected scope"
            />
            <CardBody>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={88}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {categories.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={<TriangleAlert className="h-5 w-5" />}
              title="Resolution rate by category"
              subtitle="Share of reports closed"
            />
            <CardBody>
              {resolutionByCategory.length === 0 ? (
                <EmptyState icon={<BarChart3 className="h-5 w-5" />} title="No data in this scope" />
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={resolutionByCategory}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={130}
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="total" name="Total" fill="#CBD5E1" radius={[0, 6, 6, 0]} />
                      <Bar dataKey="resolved" name="Resolved" radius={[0, 6, 6, 0]}>
                        {resolutionByCategory.map((c) => (
                          <Cell key={c.category} fill={c.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={<Clock className="h-5 w-5" />}
              title="Time to resolution"
              subtitle="Distribution of resolution turnaround"
            />
            <CardBody>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resolutionTimes} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Reports" fill="#176B5B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            icon={<TriangleAlert className="h-5 w-5" />}
            title="Priority distribution"
            subtitle="How the automatic scoring classified each report"
          />
          <CardBody className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {priorityMix.map((p) => {
              const meta = PRIORITY_META[p.level as keyof typeof PRIORITY_META];
              const share = scoped.length ? Math.round((p.value / scoped.length) * 100) : 0;
              return (
                <div
                  key={p.level}
                  className="rounded-xl border border-ink-100 p-4 dark:border-white/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge color={meta.color} bg={meta.bg}>
                      {meta.label}
                    </Badge>
                    <span className="text-xl font-extrabold text-ink-900 dark:text-white">
                      {p.value}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-500 dark:text-ink-400">
                    {share}% of the selected scope
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${share}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={<BarChart3 className="h-5 w-5" />}
            title="Status overview"
            subtitle="Every report in the selected scope"
            action={
              <span className="text-[11px] font-semibold text-ink-400">
                {scoped.length} total
              </span>
            }
          />
          <CardBody className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(Object.keys(REPORT_STATUS_META) as (keyof typeof REPORT_STATUS_META)[]).map((s) => {
              const meta = REPORT_STATUS_META[s];
              const count = scoped.filter((r) => r.status === s).length;
              const share = scoped.length ? Math.round((count / scoped.length) * 100) : 0;
              return (
                <div
                  key={s}
                  className="rounded-xl border border-ink-100 p-4 dark:border-white/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{ backgroundColor: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="text-lg font-extrabold text-ink-900 dark:text-white">
                      {count}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                    {meta.description}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${share}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
