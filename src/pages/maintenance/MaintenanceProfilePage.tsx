import { User } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { useAuth } from '@/contexts/AuthContext';
import { MAINTENANCE_TEAMS } from '@/data/seed';

export function MaintenanceProfilePage() {
  const { user } = useAuth();
  const team = user?.teamId ? MAINTENANCE_TEAMS.find((t) => t.id === user.teamId) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance Staff"
        title="Staff Profile"
        description="Account and work details."
      />
      <PageBody>
        <Card>
          <CardHeader icon={<User className="h-5 w-5" />} title="Profile" />
          <CardBody className="space-y-2">
            <p className="text-sm text-ink-900 dark:text-white"><span className="font-semibold">Name:</span> {user?.name}</p>
            <p className="text-sm text-ink-900 dark:text-white"><span className="font-semibold">Role:</span> {user?.role}</p>
            <p className="text-sm text-ink-900 dark:text-white"><span className="font-semibold">Assigned team:</span> {team?.name ?? '—'}</p>
            <p className="text-sm text-ink-900 dark:text-white"><span className="font-semibold">Work contact:</span> {user?.phone ?? '—'}</p>
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
