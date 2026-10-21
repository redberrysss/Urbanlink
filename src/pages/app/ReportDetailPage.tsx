import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Accessibility,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ClipboardList,
  Copy,
  Flag,
  MapPin,
  MessageSquare,
  ShieldAlert,
  ThumbsUp,
  Users,
  Wrench,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import { PageLoader } from '@/components/common/PageLoader';
import { Meter } from '@/components/common/Progress';
import { TownshipMap } from '@/components/maps/TownshipMap';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/common/Toast';
import { MAINTENANCE_TEAMS } from '@/data/seed';
import {
  HAZARD_TYPE_META,
  PRIORITY_META,
  REPORT_CATEGORY_META,
  REPORT_STATUS_META,
  STATUS_FLOW,
  formatDateTime,
  formatRelative,
} from '@/utils/constants';
import type { ReportStatus } from '@/types';
import { cn } from '@/utils/cn';

import { EMPTY_LIST } from '@/utils/empty';
const TIMELINE_ICONS: Record<string, typeof Flag> = {
  submitted: ClipboardList,
  review: MessageSquare,
  assigned: Users,
  progress: Wrench,
  evidence: ClipboardList,
  verified: CheckCircle2,
  resolved: CheckCircle2,
  rejected: ShieldAlert,
  duplicate: Copy,
  supported: ThumbsUp,
  priority_change: Flag,
};

export function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    reports,
    obstacles,
    hazards,
    tasks,
    setReportStatus,
    support,
  } = useTownshipData();

  const [statusOpen, setStatusOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<ReportStatus>('under_review');
  const [note, setNote] = useState('');
  const [teamId, setTeamId] = useState<string>(MAINTENANCE_TEAMS[0]?.id ?? '');
  const [busy, setBusy] = useState(false);

  const report = useMemo(
    () => (reports.data ?? EMPTY_LIST).find((r) => r.id === reportId),
    [reports.data, reportId],
  );

  const task = useMemo(
    () => (tasks.data ?? EMPTY_LIST).find((t) => t.reportId === report?.id),
    [tasks.data, report?.id],
  );

  const obstacle = useMemo(
    () => (obstacles.data ?? EMPTY_LIST).find((o) => o.id === report?.obstacleId),
    [obstacles.data, report?.obstacleId],
  );

  const hazard = useMemo(
    () => (hazards.data ?? EMPTY_LIST).find((h) => h.id === report?.safetyHazardId),
    [hazards.data, report?.safetyHazardId],
  );

  if (reports.isLoading) {
    return <PageLoader label="Loading report" />;
  }

  if (!report) {
    return (
      <PageBody>
        <Card>
          <CardBody>
            <EmptyState
              icon={<ClipboardList className="h-5 w-5" />}
              title="Report not found"
              description="This report may have been removed, or the link is incorrect."
              actionLabel="Back to reports"
              onAction={() => navigate('/app/reports')}
            />
          </CardBody>
        </Card>
      </PageBody>
    );
  }

  const category = REPORT_CATEGORY_META[report.category];
  const status = REPORT_STATUS_META[report.status];
  const priority = PRIORITY_META[report.priority.level];
  const canManage = user?.role === 'admin' || user?.role === 'maintenance';
  const alreadySupported = report.supporters.includes(user?.id ?? '');

  const applyStatus = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await setReportStatus({
        reportId: report.id,
        actor: user,
        status: nextStatus,
        note: note.trim() || undefined,
        teamId: nextStatus === 'assigned' ? teamId : undefined,
      });
      toast({
        kind: 'success',
        title: 'Status updated',
        description: `${report.reference} is now “${REPORT_STATUS_META[nextStatus].label}”.`,
      });
      setStatusOpen(false);
      setNote('');
    } catch (err) {
      toast({
        kind: 'error',
        title: 'Could not update status',
        description: err instanceof Error ? err.message : 'Unexpected error.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSupport = async () => {
    if (!user) return;
    try {
      await support(report.id);
      toast({
        kind: 'success',
        title: alreadySupported ? 'Support recorded' : 'Thanks for supporting',
        description: alreadySupported
          ? 'Your support is already counted for this report.'
          : 'Your support raises the priority score for this report.',
      });
    } catch (err) {
      toast({
        kind: 'error',
        title: 'Could not register support',
        description: err instanceof Error ? err.message : 'Unexpected error.',
      });
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={`${report.reference} · ${category.label}`}
        title={report.title}
        description={report.description}
        actions={
          <>
            <Link to="/app/reports">
              <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />}>
                Back
              </Button>
            </Link>
            <Button
              variant={alreadySupported ? 'secondary' : 'primary'}
              onClick={handleSupport}
              icon={<ThumbsUp className="h-4 w-4" />}
              disabled={alreadySupported}
            >
              {alreadySupported ? 'Supported' : 'Support'}{' '}
              {report.supporters.length > 0 ? `(${report.supporters.length})` : ''}
            </Button>
            {canManage ? (
              <Button onClick={() => setStatusOpen(true)} icon={<Wrench className="h-4 w-4" />}>
                Update status
              </Button>
            ) : null}
          </>
        }
      />

      <PageBody className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardBody>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color={status.color} bg={status.bg}>
                    {status.label}
                  </Badge>
                  <Badge color={priority.color} bg={priority.bg}>
                    {priority.label} priority
                  </Badge>
                  <Badge color={category.color} bg="#F1F5F9">
                    {category.label}
                  </Badge>
                  <span className="text-xs font-medium text-ink-400">
                    Reported {formatRelative(report.reportedAt)} by {report.reportedByName}
                  </span>
                </div>

                <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Address', value: report.address, icon: <MapPin className="h-3.5 w-3.5" /> },
                    { label: 'Severity', value: report.severity, icon: <ShieldAlert className="h-3.5 w-3.5" /> },
                    {
                      label: 'Residents affected',
                      value: String(report.affectedResidents),
                      icon: <Users className="h-3.5 w-3.5" />,
                    },
                    {
                      label: 'Priority score',
                      value: `${report.priority.total} pts`,
                      icon: <Flag className="h-3.5 w-3.5" />,
                    },
                  ].map((d) => (
                    <div key={d.label} className="rounded-xl bg-ink-50 p-3.5 dark:bg-white/[0.04]">
                      <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-400">
                        {d.icon}
                        {d.label}
                      </dt>
                      <dd className="mt-1 truncate text-sm font-bold capitalize text-ink-900 dark:text-white">
                        {d.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                {report.tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {report.tags.map((t) => (
                      <span key={t} className="chip">
                        #{t}
                      </span>
                    ))}
                  </div>
                ) : null}

                {report.photoUrl ? (
                  <img
                    src={report.photoUrl}
                    alt={`Evidence photo for ${report.title}`}
                    className="mt-4 h-56 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : null}
              </CardBody>
            </Card>

            {/* Priority breakdown */}
            <Card>
              <CardHeader
                icon={<Flag className="h-5 w-5" />}
                title="Priority breakdown"
                subtitle="How the automatic priority score was calculated"
              />
              <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Meter
                  label="Safety impact"
                  value={report.priority.safetyImpact}
                  suffix="/100"
                  color="#F0330F"
                />
                <Meter
                  label="Population impact"
                  value={report.priority.populationImpact}
                  suffix="/100"
                  color="#0EA5E9"
                />
                <Meter
                  label="Accessibility impact"
                  value={report.priority.accessibilityImpact}
                  suffix="/100"
                  color="#176B5B"
                />
                <Meter
                  label="Severity weight"
                  value={report.priority.severity}
                  suffix="/100"
                  color="#7C3AED"
                />
                <Meter
                  label="Age factor"
                  value={report.priority.ageFactor}
                  suffix="/100"
                  color="#F59E0B"
                />
                <Meter
                  label="Duplicate factor"
                  value={report.priority.duplicateFactor}
                  suffix="/100"
                  color="#64748B"
                />
              </CardBody>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader
                icon={<MessageSquare className="h-5 w-5" />}
                title="Activity timeline"
                subtitle={`${report.timeline.length} entries recorded against this report`}
              />
              <CardBody>
                <ol className="relative space-y-5 border-l border-ink-200 pl-6 dark:border-white/10">
                  {[...report.timeline]
                    .sort((a, b) => (a.at < b.at ? -1 : 1))
                    .map((entry) => {
                      const Icon = TIMELINE_ICONS[entry.type] ?? Flag;
                      return (
                        <li key={entry.id} className="relative">
                          <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full bg-white text-primary-600 shadow-sm ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-white/10">
                            <Icon className="h-3 w-3" />
                          </span>
                          <div className="rounded-xl border border-ink-100 p-3.5 dark:border-white/10">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-bold capitalize text-ink-900 dark:text-white">
                                {entry.type.replace(/_/g, ' ')}
                              </p>
                              {entry.status ? (
                                <Badge
                                  color={REPORT_STATUS_META[entry.status].color}
                                  bg={REPORT_STATUS_META[entry.status].bg}
                                >
                                  {REPORT_STATUS_META[entry.status].label}
                                </Badge>
                              ) : null}
                              <span className="ml-auto text-[10px] font-medium text-ink-400">
                                {formatDateTime(entry.at)}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
                              {entry.note}
                            </p>
                            <p className="mt-1.5 text-[10px] font-semibold text-ink-400">
                              {entry.actorName} · {entry.actorRole}
                            </p>
                            {entry.photoUrl ? (
                              <img
                                src={entry.photoUrl}
                                alt="Repair evidence"
                                className="mt-2.5 h-36 w-full rounded-lg object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                </ol>
              </CardBody>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="h-56">
                <TownshipMap
                  layers={{ routes: true, issues: true, hazards: false, stations: false }}
                  reports={[report]}
                  obstacles={obstacle ? [obstacle] : []}
                  hazards={hazard ? [hazard] : []}
                  stations={[]}
                  center={report.position}
                  zoom={17}
                  showAttribution={false}
                />
              </div>
              <CardBody>
                <p className="flex items-center gap-1.5 text-xs font-bold text-ink-800 dark:text-ink-100">
                  <MapPin className="h-3.5 w-3.5" />
                  {report.address}
                </p>
                <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-400">
                  {report.position.lat.toFixed(5)}, {report.position.lng.toFixed(5)}
                </p>
              </CardBody>
            </Card>

            {/* Linked module records */}
            <Card>
              <CardHeader
                icon={<Bell className="h-5 w-5" />}
                title="Linked module records"
                subtitle="One report, shared across every module"
              />
              <CardBody className="space-y-2.5">
                {obstacle ? (
                  <Link
                    to="/app/navigation"
                    className="flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50/50 p-3 transition hover:border-primary-400 dark:border-primary-500/30 dark:bg-primary-500/10"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-600 text-white">
                      <Accessibility className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-900 dark:text-white">AccessAble obstacle</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-500 dark:text-ink-400">
                        {obstacle.title}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold text-primary-700 dark:text-primary-300">
                        {obstacle.status} · severity {Math.round(obstacle.severity * 100)}%
                      </p>
                    </div>
                  </Link>
                ) : null}

                {hazard ? (
                  <Link
                    to={`/app/safety/${hazard.id}`}
                    className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3 transition hover:border-amber-400 dark:border-amber-500/30 dark:bg-amber-500/10"
                  >
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white"
                      style={{ backgroundColor: HAZARD_TYPE_META[hazard.type].color }}
                    >
                      <ShieldAlert className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-900 dark:text-white">SafeSpot hazard</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-500 dark:text-ink-400">
                        {hazard.title}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                        {hazard.status} · risk {hazard.riskScore}/100
                      </p>
                    </div>
                  </Link>
                ) : null}

                {task ? (
                  <Link
                    to="/app/tasks"
                    className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/50 p-3 transition hover:border-sky-400 dark:border-sky-500/30 dark:bg-sky-500/10"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-600 text-white">
                      <Wrench className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-900 dark:text-white">Maintenance task</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-500 dark:text-ink-400">
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                        {task.status.replace(/_/g, ' ')}
                        {task.assigneeName ? ` · ${task.assigneeName}` : ''}
                      </p>
                    </div>
                  </Link>
                ) : null}

                {!obstacle && !hazard && !task ? (
                  <EmptyState
                    icon={<Bell className="h-5 w-5" />}
                    title="No linked records"
                    description="This report has not yet been escalated to another module."
                  />
                ) : null}
              </CardBody>
            </Card>

            {/* Duplicates */}
            {report.potentialDuplicates.length > 0 ? (
              <Card>
                <CardHeader
                  icon={<Copy className="h-5 w-5" />}
                  title="Possible duplicates"
                  subtitle="Similar reports nearby — consider merging"
                />
                <CardBody className="space-y-2">
                  {report.potentialDuplicates.map((dupId) => {
                    const dup = (reports.data ?? EMPTY_LIST).find((r) => r.id === dupId);
                    if (!dup) return null;
                    return (
                      <Link
                        key={dupId}
                        to={`/app/reports/${dup.id}`}
                        className="block rounded-xl border border-ink-100 p-3 transition hover:border-primary-300 dark:border-white/10"
                      >
                        <p className="text-xs font-bold text-ink-800 dark:text-ink-100">{dup.title}</p>
                        <p className="mt-0.5 text-[10px] text-ink-400">
                          {dup.reference} · {dup.address}
                        </p>
                      </Link>
                    );
                  })}
                </CardBody>
              </Card>
            ) : null}

            {/* Status pipeline */}
            <Card>
              <CardHeader
                icon={<ClipboardList className="h-5 w-5" />}
                title="Status pipeline"
                subtitle="Where this report sits in the workflow"
              />
              <CardBody>
                <ol className="space-y-2">
                  {STATUS_FLOW.map((s) => {
                    const meta = REPORT_STATUS_META[s];
                    const done = meta.order <= REPORT_STATUS_META[report.status].order;
                    const current = s === report.status;
                    return (
                      <li key={s} className="flex items-center gap-3">
                        <span
                          className={cn(
                            'h-2.5 w-2.5 shrink-0 rounded-full',
                            current
                              ? 'ring-4 ring-primary-200 dark:ring-primary-500/20'
                              : done
                                ? 'bg-emerald-500'
                                : 'bg-ink-200 dark:bg-white/15',
                          )}
                          style={current ? { backgroundColor: meta.color } : undefined}
                        />
                        <span
                          className={cn(
                            'text-xs font-semibold',
                            current ? 'text-ink-900 dark:text-white' : 'text-ink-500 dark:text-ink-400',
                          )}
                        >
                          {meta.label}
                        </span>
                        {current ? (
                          <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-primary-600 dark:text-primary-300">
                            Current
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </CardBody>
            </Card>
          </div>
        </div>
      </PageBody>

      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Update report status"
        description="Changing the status writes an entry to the shared timeline and notifies the reporter."
        icon={<Wrench className="h-5 w-5" />}
        footer={
          <>
            <Button variant="ghost" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyStatus} loading={busy}>
              Apply update
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="New status"
            value={nextStatus}
            onChange={(v) => setNextStatus(v as ReportStatus)}
            options={(
              ['pending', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected'] as ReportStatus[]
            ).map((s) => ({ value: s, label: REPORT_STATUS_META[s].label }))}
          />

          {nextStatus === 'assigned' ? (
            <Select
              label="Assign to team"
              value={teamId}
              onChange={setTeamId}
              options={MAINTENANCE_TEAMS.map((t) => ({
                value: t.id,
                label: `${t.name} — ${t.specialty.join(', ')}`,
              }))}
              hint="The team appears in the maintenance workspace immediately."
            />
          ) : null}

          <div>
            <label htmlFor="status-note" className="label">
              Note for the timeline
            </label>
            <textarea
              id="status-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe what changed, what was inspected or what happens next…"
              className="input"
            />
          </div>

          <p className="rounded-xl bg-ink-50 p-3 text-[11px] leading-relaxed text-ink-500 dark:bg-white/[0.04] dark:text-ink-400">
            Marking this report as <strong className="text-ink-700 dark:text-ink-200">resolved</strong>{' '}
            will automatically close any linked safety hazard and accessibility obstacle, re-opening the
            affected route segments.
          </p>
        </div>
      </Modal>
    </div>
  );
}
