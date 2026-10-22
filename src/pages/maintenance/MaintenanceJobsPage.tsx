import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  HardHat,
  MapPin,
  Users,
  Wrench,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { EmptyState } from '@/components/common/EmptyState';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelative } from '@/utils/constants';
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

type OwnershipFilter = 'mine' | 'team';
type StatusTab = 'to_start' | 'in_progress' | 'blocked' | 'awaiting_verification' | 'closed';

export function MaintenanceJobsPage() {
  const { tasks, reports } = useTownshipData();
  const { user } = useAuth();

  const [ownership, setOwnership] = useState<OwnershipFilter>('mine');
  const [tab, setTab] = useState<StatusTab>('to_start');

  const all = tasks.data ?? EMPTY_LIST;

  const filtered = useMemo(() => {
    let list = [...all];
    if (ownership === 'mine') {
      list = list.filter((t) => t.assigneeId === user?.id);
    } else {
      list = list.filter((t) => t.teamId === user?.teamId && t.assigneeId !== user?.id);
    }

    if (tab === 'to_start') {
      list = list.filter((t) => t.status === 'open' || t.status === 'accepted');
    } else if (tab === 'in_progress') {
      list = list.filter((t) => t.status === 'in_progress');
    } else if (tab === 'blocked') {
      list = list.filter((t) => (t as any).blocked);
    } else if (tab === 'awaiting_verification') {
      list = list.filter((t) => t.status === 'awaiting_verification');
    } else if (tab === 'closed') {
      list = list.filter((t) => t.status === 'completed');
    }

    return list.sort((a, b) => {
      const priority: Record<MaintenanceTask['status'], number> = {
        in_progress: 0,
        open: 1,
        accepted: 1,
        awaiting_verification: 2,
        completed: 3,
      };
      return priority[a.status] - priority[b.status];
    });
  }, [all, ownership, tab, user?.id, user?.teamId]);

  const reportById = useMemo(() => {
    const map = new Map<string, Report>();
    (reports.data ?? EMPTY_LIST).forEach((r) => map.set(r.id, r));
    return map;
  }, [reports.data]);

  const counts = useMemo(() => {
    const base = ownership === 'mine' ? all.filter((t) => t.assigneeId === user?.id) : all.filter((t) => t.teamId === user?.teamId && t.assigneeId !== user?.id);
    return {
      to_start: base.filter((t) => t.status === 'open' || t.status === 'accepted').length,
      in_progress: base.filter((t) => t.status === 'in_progress').length,
      blocked: base.filter((t) => (t as any).blocked).length,
      awaiting_verification: base.filter((t) => t.status === 'awaiting_verification').length,
      closed: base.filter((t) => t.status === 'completed').length,
    };
  }, [all, ownership, user?.id, user?.teamId]);

  const getAction = (task: MaintenanceTask) => {
    if ((task as any).needsCorrection) return 'View feedback / Continue repair';
    if (task.status === 'in_progress') return 'Add progress';
    if (task.status === 'awaiting_verification') return 'View submission';
    if (task.status === 'open' || task.status === 'accepted') return 'Start work';
    if (task.status === 'completed') return 'View completed job';
    return 'View job';
  };

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance Staff"
        title="My Jobs"
        description="Active jobs assigned to you or your team."
      />

      <PageBody className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            value={ownership}
            onChange={(v) => setOwnership(v as OwnershipFilter)}
            options={[
              { value: 'mine', label: 'Mine' },
              { value: 'team', label: 'My team' },
            ]}
          />
        </div>

        <SegmentedControl
          value={tab}
          onChange={(v) => setTab(v as StatusTab)}
          options={[
            { value: 'to_start', label: `To start (${counts.to_start})` },
            { value: 'in_progress', label: `In progress (${counts.in_progress})` },
            { value: 'blocked', label: `Blocked (${counts.blocked})` },
            { value: 'awaiting_verification', label: `Awaiting verification (${counts.awaiting_verification})` },
            { value: 'closed', label: `Closed (${counts.closed})` },
          ]}
        />

        <Card>
          <CardHeader
            icon={<HardHat className="h-5 w-5" />}
            title="Jobs"
            subtitle={`${filtered.length} job(s)`}
          />
          <CardBody>
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Wrench className="h-5 w-5" />}
                title="No jobs in this view"
                description="Try changing filters or ownership."
              />
            ) : (
              <div className="space-y-2.5">
                {filtered.map((task, i) => {
                  const status = STATUS_META[task.status];
                  const report = reportById.get(task.reportId);
                  const needsCorrection = (task as any).needsCorrection;
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/10"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-ink-900 dark:text-white">{task.title}</p>
                          <Badge color={status.color} bg={status.bg}>{status.label}</Badge>
                          {needsCorrection ? <Badge color="#DC2626" bg="#FEE2E2">Needs correction</Badge> : null}
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
                          {report?.priority?.level ? (
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <AlertTriangle className="h-3 w-3" />
                              {report.priority.level} priority
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <Link to={`/app/maintenance/jobs/${task.id}`}>
                        <Button size="sm" variant="secondary" icon={<ArrowRight className="h-3.5 w-3.5" />}>
                          {getAction(task)}
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
