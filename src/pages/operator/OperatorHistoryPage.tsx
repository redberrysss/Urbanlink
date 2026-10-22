import { History } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { EMPTY_LIST } from '@/utils/empty';
import { formatDateTime } from '@/utils/constants';

export function OperatorHistoryPage() {
  const { activities, stations } = useTownshipData();
  const { user } = useAuth();
  const myStations = (stations.data ?? EMPTY_LIST).filter((s) => s.operatorId === user?.id);
  const stationIds = new Set(myStations.map((s) => s.id));
  const history = (activities.data ?? EMPTY_LIST).filter((a) => stationIds.has(a.stationId) && a.status !== 'pending');

  return (
    <div>
      <PageHeader
        eyebrow="RecycleMate · Operator Workspace"
        title="History"
        description="Verification decisions and collection records."
      />
      <PageBody>
        <Card>
          <CardHeader icon={<History className="h-5 w-5" />} title="Activity history" subtitle={`${history.length} item(s)`} />
          <CardBody className="space-y-2">
            {history.map((a) => (
              <div key={a.id} className="rounded-lg border border-ink-100 p-3 dark:border-white/10">
                <p className="text-sm font-semibold text-ink-900 dark:text-white">{a.userName} · {a.weightKg} kg {a.material} · {a.status}</p>
                <p className="text-xs text-ink-500">{a.stationName}{a.verifiedAt ? ` · ${formatDateTime(a.verifiedAt)}` : ''}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
