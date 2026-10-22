import { User } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { EMPTY_LIST } from '@/utils/empty';

export function OperatorProfilePage() {
  const { user } = useAuth();
  const { stations } = useTownshipData();
  const myStations = (stations.data ?? EMPTY_LIST).filter((s) => s.operatorId === user?.id);

  return (
    <div>
      <PageHeader
        eyebrow="RecycleMate · Operator Workspace"
        title="Operator Profile"
        description="Account and work details."
      />
      <PageBody>
        <Card>
          <CardHeader icon={<User className="h-5 w-5" />} title="Profile" />
          <CardBody className="space-y-2">
            <p className="text-sm text-ink-900 dark:text-white"><span className="font-semibold">Name:</span> {user?.name}</p>
            <p className="text-sm text-ink-900 dark:text-white"><span className="font-semibold">Role:</span> {user?.role}</p>
            <p className="text-sm text-ink-900 dark:text-white"><span className="font-semibold">Organisation:</span> RecycleMate</p>
            <p className="text-sm text-ink-900 dark:text-white"><span className="font-semibold">Work contact:</span> {user?.phone ?? '—'}</p>
            <p className="text-sm text-ink-900 dark:text-white"><span className="font-semibold">Assigned stations:</span> {myStations.map((s) => s.name).join(', ') || '—'}</p>
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
