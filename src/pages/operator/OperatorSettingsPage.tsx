import { Settings } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';

export function OperatorSettingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="RecycleMate · Operator Workspace"
        title="Settings"
        description="Workspace preferences."
      />
      <PageBody>
        <Card>
          <CardHeader icon={<Settings className="h-5 w-5" />} title="Settings" />
          <CardBody>
            <p className="text-sm text-ink-500">Settings will appear here.</p>
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
