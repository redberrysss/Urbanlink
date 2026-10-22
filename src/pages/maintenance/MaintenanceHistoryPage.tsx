import { History } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { EMPTY_LIST } from '@/utils/empty';
import { formatDateTime } from '@/utils/constants';

export function MaintenanceHistoryPage() {
  const { tasks } = useTownshipData();
  const { user } = useAuth();
  const completed = (tasks.data ?? EMPTY_LIST).filter((t) => t.assigneeId === user?.id && t.status === 'completed');

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance Staff"
        title="Work History"
        description="Completed jobs, repair submissions, and verification outcomes."
      />
      <PageBody>
        <Card>
          <CardHeader icon={<History className="h-5 w-5" />} title="Completed work" subtitle={`${completed.length} item(s)`} />
          <CardBody className="space-y-2">
            {completed.map((t) => (
              <div key={t.id} className="rounded-lg border border-ink-100 p-3 dark:border-white/10">
                <p className="text-sm font-semibold text-ink-900 dark:text-white">{t.title}</p>
                {t.completedAt ? <p className="mt-0.5 text-xs text-ink-500">Completed {formatDateTime(t.completedAt)}</p> : null}
              </div>
            ))}
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
