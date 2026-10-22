import { MapPin } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { EMPTY_LIST } from '@/utils/empty';

export function MaintenanceMapPage() {
  const { tasks, reports } = useTownshipData();
  const { user } = useAuth();
  const myTasks = (tasks.data ?? EMPTY_LIST).filter((t) => t.assigneeId === user?.id || t.teamId === user?.teamId);
  const reportById = new Map((reports.data ?? EMPTY_LIST).map((r) => [r.id, r]));

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance Staff"
        title="Job Map"
        description="Assigned jobs and relevant hazards on the map."
      />
      <PageBody className="space-y-6">
        <Card>
          <CardHeader icon={<MapPin className="h-5 w-5" />} title="Assigned locations" subtitle={`${myTasks.length} job(s)`} />
          <CardBody>
            <div className="space-y-2">
              {myTasks.map((t) => {
                const r = reportById.get(t.reportId);
                return (
                  <div key={t.id} className="rounded-lg border border-ink-100 p-3 dark:border-white/10">
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">{t.title}</p>
                    {r?.address ? <p className="mt-0.5 text-xs text-ink-500">{r.address}</p> : null}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
