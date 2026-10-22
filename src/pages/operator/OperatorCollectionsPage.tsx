import { Truck } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';

export function OperatorCollectionsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="RecycleMate · Operator Workspace"
        title="Collections"
        description="Manage collection requests and pickups."
      />
      <PageBody>
        <Card>
          <CardHeader icon={<Truck className="h-5 w-5" />} title="Collections" />
          <CardBody>
            <p className="text-sm text-ink-400">No collection requests at this time.</p>
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
