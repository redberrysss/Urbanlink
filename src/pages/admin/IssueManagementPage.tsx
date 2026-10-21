import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Filter,
  Search,
  ShieldAlert,
  Users,
  Wrench,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { DataTable, type Column } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/common/Toast';
import { MAINTENANCE_TEAMS } from '@/data/seed';
import {
  PRIORITY_META,
  REPORT_CATEGORY_META,
  REPORT_STATUS_META,
  STATUS_FLOW,
  formatRelative,
} from '@/utils/constants';
import type { Report, ReportStatus } from '@/types';

import { EMPTY_LIST } from '@/utils/empty';
export function IssueManagementPage() {
  const { reports, setReportStatus } = useTownshipData();
  const { user } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReportStatus | 'all'>('all');
  const [teamId, setTeamId] = useState<string>('all');
  const [target, setTarget] = useState<Report | null>(null);
  const [nextStatus, setNextStatus] = useState<ReportStatus>('under_review');
  const [assignTeam, setAssignTeam] = useState(MAINTENANCE_TEAMS[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const all = reports.data ?? EMPTY_LIST;

  const filtered = useMemo(() => {
    let list = [...all];
    if (status !== 'all') list = list.filter((r) => r.status === status);
    if (teamId !== 'all') list = list.filter((r) => r.assignedTeamId === teamId);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.reference.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => b.priority.total - a.priority.total);
  }, [all, status, teamId, search]);

  const columns: Column<Report>[] = [
    {
      key: 'report',
      header: 'Report',
      sortable: true,
      sortValue: (r) => r.title,
      render: (r) => (
        <div className="min-w-0">
          <Link
            to={`/app/reports/${r.id}`}
            className="line-clamp-1 text-sm font-bold text-ink-900 hover:text-primary-600 dark:text-white"
          >
            {r.title}
          </Link>
          <p className="mt-0.5 text-[11px] text-ink-400">
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
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: REPORT_CATEGORY_META[r.category].color }}
          />
          {REPORT_CATEGORY_META[r.category].label}
        </span>
      ),
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
            <span className="text-[11px] font-bold text-ink-400">{r.priority.total}</span>
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
      key: 'team',
      header: 'Assigned',
      sortable: true,
      sortValue: (r) => r.assignedTeamId ?? '',
      hideBelow: 'lg',
      render: (r) => {
        const team = MAINTENANCE_TEAMS.find((t) => t.id === r.assignedTeamId);
        return (
          <span className="text-xs font-semibold text-ink-600 dark:text-ink-300">
            {team?.name.split(' — ')[0] ?? '—'}
          </span>
        );
      },
    },
    {
      key: 'updated',
      header: 'Updated',
      sortable: true,
      sortValue: (r) => r.updatedAt,
      hideBelow: 'lg',
      render: (r) => (
        <span className="text-xs text-ink-500 dark:text-ink-400">{formatRelative(r.updatedAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {r.potentialDuplicates.length > 0 ? (
            <span title="Possible duplicates detected">
              <Copy className="h-4 w-4 text-amber-500" />
            </span>
          ) : null}
          {r.safetyHazardId ? (
            <span title="Linked safety hazard">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
            </span>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              setTarget(r);
              setNextStatus(
                STATUS_FLOW.includes(r.status)
                  ? STATUS_FLOW[Math.min(STATUS_FLOW.indexOf(r.status) + 1, STATUS_FLOW.length - 1)]
                  : 'under_review',
              );
              setAssignTeam(r.assignedTeamId ?? MAINTENANCE_TEAMS[0]?.id ?? '');
              setNote('');
            }}
          >
            Triage
          </Button>
        </div>
      ),
    },
  ];

  const apply = async () => {
    if (!target || !user) return;
    setBusy(true);
    try {
      await setReportStatus({
        reportId: target.id,
        actor: user,
        status: nextStatus,
        note: note.trim() || undefined,
        teamId: nextStatus === 'assigned' ? assignTeam : undefined,
      });
      toast({
        kind: 'success',
        title: 'Report updated',
        description: `${target.reference} moved to “${REPORT_STATUS_META[nextStatus].label}”.`,
      });
      setTarget(null);
    } catch (err) {
      toast({
        kind: 'error',
        title: 'Could not update the report',
        description: err instanceof Error ? err.message : 'Unexpected error.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Township Administration · Issue Triage"
        title="Issue management"
        description="Triage, assign and close community reports. Every action writes to the shared timeline and updates the linked hazard and route obstacle."
      />

      <PageBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              { key: 'all' as const, label: 'All reports', value: all.length },
              {
                key: 'pending' as const,
                label: 'Awaiting triage',
                value: all.filter((r) => r.status === 'pending').length,
              },
              {
                key: 'assigned' as const,
                label: 'Assigned',
                value: all.filter((r) => r.status === 'assigned' || r.status === 'in_progress')
                  .length,
              },
              {
                key: 'resolved' as const,
                label: 'Resolved',
                value: all.filter((r) => r.status === 'resolved').length,
              },
            ]
          ).map((c) => (
            <Card key={c.key}>
              <CardBody>
                <button
                  type="button"
                  onClick={() => setStatus(c.key)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{c.label}</p>
                    <p className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-white">
                      {c.value}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-ink-300" />
                </button>
              </CardBody>
            </Card>
          ))}
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
                  placeholder="Search reports…"
                  className="input pl-9"
                  aria-label="Search reports"
                />
              </div>
              <Select
                value={status}
                onChange={(v) => setStatus(v as ReportStatus | 'all')}
                options={[
                  { value: 'all', label: 'All statuses' },
                  ...(
                    Object.keys(REPORT_STATUS_META) as ReportStatus[]
                  ).map((s) => ({ value: s, label: REPORT_STATUS_META[s].label })),
                ]}
                className="w-[180px]"
              />
              <Select
                value={teamId}
                onChange={setTeamId}
                options={[
                  { value: 'all', label: 'All teams' },
                  ...MAINTENANCE_TEAMS.map((t) => ({ value: t.id, label: t.name.split(' — ')[0] })),
                ]}
                className="w-[200px]"
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-0">
            <DataTable
              columns={columns}
              rows={filtered}
              pageSize={10}
              empty={
                <EmptyState
                  icon={<Filter className="h-5 w-5" />}
                  title="No reports match these filters"
                  description="Adjust the status, team or search term to see more."
                />
              }
            />
          </CardBody>
        </Card>
      </PageBody>

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Triage report"
        description="Change the status, assign a team and leave a note for the timeline."
        icon={<Wrench className="h-5 w-5" />}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button onClick={apply} loading={busy}>
              Apply
            </Button>
          </>
        }
      >
        {target ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-ink-100 p-3.5 dark:border-white/10">
              <p className="text-sm font-bold text-ink-900 dark:text-white">{target.title}</p>
              <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">
                {target.reference} · {target.address}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                {target.description}
              </p>
            </div>

            <Select
              label="Status"
              value={nextStatus}
              onChange={(v) => setNextStatus(v as ReportStatus)}
              options={(
                ['pending', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected'] as ReportStatus[]
              ).map((s) => ({ value: s, label: REPORT_STATUS_META[s].label }))}
            />

            <Select
              label="Assign to team"
              value={assignTeam}
              onChange={setAssignTeam}
              options={MAINTENANCE_TEAMS.map((t) => ({
                value: t.id,
                label: `${t.name} — ${t.specialty.join(', ')}`,
              }))}
              hint={`${MAINTENANCE_TEAMS.find((t) => t.id === assignTeam)?.members ?? 0} members · ${MAINTENANCE_TEAMS.find((t) => t.id === assignTeam)?.activeTasks ?? 0} active tasks`}
            />

            <div>
              <label htmlFor="triage-note" className="label">
                Timeline note
              </label>
              <textarea
                id="triage-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Inspection findings, next action, materials required…"
                className="input"
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-[11px] text-ink-500 dark:bg-white/[0.04] dark:text-ink-400">
              <Users className="h-3.5 w-3.5 shrink-0" />
              The reporter and every supporter are notified automatically when the status changes.
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
