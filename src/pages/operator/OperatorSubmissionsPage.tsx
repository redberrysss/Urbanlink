import { useState } from 'react';
import { ClipboardCheck, Recycle } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { MATERIAL_META, formatDateTime } from '@/utils/constants';
import { EMPTY_LIST } from '@/utils/empty';

export function OperatorSubmissionsPage() {
  const { activities, stations } = useTownshipData();
  const { user } = useAuth();
  const [tab, setTab] = useState<'pending' | 'verified' | 'rejected'>('pending');

  const myStations = (stations.data ?? EMPTY_LIST).filter((s) => s.operatorId === user?.id);
  const stationIds = new Set(myStations.map((s) => s.id));
  const filtered = (activities.data ?? EMPTY_LIST).filter((a) => stationIds.has(a.stationId) && a.status === tab);

  return (
    <div>
      <PageHeader
        eyebrow="RecycleMate · Operator Workspace"
        title="Submissions"
        description="Review and verify recycling submissions."
      />
      <PageBody className="space-y-6">
        <SegmentedControl
          value={tab}
          onChange={(v) => setTab(v as any)}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'verified', label: 'Verified' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
        <Card>
          <CardHeader icon={<ClipboardCheck className="h-5 w-5" />} title="Queue" subtitle={`${filtered.length} item(s)`} />
          <CardBody className="space-y-2">
            {filtered.map((a) => {
              const meta = MATERIAL_META[a.material];
              return (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ backgroundColor: meta.color }}>
                      <Recycle className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ink-900 dark:text-white">{a.userName} · {a.weightKg} kg {meta.label}</p>
                      <p className="text-xs text-ink-500">{a.stationName} · {formatDateTime(a.submittedAt)}</p>
                    </div>
                  </div>
                  {tab === 'pending' ? (
                    <Button size="sm" variant="secondary">Review</Button>
                  ) : (
                    <Badge color={a.status === 'verified' ? '#047857' : '#DC2626'} bg={a.status === 'verified' ? '#D1FAE5' : '#FEE2E2'}>
                      {a.status === 'verified' ? 'Verified' : 'Rejected'}
                    </Badge>
                  )}
                </div>
              );
            })}
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
