import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  ClipboardList,
  Filter,
  MapPin,
  Plus,
  Search,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { DataTable, type Column } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { Select } from '@/components/common/Select';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { SkeletonTable } from '@/components/common/Skeleton';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  PRIORITY_META,
  REPORT_CATEGORY_META,
  REPORT_STATUS_META,
  formatRelative,
} from '@/utils/constants';
import type { Report, ReportStatus } from '@/types';
import { cn } from '@/utils/cn';

import { EMPTY_LIST } from '@/utils/empty';
type ScopeFilter = 'all' | 'mine' | 'critical' | 'resolved';

export function ReportsPage() {
  const { reports, tasks } = useTownshipData();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<ScopeFilter>(
    (params.get('scope') as ScopeFilter) ?? 'all',
  );
  const [status, setStatus] = useState<ReportStatus | 'all'>(
    (params.get('status') as ReportStatus | 'all') ?? 'all',
  );
  const [category, setCategory] = useState<string>(params.get('category') ?? 'all');
  const [sort, setSort] = useState<'priority' | 'recent' | 'oldest'>('priority');

  const all = reports.data ?? EMPTY_LIST;

  const filtered = useMemo(() => {
    let list = [...all];

    if (scope === 'mine') {
      list = list.filter(
        (r) => r.reportedBy === user?.id || r.supporters.includes(user?.id ?? ''),
      );
    }
    if (scope === 'critical') {
      list = list.filter(
        (r) => r.priority.level === 'critical' || r.priority.level === 'high',
      );
    }
    if (scope === 'resolved') {
      list = list.filter((r) => r.status === 'resolved');
    }
    if (status !== 'all') {
      list = list.filter((r) => r.status === status);
    }
    if (category !== 'all') {
      list = list.filter((r) => r.category === category);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.reference.toLowerCase().includes(q),
      );
    }

    if (sort === 'priority') list.sort((a, b) => b.priority.total - a.priority.total);
    if (sort === 'recent') list.sort((a, b) => (a.reportedAt < b.reportedAt ? 1 : -1));
    if (sort === 'oldest') list.sort((a, b) => (a.reportedAt > b.reportedAt ? 1 : -1));
    return list;
  }, [all, scope, status, category, search, sort, user?.id]);

  const taskByReport = useMemo(() => {
    const map = new Map<string, string>();
    (tasks.data ?? EMPTY_LIST).forEach((t) => map.set(t.reportId, t.id));
    return map;
  }, [tasks.data]);

  const counts = useMemo(
    () => ({
      all: all.length,
      mine: all.filter(
        (r) => r.reportedBy === user?.id || r.supporters.includes(user?.id ?? ''),
      ).length,
      critical: all.filter(
        (r) => r.priority.level === 'critical' || r.priority.level === 'high',
      ).length,
      resolved: all.filter((r) => r.status === 'resolved').length,
    }),
    [all, user?.id],
  );

  const columns: Column<Report>[] = [
    {
      key: 'reference',
      header: 'Report',
      sortable: true,
      sortValue: (r) => r.reference,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink-900 dark:text-white">{r.title}</p>
          <p className="mt-0.5 text-[11px] font-medium text-ink-400">
            {r.reference} · {r.reportedByName}
          </p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      sortValue: (r) => r.category,
      hideBelow: 'md',
      render: (r) => {
        const meta = REPORT_CATEGORY_META[r.category];
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
            {meta.label}
          </span>
        );
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      sortValue: (r) => r.priority.total,
      render: (r) => {
        const p = PRIORITY_META[r.priority.level];
        return (
          <div className="flex items-center gap-2">
            <Badge color={p.color} bg={p.bg}>
              {p.label}
            </Badge>
            <span className="text-[11px] font-bold text-ink-400">{r.priority.total} pts</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (r) => REPORT_STATUS_META[r.status].order,
      render: (r) => {
        const s = REPORT_STATUS_META[r.status];
        return (
          <Badge color={s.color} bg={s.bg}>
            {s.label}
          </Badge>
        );
      },
    },
    {
      key: 'supporters',
      header: 'Support',
      sortable: true,
      sortValue: (r) => r.supporters.length,
      hideBelow: 'lg',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-ink-500 dark:text-ink-400">
          <ThumbsUp className="h-3.5 w-3.5" />
          {r.supporters.length}
        </span>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      sortable: true,
      sortValue: (r) => r.updatedAt,
      hideBelow: 'lg',
      render: (r) => (
        <span className="text-xs text-ink-500 dark:text-ink-400">
          {formatRelative(r.updatedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.taskId || taskByReport.get(r.id) ? (
            <Badge color="#0369A1" bg="#E0F2FE">
              Ticket
            </Badge>
          ) : null}
          <Link
            to={`/app/reports/${r.id}`}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10"
            aria-label={`Open ${r.reference}`}
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
  ];

  const updateScope = (v: ScopeFilter) => {
    setScope(v);
    const next = new URLSearchParams(params);
    if (v === 'all') next.delete('scope');
    else next.set('scope', v);
    setParams(next, { replace: true });
  };

  return (
    <div>
      <PageHeader
        eyebrow="FixMyTown · Community Issue Tracker"
        title="Reports"
        description="Every community report in one queue — tracked from submission, through triage and assignment, to verified resolution."
        actions={
          <Link to="/app/reports/new">
            <Button icon={<Plus className="h-4 w-4" />}>New report</Button>
          </Link>
        }
      />

      <PageBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              { key: 'all' as ScopeFilter, label: 'All reports', value: counts.all, color: '#176B5B' },
              { key: 'mine' as ScopeFilter, label: 'My reports', value: counts.mine, color: '#0EA5E9' },
              {
                key: 'critical' as ScopeFilter,
                label: 'High priority',
                value: counts.critical,
                color: '#FB5A36',
              },
              {
                key: 'resolved' as ScopeFilter,
                label: 'Resolved',
                value: counts.resolved,
                color: '#047857',
              },
            ] as const
          ).map((c) => {
            const active = scope === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => updateScope(c.key)}
                className={cn(
                  'surface flex items-center justify-between p-4 text-left transition',
                  active ? 'ring-2' : 'hover:shadow-card-hover',
                )}
                style={active ? { boxShadow: `0 0 0 2px ${c.color}` } : undefined}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{c.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-white">
                    {c.value}
                  </p>
                </div>
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl text-white"
                  style={{ backgroundColor: c.color }}
                >
                  <ClipboardList className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>

        <Card>
          <CardBody>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, description, address or reference…"
                  className="input pl-9"
                  aria-label="Search reports"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={status}
                  onChange={(v) => setStatus(v as ReportStatus | 'all')}
                  options={[
                    { value: 'all', label: 'All statuses' },
                    ...(
                      Object.keys(REPORT_STATUS_META) as ReportStatus[]
                    ).map((s) => ({ value: s, label: REPORT_STATUS_META[s].label })),
                  ]}
                  className="w-[170px]"
                />
                <Select
                  value={category}
                  onChange={setCategory}
                  options={[
                    { value: 'all', label: 'All categories' },
                    ...Object.entries(REPORT_CATEGORY_META).map(([k, v]) => ({
                      value: k,
                      label: v.label,
                    })),
                  ]}
                  className="w-[190px]"
                />
                <SegmentedControl
                  value={sort}
                  onChange={setSort}
                  size="sm"
                  options={[
                    { value: 'priority', label: 'Priority', icon: <TrendingUp className="h-3.5 w-3.5" /> },
                    { value: 'recent', label: 'Recent' },
                    { value: 'oldest', label: 'Oldest' },
                  ]}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-0">
            {reports.isLoading ? (
              <div className="p-5">
                <SkeletonTable rows={6} cols={6} />
              </div>
            ) : (
              <DataTable
                columns={columns}
                rows={filtered}
                pageSize={8}
                empty={
                  <EmptyState
                    icon={<Filter className="h-5 w-5" />}
                    title="No reports match these filters"
                    description="Try widening the status, category or scope filters."
                    actionLabel="Clear filters"
                    onAction={() => {
                      setSearch('');
                      setStatus('all');
                      setCategory('all');
                      updateScope('all');
                    }}
                  />
                }
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-coral-50 text-coral-600 dark:bg-coral-500/15 dark:text-coral-300">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-900 dark:text-white">
                  Reports are shared across every module
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                  A single submission can simultaneously appear as a route obstacle in AccessAble,
                  a safety hazard in SafeSpot and a maintenance ticket in FixMyTown. Resolving it
                  clears every linked record at once — no duplicated data, no stale warnings.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
