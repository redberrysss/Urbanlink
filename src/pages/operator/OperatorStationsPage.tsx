import { Recycle } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { EMPTY_LIST } from '@/utils/empty';

export function OperatorStationsPage() {
  const { stations } = useTownshipData();
  const { user } = useAuth();
  const myStations = (stations.data ?? EMPTY_LIST).filter((s) => s.operatorId === user?.id);

  return (
    <div>
      <PageHeader
        eyebrow="RecycleMate · Operator Workspace"
        title="My Stations"
        description="Manage assigned recycling stations."
      />
      <PageBody>
        <Card>
          <CardHeader icon={<Recycle className="h-5 w-5" />} title="Stations" subtitle={`${myStations.length} assigned`} />
          <CardBody className="space-y-2">
            {myStations.map((s) => {
              const pct = s.capacityKg > 0 ? Math.round((s.currentKg / s.capacityKg) * 100) : 0;
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/10">
                  <div>
                    <p className="text-sm font-bold text-ink-900 dark:text-white">{s.name}</p>
                    <p className="text-xs text-ink-500">{s.address}</p>
                    <p className="mt-1 text-xs text-ink-600 dark:text-ink-300">Status: {s.status} · {pct}% full ({s.currentKg} / {s.capacityKg} kg)</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary">Update capacity</Button>
                    <Button size="sm" variant="secondary">Request collection</Button>
                    <Button size="sm" variant="secondary">Report station fault</Button>
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
