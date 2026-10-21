import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Camera,
  CheckCircle2,
  Clock,
  HardHat,
  PlayCircle,
  Users,
  Wrench,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { EmptyState } from '@/components/common/EmptyState';
import { ImageUploader, type UploadedImage } from '@/components/common/ImageUploader';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/common/Toast';
import { MAINTENANCE_TEAMS } from '@/data/seed';
import { formatRelative } from '@/utils/constants';
import type { MaintenanceTask, Report } from '@/types';
import { cn } from '@/utils/cn';

import { EMPTY_LIST } from '@/utils/empty';
const STATUS_META: Record<
  MaintenanceTask['status'],
  { label: string; color: string; bg: string }
> = {
  open: { label: 'Open', color: '#B45309', bg: '#FEF3C7' },
  accepted: { label: 'Accepted', color: '#0369A1', bg: '#E0F2FE' },
  in_progress: { label: 'In Progress', color: '#C2410C', bg: '#FFEDD5' },
  awaiting_verification: { label: 'Awaiting Verification', color: '#7C3AED', bg: '#EDE9FE' },
  completed: { label: 'Completed', color: '#047857', bg: '#D1FAE5' },
};

export function TasksPage() {
  const { tasks, reports, addEvidence } = useTownshipData();
  const { user } = useAuth();
  const { toast } = useToast();

  const [filter, setFilter] = useState<'all' | 'mine' | 'active' | 'completed'>('all');
  const [evidenceTarget, setEvidenceTarget] = useState<MaintenanceTask | null>(null);
  const [kind, setKind] = useState<'progress' | 'completion'>('progress');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<UploadedImage | null>(null);
  const [laborMinutes, setLaborMinutes] = useState(30);
  const [busy, setBusy] = useState(false);

  const all = tasks.data ?? EMPTY_LIST;

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter === 'mine') {
      list = list.filter((t) => t.assigneeId === user?.id || t.teamId === user?.teamId);
    }
    if (filter === 'active') list = list.filter((t) => t.status !== 'completed');
    if (filter === 'completed') list = list.filter((t) => t.status === 'completed');
    return list.sort((a, b) => {
      const order: MaintenanceTask['status'][] = [
        'in_progress',
        'accepted',
        'awaiting_verification',
        'open',
        'completed',
      ];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });
  }, [all, filter, user?.id, user?.teamId]);

  const reportById = useMemo(() => {
    const map = new Map<string, Report>();
    (reports.data ?? EMPTY_LIST).forEach((r) => map.set(r.id, r));
    return map;
  }, [reports.data]);

  const counts = useMemo(
    () => ({
      all: all.length,
      mine: all.filter((t) => t.assigneeId === user?.id || t.teamId === user?.teamId).length,
      active: all.filter((t) => t.status !== 'completed').length,
      completed: all.filter((t) => t.status === 'completed').length,
    }),
    [all, user?.id, user?.teamId],
  );

  const submitEvidence = async () => {
    if (!evidenceTarget || !user) return;
    setBusy(true);
    try {
      await addEvidence({
        taskId: evidenceTarget.id,
        actor: user,
        note: note.trim() || 'Progress recorded on site.',
        photoUrl: photo?.dataUrl,
        kind,
        laborMinutes,
      });
      toast({
        kind: 'success',
        title: kind === 'completion' ? 'Work submitted for verification' : 'Progress recorded',
        description:
          kind === 'completion'
            ? 'The township office will verify the repair and close the linked report.'
            : 'The report timeline now shows your update.',
      });
      setEvidenceTarget(null);
      setNote('');
      setPhoto(null);
    } catch (err) {
      toast({
        kind: 'error',
        title: 'Could not save the evidence',
        description: err instanceof Error ? err.message : 'Unexpected error.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="FixMyTown · Maintenance Workspace"
        title="Maintenance tasks"
        description="Assigned repairs, on-site progress and photographic evidence. Submitting completion sends the linked report for verification."
      />

      <PageBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              { key: 'all' as const, label: 'All tasks', value: counts.all, color: '#176B5B' },
              { key: 'mine' as const, label: 'Assigned to me', value: counts.mine, color: '#0EA5E9' },
              { key: 'active' as const, label: 'Active', value: counts.active, color: '#FB5A36' },
              { key: 'completed' as const, label: 'Completed', value: counts.completed, color: '#047857' },
            ]
          ).map((c) => (
            <Card key={c.key}>
              <CardBody>
                <button
                  type="button"
                  onClick={() => setFilter(c.key)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{c.label}</p>
                    <p className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-white">
                      {c.value}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      filter === c.key ? 'ring-4 ring-primary-200 dark:ring-primary-500/20' : 'opacity-30',
                    )}
                    style={{ backgroundColor: c.color }}
                  />
                </button>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader
            icon={<HardHat className="h-5 w-5" />}
            title="Task queue"
            subtitle={`${filtered.length} tasks`}
            action={
              <SegmentedControl
                value={filter}
                onChange={setFilter}
                size="sm"
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'mine', label: 'Mine' },
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Done' },
                ]}
              />
            }
          />
          <CardBody>
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Wrench className="h-5 w-5" />}
                title="No tasks in this view"
                description="Tasks are created when a report is assigned to a maintenance team."
              />
            ) : (
              <div className="space-y-3">
                {filtered.map((task, i) => {
                  const status = STATUS_META[task.status];
                  const report = reportById.get(task.reportId);
                  const team = MAINTENANCE_TEAMS.find((t) => t.id === task.teamId);
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                      className="rounded-xl border border-ink-100 p-4 dark:border-white/10"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-ink-900 dark:text-white">{task.title}</p>
                            <Badge color={status.color} bg={status.bg}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500 dark:text-ink-400">
                            {team ? (
                              <span className="inline-flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {team.name}
                              </span>
                            ) : null}
                            {task.assigneeName ? (
                              <span className="inline-flex items-center gap-1">
                                <HardHat className="h-3 w-3" />
                                {task.assigneeName}
                              </span>
                            ) : null}
                            {task.scheduledFor ? (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                scheduled {formatRelative(task.scheduledFor)}
                              </span>
                            ) : null}
                          </p>
                          {report ? (
                            <Link
                              to={`/app/reports/${report.id}`}
                              className="mt-1.5 inline-block text-[11px] font-bold text-primary-600 hover:underline dark:text-primary-300"
                            >
                              {report.reference} · {report.title}
                            </Link>
                          ) : null}
                          {task.notes.length > 0 ? (
                            <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                              {task.notes[task.notes.length - 1]}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          {task.evidence.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ink-400">
                              <Camera className="h-3.5 w-3.5" />
                              {task.evidence.length} evidence
                            </span>
                          ) : null}
                          {task.status !== 'completed' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<PlayCircle className="h-3.5 w-3.5" />}
                              onClick={() => {
                                setEvidenceTarget(task);
                                setKind(task.status === 'awaiting_verification' ? 'completion' : 'progress');
                                setNote('');
                                setPhoto(null);
                              }}
                            >
                              {task.status === 'awaiting_verification' ? 'Submit proof' : 'Add update'}
                            </Button>
                          ) : (
                            <Badge color="#047857" bg="#D1FAE5" icon={<CheckCircle2 className="h-3 w-3" />}>
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>

                      {task.evidence.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-100 pt-3 dark:border-white/10">
                          {task.evidence.slice(-3).map((e) => (
                            <div key={e.id} className="flex items-center gap-2 rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-white/[0.04]">
                              {e.photoUrl ? (
                                <img
                                  src={e.photoUrl}
                                  alt={e.note}
                                  className="h-8 w-8 rounded object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="grid h-8 w-8 place-items-center rounded bg-ink-100 text-ink-500 dark:bg-white/10">
                                  <Camera className="h-3.5 w-3.5" />
                                </span>
                              )}
                              <div className="max-w-[220px]">
                                <p className="truncate text-[10px] font-bold text-ink-700 dark:text-ink-200">
                                  {e.kind === 'completion' ? 'Completion' : 'Progress'} ·{' '}
                                  {e.uploadedByName}
                                </p>
                                <p className="truncate text-[10px] text-ink-400">{e.note}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </PageBody>

      <Modal
        open={Boolean(evidenceTarget)}
        onClose={() => setEvidenceTarget(null)}
        title={kind === 'completion' ? 'Submit completion evidence' : 'Record progress'}
        description="Photographic evidence is attached to the shared report timeline for verification."
        icon={<Camera className="h-5 w-5" />}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEvidenceTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submitEvidence} loading={busy}>
              Save evidence
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <SegmentedControl
            value={kind}
            onChange={setKind}
            options={[
              { value: 'progress', label: 'Progress update' },
              { value: 'completion', label: 'Work completed' },
            ]}
          />

          <div>
            <label htmlFor="task-note" className="label">
              Notes
            </label>
            <textarea
              id="task-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe the work carried out, materials used and any follow-up needed…"
              className="input"
            />
          </div>

          <div>
            <span className="label">Evidence photo</span>
            <ImageUploader
              value={photo}
              onChange={setPhoto}
              label="Add a photo"
              hint="A clear photo of the completed repair is required for verification."
            />
          </div>

          <div>
            <label htmlFor="labor" className="label">
              Labour time (minutes)
            </label>
            <input
              id="labor"
              type="number"
              min={0}
              step={5}
              value={laborMinutes}
              onChange={(e) => setLaborMinutes(Number(e.target.value))}
              className="input"
            />
            <p className="hint">Used for the maintenance performance metrics.</p>
          </div>

          {evidenceTarget ? (
            <p className="rounded-xl bg-ink-50 p-3 text-[11px] leading-relaxed text-ink-500 dark:bg-white/[0.04] dark:text-ink-400">
              {kind === 'completion'
                ? 'Submitting completion moves the task to “Awaiting verification”. The township admin then verifies the repair and closes the linked report, hazard and obstacle.'
                : 'Progress updates are appended to the report timeline so residents and managers can follow the repair.'}
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
