import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ClipboardCheck,
  Recycle,
  Scale,
  XCircle,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { EmptyState } from '@/components/common/EmptyState';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/common/Toast';
import { MATERIAL_META, formatDateTime, formatWeight } from '@/utils/constants';
import type { RecyclingActivity } from '@/types';
import { cn } from '@/utils/cn';

import { EMPTY_LIST } from '@/utils/empty';
export function VerificationPage() {
  const { activities, stations, verifyActivity } = useTownshipData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [target, setTarget] = useState<RecyclingActivity | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const all = activities.data ?? EMPTY_LIST;

  const filtered = useMemo(() => all.filter((a) => a.status === tab), [all, tab]);

  const pendingCount = all.filter((a) => a.status === 'pending').length;

  const station = useMemo(
    () => (stations.data ?? EMPTY_LIST).find((s) => s.id === target?.stationId),
    [stations.data, target],
  );

  const decide = async (approve: boolean) => {
    if (!target || !user) return;
    setBusy(true);
    try {
      await verifyActivity({
        activityId: target.id,
        actor: user,
        approve,
        note: note.trim() || undefined,
      });
      toast({
        kind: approve ? 'success' : 'warning',
        title: approve ? 'Submission verified' : 'Submission rejected',
        description: approve
          ? 'Points were awarded to the resident and the station total updated.'
          : 'The resident was notified with your note.',
      });
      setTarget(null);
      setNote('');
    } catch (err) {
      toast({
        kind: 'error',
        title: 'Could not process the submission',
        description: err instanceof Error ? err.message : 'Unexpected error.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="RecycleMate · Operator Workspace"
        title="Verification queue"
        description="Review resident recycling submissions, confirm the weight and material, then award points. Verified entries update the resident balance and the station totals instantly."
      />

      <PageBody className="space-y-6">
        <Card>
          <CardHeader
            icon={<ClipboardCheck className="h-5 w-5" />}
            title="Submissions"
            subtitle={`${pendingCount} awaiting review`}
            action={
              <SegmentedControl
                value={tab}
                onChange={setTab}
                size="sm"
                options={[
                  { value: 'pending', label: `Pending (${pendingCount})` },
                  { value: 'verified', label: 'Verified' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
            }
          />
          <CardBody>
            {filtered.length === 0 ? (
              <EmptyState
                icon={<ClipboardCheck className="h-5 w-5" />}
                title="Nothing in this queue"
                description={
                  tab === 'pending'
                    ? 'All submissions have been processed. New ones will appear here.'
                    : 'No entries with this status yet.'
                }
              />
            ) : (
              <div className="space-y-2.5">
                {filtered.map((a, i) => {
                  const meta = MATERIAL_META[a.material];
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/10"
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
                        style={{ backgroundColor: meta.color }}
                      >
                        <Recycle className="h-5 w-5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink-900 dark:text-white">
                          {a.userName} · {formatWeight(a.weightKg)} {meta.label.toLowerCase()}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                          {a.stationName} · submitted {formatDateTime(a.submittedAt)}
                        </p>
                        {a.verificationNote ? (
                          <p className="mt-1 text-[11px] italic text-ink-400">
                            “{a.verificationNote}”
                          </p>
                        ) : null}
                      </div>

                      <Badge color={meta.color} bg={meta.bg}>
                        {a.pointsAwarded} pts
                      </Badge>

                      {a.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setTarget(a);
                              setNote('');
                            }}
                          >
                            Review
                          </Button>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 text-xs font-bold',
                            a.status === 'verified'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400',
                          )}
                        >
                          {a.status === 'verified' ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          {a.status === 'verified' ? 'Verified' : 'Rejected'}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </PageBody>

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Verify recycling submission"
        description="Confirm the material and weight before awarding points. The resident is notified of the outcome."
        icon={<Scale className="h-5 w-5" />}
        footer={
          <>
            <Button variant="danger" onClick={() => decide(false)} loading={busy}>
              Reject
            </Button>
            <Button onClick={() => decide(true)} loading={busy}>
              Verify & award points
            </Button>
          </>
        }
      >
        {target ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-ink-100 p-4 dark:border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink-900 dark:text-white">{target.userName}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{target.stationName}</p>
                </div>
                <Badge color={MATERIAL_META[target.material].color} bg={MATERIAL_META[target.material].bg}>
                  {MATERIAL_META[target.material].label}
                </Badge>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-ink-900 dark:text-white">
                {formatWeight(target.weightKg)}
              </p>
              <p className="text-[11px] text-ink-500 dark:text-ink-400">
                Submitted {formatDateTime(target.submittedAt)}
              </p>
            </div>

            {station ? (
              <div className="rounded-xl bg-ink-50 p-4 dark:bg-white/[0.04]">
                <p className="text-xs font-bold text-ink-800 dark:text-ink-100">
                  {station.name} current load
                </p>
                <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-400">
                  {formatWeight(station.currentKg)} of {formatWeight(station.capacityKg)} capacity
                </p>
              </div>
            ) : null}

            <div>
              <label htmlFor="verify-note" className="label">
                Verification note (optional)
              </label>
              <textarea
                id="verify-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Weight confirmed at the station counter, plastic is dry and sorted."
                className="input"
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
