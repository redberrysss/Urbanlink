import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Recycle, Truck } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { EMPTY_LIST } from '@/utils/empty';

export function OperatorDashboardPage() {
  const { activities, stations } = useTownshipData();
  const { user } = useAuth();

  const myStations = (stations.data ?? EMPTY_LIST).filter((s) => s.operatorId === user?.id);
  const stationIds = new Set(myStations.map((s) => s.id));
  const myActivities = (activities.data ?? EMPTY_LIST).filter((a) => stationIds.has(a.stationId));

  const pending = myActivities.filter((a) => a.status === 'pending').length;
  const verifiedToday = myActivities.filter((a) => a.status === 'verified' && a.verifiedAt && a.verifiedAt.startsWith(new Date().toISOString().slice(0, 10))).length;
  const stationsNeedingAttention = myStations.filter((s) => s.status !== 'operational').length;
  const verifiedWeightToday = myActivities
    .filter((a) => a.status === 'verified' && a.verifiedAt && a.verifiedAt.startsWith(new Date().toISOString().slice(0, 10)))
    .reduce((sum, a) => sum + (a.weightKg || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="RecycleMate · Operator Workspace"
        title="Recycling Dashboard"
        description="Review submissions, monitor your stations and manage collections."
      />
      <PageBody className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardBody>
              <Link to="/app/recycling-operator/submissions" className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Pending verification</p>
                  <p className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-white">{pending}</p>
                </div>
                <ClipboardCheck className="h-5 w-5 text-amber-600" />
              </Link>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Verified today</p>
                  <p className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-white">{verifiedToday}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Link to="/app/recycling-operator/stations" className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Stations needing attention</p>
                  <p className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-white">{stationsNeedingAttention}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </Link>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Verified weight today</p>
                  <p className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-white">{verifiedWeightToday.toFixed(1)} kg</p>
                </div>
                <Recycle className="h-5 w-5 text-primary-600" />
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader icon={<ClipboardCheck className="h-5 w-5" />} title="Pending submissions" subtitle={`${pending} awaiting review`} action={<Link to="/app/recycling-operator/submissions"><Button size="sm" variant="ghost">View all</Button></Link>} />
          <CardBody>
            {myActivities.filter((a) => a.status === 'pending').length === 0 ? (
              <p className="text-sm text-ink-400">No pending submissions.</p>
            ) : (
              <div className="space-y-2">
                {myActivities.filter((a) => a.status === 'pending').slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3 dark:border-white/10">
                    <div>
                      <p className="text-sm font-semibold text-ink-900 dark:text-white">{a.userName} · {a.weightKg} kg {a.material}</p>
                      <p className="text-xs text-ink-500">{a.stationName}</p>
                    </div>
                    <Link to="/app/recycling-operator/submissions">
                      <Button size="sm" variant="secondary">Review</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader icon={<Truck className="h-5 w-5" />} title="Station alerts" />
          <CardBody className="space-y-2">
            {myStations.filter((s) => s.status !== 'operational').map((s) => (
              <div key={s.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="text-sm font-semibold text-ink-900 dark:text-white">{s.name}</p>
                <p className="text-xs text-ink-600 dark:text-ink-300">Status: {s.status}</p>
              </div>
            ))}
            {myStations.filter((s) => s.status === 'operational').length === 0 && myStations.length === 0 ? (
              <p className="text-sm text-ink-400">No stations assigned.</p>
            ) : null}
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
