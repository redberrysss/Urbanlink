import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Users, Wrench, Camera, AlertTriangle } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { formatDateTime, formatRelative } from '@/utils/constants';
import { EMPTY_LIST } from '@/utils/empty';

export function MaintenanceJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { tasks, reports, hazards } = useTownshipData();

  const task = (tasks.data ?? EMPTY_LIST).find((t) => t.id === jobId);
  const report = task ? (reports.data ?? EMPTY_LIST).find((r) => r.id === task.reportId) : undefined;
  const linkedHazards = hazards.data?.filter((h) => h.reportId === report?.id) ?? [];

  const getNextAction = () => {
    if (!task) return null;
    if ((task as any).needsCorrection) return { label: 'View feedback / Continue repair' };
    if (task.status === 'open' || task.status === 'accepted') return { label: 'Start work' };
    if (task.status === 'in_progress') return { label: 'Add progress' };
    if (task.status === 'awaiting_verification') return { label: 'View submission' };
    if (task.status === 'completed') return { label: 'View completed job' };
    return { label: 'View job' };
  };

  const next = getNextAction();

  if (!task) {
    return (
      <div>
        <PageHeader title="Job not found" description="The requested job could not be located." />
        <PageBody>
          <Link to="/app/maintenance/jobs">
            <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />}>Back to jobs</Button>
          </Link>
        </PageBody>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance Job"
        title={task.title}
        description={report?.address ?? 'Location details'}
        actions={
          <Link to="/app/maintenance/jobs">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>Back to jobs</Button>
          </Link>
        }
      />

      <PageBody className="space-y-6">
        <Card>
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Priority</p>
                <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">{report?.priority?.level ?? 'medium'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Due time</p>
                <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">{task.scheduledFor ? formatRelative(task.scheduledFor) : 'Not scheduled'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Status</p>
                <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">{task.status.replace('_', ' ')}</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Full location</p>
                <p className="mt-1 text-sm text-ink-900 dark:text-white">{report?.address ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Assigned</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-ink-900 dark:text-white">
                  {task.assigneeName ? <><User className="h-3.5 w-3.5" />{task.assigneeName}</> : task.teamId ? <><Users className="h-3.5 w-3.5" />Team</> : 'Unassigned'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="lg" className="flex-1 sm:flex-none">{next?.label ?? 'View job'}</Button>
              <Button variant="secondary" size="lg">Get directions</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader icon={<Wrench className="h-5 w-5" />} title="Problem description" />
          <CardBody>
            <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">{report?.description ?? 'No description provided.'}</p>
            {report?.photoUrl ? (
              <img src={report.photoUrl} alt="Report" className="mt-4 max-h-80 rounded-xl object-cover" />
            ) : (
              <p className="mt-4 text-sm text-ink-400">No report photo available</p>
            )}
          </CardBody>
        </Card>

        {linkedHazards.length > 0 ? (
          <Card>
            <CardHeader icon={<AlertTriangle className="h-5 w-5" />} title="Relevant hazards" />
            <CardBody className="space-y-2">
              {linkedHazards.map((h) => (
                <div key={h.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{h.title}</p>
                  <p className="mt-1 text-xs text-ink-600 dark:text-ink-300">This defect blocks wheelchair access or affects safety.</p>
                </div>
              ))}
            </CardBody>
          </Card>
        ) : null}

        <Card>
          <CardHeader icon={<Camera className="h-5 w-5" />} title="Work evidence" />
          <CardBody>
            {task.evidence.length === 0 ? (
              <p className="text-sm text-ink-400">No evidence submitted yet.</p>
            ) : (
              <div className="space-y-2">
                {task.evidence.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 rounded-lg border border-ink-100 p-3 dark:border-white/10">
                    {e.photoUrl ? <img src={e.photoUrl} alt="" className="h-16 w-16 rounded-lg object-cover" /> : null}
                    <div>
                      <p className="text-sm font-semibold text-ink-900 dark:text-white">{e.kind === 'completion' ? 'Completion submission' : 'Progress update'}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{e.uploadedByName} · {formatDateTime(e.uploadedAt)}</p>
                      <p className="mt-1 text-sm text-ink-700 dark:text-ink-300">{e.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </PageBody>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-ink-200 bg-white p-3 md:hidden dark:border-white/10 dark:bg-ink-900">
        <Button className="w-full" size="lg">{next?.label ?? 'View job'}</Button>
      </div>
    </div>
  );
}
