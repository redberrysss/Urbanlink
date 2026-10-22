import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Clock,
  HardHat,
  MapPin,
  PlayCircle,
  Users,
  Wrench,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { MAINTENANCE_TEAMS } from '@/data/seed';
import { formatRelative, formatDate } from '@/utils/constants';
import type { MaintenanceTask, Report } from '@/types';
import { EMPTY_LIST } from '@/utils/empty';

const STATUS_META: Record<
  MaintenanceTask['status'],
  { label: string; color: string; bg: string }
> = {
  open: { label: 'To start', color: '#B45309', bg: '#FEF3C7' },
  accepted: { label: 'To start', color: '#B45309', bg: '#FEF3C7' },
  in_progress: { label: 'In progress', color: '#C2410C', bg: '#FFEDD5' },
  awaiting_verification: { label: 'Awaiting verification', color: '#7C3AED', bg: '#EDE9FE' },
  completed: { label: 'Closed', color: '#047857', bg: '#D1FAE5' },
};

export function MaintenanceTodayPage() {
  const { tasks, reports } = useTownshipData();
  const { user } = useAuth();

  const all = tasks.data ?? EMPTY_LIST;
  const userTeam = user?.teamId ? MAINTENANCE_TEAMS.find((t) => t.id === user.teamId) : null;

  const myTasks = useMemo(
    () => all.filter((t) => t.assigneeId === user?.id || t.teamId === user?.teamId),
    [all, user?.id, user?.teamId],
  );

  const counters = useMemo(
    () => ({
      toStart: myTasks.filter((t) => t.status === 'open' || t.status === 'accepted').length,
      inProgress: myTasks.filter((t) => t.status === 'in_progress').length,
      blocked: myTasks.filter((t) => (t as any).blocked).length, // placeholder
      awaitingVerification: myTasks.filter((t) => t.status === 'awaiting_verification').length,
    }),
    [myTasks],
  );

  const reportById = useMemo(() => {
    const map = new Map<string, Report>();
    (reports.data ?? EMPTY_LIST).forEach((r) => map.set(r.id, r));
    return map;
  }, [reports.data]);

  const sorted = useMemo(() => {
    const list = [...myTasks];
    return list.sort((a, b) => {
      // Prioritize in progress, then by overdue-like behavior
      const priority: Record<MaintenanceTask['status'], number> = {
        in_progress: 0,
        open: 1,
        accepted: 1,
        awaiting_verification: 2,
        completed: 3,
      };
      return priority[a.status] - priority[b.status];
    });
  }, [myTasks]);

  const currentJob = myTasks.find((t) => t.status === 'in_progress');

  const today = formatDate(new Date().toISOString());

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance Staff"
        title="My Work Today"
        description={`${user?.name ?? 'Staff'}${userTeam ? ` · ${userTeam.name}` : ''} · ${today}`}
      />

      <PageBody className="space-y-6">
        {/* Counters */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { key: 'toStart', label: 'To start', value: counters.toStart, color: '#B45309' },
            { key: 'inProgress', label: 'In progress', value: counters.inProgress, color: '#C2410C' },
            { key: 'blocked', label: 'Blocked', value: counters.blocked, color: '#DC2626' },
            { key: 'awaitingVerification', label: 'Awaiting verification', value: counters.awaitingVerification, color: '#7C3AED' },
          ].map((c) => (
            <Card key={c.key}>
              <CardBody>
                <Link
                  to="/app/maintenance/jobs"
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{c.label}</p>
                    <p className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-white">{c.value}</p>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Current job */}
        {currentJob ? (
          <Card className="border-primary-200 dark:border-primary-500/30">
            <CardHeader
              icon={<PlayCircle className="h-5 w-5" />}
              title="Continue work"
              subtitle="Job currently in progress"
            />
            <CardBody>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-base font-bold text-ink-900 dark:text-white">{currentJob.title}</p>
                  {reportById.get(currentJob.reportId)?.address ? (
                    <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {reportById.get(currentJob.reportId)?.address}
                    </p>
                  ) : null}
                </div>
                <Link to={`/app/maintenance/jobs/${currentJob.id}`}>
                  <Button icon={<ArrowRight className="h-4 w-4" />}>
                    Resume work
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : null}

        {/* Today's assigned jobs */}
        <Card>
          <CardHeader
            icon={<HardHat className="h-5 w-5" />}
            title="Today's assigned jobs"
            subtitle={`${sorted.length} job(s) assigned to you or your team`}
            action={
              <Link to="/app/maintenance/jobs">
                <Button variant="ghost" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
                  View all
                </Button>
              </Link>
            }
          />
          <CardBody>
            {sorted.length === 0 ? (
              <EmptyState
                icon={<Wrench className="h-5 w-5" />}
                title="No jobs assigned today"
                description="You're all caught up for now."
              />
            ) : (
              <div className="space-y-2.5">
                {sorted.slice(0, 10).map((task, i) => {
                  const status = STATUS_META[task.status];
                  const report = reportById.get(task.reportId);
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-3 dark:border-white/10"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-ink-900 dark:text-white">{task.title}</p>
                          <Badge color={status.color} bg={status.bg}>{status.label}</Badge>
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-ink-500">
                          {report?.address ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {report.address}
                            </span>
                          ) : null}
                          {task.scheduledFor ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due {formatRelative(task.scheduledFor)}
                            </span>
                          ) : null}
                          {task.assigneeName ? (
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {task.assigneeName}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <Link to={`/app/maintenance/jobs/${task.id}`}>
                        <Button size="sm" variant="secondary">
                          {task.status === 'in_progress' ? 'Add progress' : task.status === 'awaiting_verification' ? 'View submission' : task.status === 'open' || task.status === 'accepted' ? 'Start work' : 'View job'}
                        </Button>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
