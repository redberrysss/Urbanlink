import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  Clock,
  History,
  Recycle,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ProgressBar } from '@/components/common/Progress';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { ACHIEVEMENTS } from '@/data/seed';
import {
  MATERIAL_META,
  formatDateTime,
  formatWeight,
} from '@/utils/constants';
import type { RecyclingActivity } from '@/types';
import { cn } from '@/utils/cn';

import { EMPTY_LIST } from '@/utils/empty';
export function ActivitiesPage() {
  const navigate = useNavigate();
  const { activities, transactions } = useTownshipData();
  const { user } = useAuth();
  const [tab, setTab] = useState<'activities' | 'rewards' | 'achievements'>('activities');

  const all = activities.data ?? EMPTY_LIST;
  const mine = useMemo(
    () => all.filter((a) => a.userId === user?.id),
    [all, user?.id],
  );
  const myTransactions = useMemo(
    () => (transactions.data ?? EMPTY_LIST).filter((t) => t.userId === user?.id),
    [transactions.data, user?.id],
  );

  const earned = useMemo(
    () =>
      ACHIEVEMENTS.map((a) => {
        const points = user?.points ?? 0;
        const activityCount = mine.length;
        const kg = mine
          .filter((m) => m.status === 'verified')
          .reduce((s, m) => s + m.weightKg, 0);
        let progress = 0;
        if (a.requirement.kind === 'points') progress = (points / a.requirement.value) * 100;
        if (a.requirement.kind === 'activities') {
          progress = (activityCount / a.requirement.value) * 100;
        }
        if (a.requirement.kind === 'weight') progress = (kg / a.requirement.value) * 100;
        return { achievement: a, progress: Math.min(100, Math.round(progress)) };
      }),
    [user?.points, mine],
  );

  const totalKg = mine
    .filter((m) => m.status === 'verified')
    .reduce((s, m) => s + m.weightKg, 0);

  return (
    <div>
      <PageHeader
        eyebrow="RecycleMate · Personal Activity"
        title="My activities"
        description="Every recycling submission, the points it earned and the badges you have unlocked in Bandar Seri Damai."
        actions={
          <Link to="/app/recycling">
            <Button icon={<Recycle className="h-4 w-4" />}>Open recycling hub</Button>
          </Link>
        }
      />

      <PageBody className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Points balance',
              value: String(user?.points ?? 0),
              icon: <Sparkles className="h-5 w-5" />,
              color: '#7C3AED',
            },
            {
              label: 'Verified kilograms',
              value: formatWeight(totalKg),
              icon: <Recycle className="h-5 w-5" />,
              color: '#047857',
            },
            {
              label: 'Submissions',
              value: String(mine.length),
              icon: <History className="h-5 w-5" />,
              color: '#0EA5E9',
            },
            {
              label: 'Badges earned',
              value: String(earned.filter((e) => e.progress >= 100).length),
              icon: <Trophy className="h-5 w-5" />,
              color: '#F59E0B',
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{s.label}</p>
                    <p className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-white">
                      {s.value}
                    </p>
                  </div>
                  <span
                    className="grid h-10 w-10 place-items-center rounded-xl text-white"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.icon}
                  </span>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-ink-100 p-1 dark:bg-white/[0.06]">
          {(
            [
              { id: 'activities' as const, label: 'Submissions', icon: <Recycle className="h-4 w-4" /> },
              { id: 'rewards' as const, label: 'Points history', icon: <Sparkles className="h-4 w-4" /> },
              { id: 'achievements' as const, label: 'Achievements', icon: <Trophy className="h-4 w-4" /> },
            ]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition',
                tab === t.id
                  ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-900 dark:text-white'
                  : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'activities' ? (
          <Card>
            <CardHeader
              icon={<Recycle className="h-5 w-5" />}
              title="My submissions"
              subtitle="Pending items are awaiting operator verification"
            />
            <CardBody>
              {mine.length === 0 ? (
                <EmptyState
                  icon={<Recycle className="h-5 w-5" />}
                  title="No submissions yet"
                  description="Visit a recycling station and log what you have recycled to start earning points."
                  actionLabel="Find a station"
                  onAction={() => navigate('/app/recycling')}
                />
              ) : (
                <div className="space-y-2.5">
                  {mine.map((a) => (
                    <ActivityRow key={a.id} activity={a} />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        ) : null}

        {tab === 'rewards' ? (
          <Card>
            <CardHeader
              icon={<Sparkles className="h-5 w-5" />}
              title="Points history"
              subtitle="Every credit and adjustment on your account"
            />
            <CardBody>
              {myTransactions.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="h-5 w-5" />}
                  title="No points transactions"
                  description="Points are awarded when an operator verifies your submission."
                />
              ) : (
                <div className="space-y-2">
                  {myTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/10"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink-800 dark:text-ink-100">{t.reason}</p>
                        <p className="mt-0.5 text-[10px] text-ink-400">{formatDateTime(t.at)}</p>
                      </div>
                      <Badge
                        color={t.points >= 0 ? '#047857' : '#9F1239'}
                        bg={t.points >= 0 ? '#D1FAE5' : '#FFE4E6'}
                      >
                        {t.points >= 0 ? '+' : ''}
                        {t.points} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        ) : null}

        {tab === 'achievements' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {earned.map(({ achievement, progress }) => {
              const unlocked = progress >= 100;
              const tierColor =
                achievement.tier === 'gold'
                  ? '#F59E0B'
                  : achievement.tier === 'silver'
                    ? '#64748B'
                    : '#B45309';
              return (
                <Card key={achievement.id}>
                  <CardBody>
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                          unlocked ? 'text-white' : 'bg-ink-100 text-ink-400 dark:bg-white/10',
                        )}
                        style={unlocked ? { backgroundColor: tierColor } : undefined}
                      >
                        {unlocked ? <Award className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-ink-900 dark:text-white">
                            {achievement.name}
                          </p>
                          <Badge color={tierColor} bg="#F1F5F9">
                            {achievement.tier}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <ProgressBar
                        value={progress}
                        color={unlocked ? tierColor : '#176B5B'}
                        label={`${progress}% complete`}
                      />
                      <p className="mt-1.5 text-[10px] font-semibold text-ink-400">
                        {achievement.requirement.kind === 'points'
                          ? `${user?.points ?? 0} / ${achievement.requirement.value} points`
                          : achievement.requirement.kind === 'activities'
                            ? `${mine.length} / ${achievement.requirement.value} submissions`
                            : `${formatWeight(totalKg)} / ${formatWeight(achievement.requirement.value)}`}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        ) : null}
      </PageBody>
    </div>
  );
}

function ActivityRow({ activity }: { activity: RecyclingActivity }) {
  const meta = MATERIAL_META[activity.material];
  const statusMap = {
    pending: { label: 'Awaiting verification', color: '#B45309', bg: '#FEF3C7', icon: <Clock className="h-3.5 w-3.5" /> },
    verified: { label: 'Verified', color: '#047857', bg: '#D1FAE5', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    rejected: { label: 'Rejected', color: '#9F1239', bg: '#FFE4E6', icon: <Clock className="h-3.5 w-3.5" /> },
  } as const;
  const s = statusMap[activity.status];

  return (
    <div className="flex items-start gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/10">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
        style={{ backgroundColor: meta.color }}
      >
        <Recycle className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-ink-900 dark:text-white">
            {formatWeight(activity.weightKg)} {meta.label.toLowerCase()}
          </p>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: s.bg, color: s.color }}
          >
            {s.icon}
            {s.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{activity.stationName}</p>
        <p className="mt-1 text-[10px] text-ink-400">
          Submitted {formatDateTime(activity.submittedAt)}
          {activity.verifierName ? ` · verified by ${activity.verifierName}` : ''}
        </p>
        {activity.verificationNote ? (
          <p className="mt-1.5 rounded-lg bg-ink-50 p-2 text-[11px] italic text-ink-500 dark:bg-white/[0.04] dark:text-ink-400">
            “{activity.verificationNote}”
          </p>
        ) : null}
      </div>
      <span className="shrink-0 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
        {activity.pointsAwarded > 0 ? `+${activity.pointsAwarded}` : '—'}
        <span className="ml-1 text-[10px] font-bold">pts</span>
      </span>
    </div>
  );
}
