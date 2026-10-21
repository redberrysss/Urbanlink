import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  Leaf,
  MapPin,
  Recycle,
  Search,
  Sparkles,
  Trophy,
  Weight,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge, StatusDot } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { Meter } from '@/components/common/Progress';
import { TownshipMap } from '@/components/maps/TownshipMap';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  buildLeaderboard,
  estimateImpact,
  materialBreakdown,
} from '@/services/analytics/aggregations';
import {
  MATERIAL_META,
  STATION_STATUS_META,
  formatWeight,
} from '@/utils/constants';
import type { MaterialType } from '@/types';
import { cn } from '@/utils/cn';

import { EMPTY_LIST } from '@/utils/empty';
export function RecyclingHubPage() {
  const { stations, activities, users, transactions } = useTownshipData();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [material, setMaterial] = useState<MaterialType | 'all'>('all');

  const allStations = stations.data ?? EMPTY_LIST;
  const allActivities = activities.data ?? EMPTY_LIST;

  const focusedStationId = params.get('station');

  const filtered = useMemo(() => {
    let list = [...allStations];
    if (focusedStationId) list = list.filter((s) => s.id === focusedStationId);
    if (material !== 'all') {
      list = list.filter((s) => s.accepted.includes(material));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allStations, focusedStationId, material, search]);

  const impact = useMemo(() => estimateImpact(allActivities), [allActivities]);
  const breakdown = useMemo(() => materialBreakdown(allActivities), [allActivities]);
  const leaderboard = useMemo(
    () => buildLeaderboard(users.data ?? EMPTY_LIST, allActivities, 6),
    [users.data, allActivities],
  );

  const myTransactions = useMemo(
    () => (transactions.data ?? EMPTY_LIST).filter((t) => t.userId === user?.id),
    [transactions.data, user?.id],
  );

  const totalKg = breakdown.reduce((s, b) => s + b.kg, 0);

  return (
    <div>
      <PageHeader
        eyebrow="RecycleMate · Community Recycling Hub"
        title="Recycling hub"
        description="Find a station, check what it accepts and follow the impact of every verified kilogram collected across the township."
      />

      <PageBody className="space-y-6">
        {/* Impact banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 dark:border-emerald-500/25 dark:from-emerald-500/10 dark:to-teal-500/5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[
            {
              label: 'Total recycled',
              value: formatWeight(impact.kgRecycled),
              icon: <Weight className="h-5 w-5" />,
            },
            {
              label: 'Landfill avoided (est.)',
              value: formatWeight(impact.estimatedLandfillAvoidedKg),
              icon: <Leaf className="h-5 w-5" />,
            },
            {
              label: 'CO₂ avoided (est.)',
              value: `${impact.estimatedCo2Kg.toFixed(0)} kg`,
              icon: <Recycle className="h-5 w-5" />,
            },
            {
              label: 'Tree-years equivalent',
              value: impact.estimatedTreesEquivalent.toFixed(2),
              icon: <Trophy className="h-5 w-5" />,
            },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
                {s.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-800/80 dark:text-emerald-200/80">
                  {s.label}
                </p>
                <p className="truncate text-lg font-extrabold text-emerald-900 dark:text-emerald-50">
                  {s.value}
                </p>
              </div>
            </div>
          ))}
          <p className="text-[10px] leading-relaxed text-emerald-900/70 dark:text-emerald-100/60 sm:col-span-2 xl:col-span-4">
            {impact.disclaimer}
          </p>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* Stations */}
            <Card>
              <CardHeader
                icon={<Recycle className="h-5 w-5" />}
                title="Recycling stations"
                subtitle={`${filtered.length} of ${allStations.length} stations`}
                action={
                  focusedStationId ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const next = new URLSearchParams(params);
                        next.delete('station');
                        setParams(next, { replace: true });
                      }}
                    >
                      Clear focus
                    </Button>
                  ) : null
                }
              />
              <CardBody className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search stations…"
                      className="input pl-9"
                      aria-label="Search recycling stations"
                    />
                  </div>
                  <Select
                    value={material}
                    onChange={(v) => setMaterial(v as MaterialType | 'all')}
                    options={[
                      { value: 'all', label: 'All materials' },
                      ...(Object.keys(MATERIAL_META) as MaterialType[]).map((m) => ({
                        value: m,
                        label: MATERIAL_META[m].label,
                      })),
                    ]}
                    className="sm:w-[200px]"
                  />
                </div>

                {filtered.length === 0 ? (
                  <EmptyState
                    icon={<Recycle className="h-5 w-5" />}
                    title="No stations match"
                    description="Try a different material or clear the search."
                  />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {filtered.map((s) => {
                      const status = STATION_STATUS_META[s.status];
                      const fill = s.capacityKg ? Math.round((s.currentKg / s.capacityKg) * 100) : 0;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            const next = new URLSearchParams(params);
                            next.set('station', s.id);
                            setParams(next, { replace: true });
                          }}
                          className={cn(
                            'rounded-xl border p-4 text-left transition hover:border-emerald-400',
                            focusedStationId === s.id
                              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-500/10'
                              : 'border-ink-200 dark:border-white/10',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-ink-900 dark:text-white">{s.name}</p>
                            <span className="inline-flex shrink-0 items-center gap-1.5">
                              <StatusDot color={status.color} pulse={status.pulse} />
                              <span
                                className="text-[10px] font-bold"
                                style={{ color: status.color }}
                              >
                                {status.label}
                              </span>
                            </span>
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-500 dark:text-ink-400">
                            <MapPin className="h-3 w-3" />
                            {s.address}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-500 dark:text-ink-400">
                            <Clock className="h-3 w-3" />
                            {s.hours}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {s.accepted.map((m) => (
                              <span
                                key={m}
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                style={{
                                  backgroundColor: MATERIAL_META[m].bg,
                                  color: MATERIAL_META[m].color,
                                }}
                              >
                                {MATERIAL_META[m].label}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3">
                            <Meter
                              label={`Capacity ${formatWeight(s.currentKg)} / ${formatWeight(s.capacityKg)}`}
                              value={fill}
                              color={fill > 85 ? '#F0330F' : '#047857'}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Material breakdown */}
            <Card>
              <CardHeader
                icon={<Weight className="h-5 w-5" />}
                title="Collected by material"
                subtitle={`${formatWeight(totalKg)} verified across all stations`}
              />
              <CardBody className="space-y-3">
                {breakdown.length === 0 ? (
                  <EmptyState
                    icon={<Weight className="h-5 w-5" />}
                    title="No verified collections yet"
                    description="Once operators verify submissions, the totals appear here."
                  />
                ) : (
                  breakdown.map((b) => (
                    <div key={b.material}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-ink-800 dark:text-ink-100">{b.label}</span>
                        <span className="font-semibold text-ink-500 dark:text-ink-400">
                          {formatWeight(b.kg)} · {b.points} pts
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <Meter label="" value={totalKg ? (b.kg / totalKg) * 100 : 0} color={b.color} />
                      </div>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="h-[300px]">
                <TownshipMap
                  layers={{ routes: false, issues: false, hazards: false, stations: true }}
                  reports={[]}
                  obstacles={[]}
                  hazards={[]}
                  stations={filtered}
                  onSelectStation={(s) => {
                    const next = new URLSearchParams(params);
                    next.set('station', s.id);
                    setParams(next, { replace: true });
                  }}
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<Trophy className="h-5 w-5" />}
                title="Top recyclers"
                subtitle="Verified contribution this period"
              />
              <CardBody className="space-y-2.5">
                {leaderboard.length === 0 ? (
                  <EmptyState icon={<Trophy className="h-5 w-5" />} title="No rankings yet" />
                ) : (
                  leaderboard.map((entry) => (
                    <div key={entry.userId} className="flex items-center gap-3">
                      <span
                        className={cn(
                          'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold',
                          entry.rank === 1
                            ? 'bg-amber-100 text-amber-700'
                            : entry.rank === 2
                              ? 'bg-ink-200 text-ink-700'
                              : entry.rank === 3
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-ink-100 text-ink-500',
                        )}
                      >
                        {entry.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-ink-800 dark:text-ink-100">
                          {entry.name}
                        </p>
                        <p className="text-[10px] text-ink-400">
                          {formatWeight(entry.kg)} · {entry.activities} submissions
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                        {entry.points} pts
                      </span>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={<Sparkles className="h-5 w-5" />}
                title="My rewards"
                subtitle={`${user?.points ?? 0} points balance`}
              />
              <CardBody>
                {myTransactions.length === 0 ? (
                  <EmptyState
                    icon={<Sparkles className="h-5 w-5" />}
                    title="No reward history yet"
                    description="Submit a recycling activity to start earning points."
                  />
                ) : (
                  <div className="space-y-2">
                    {myTransactions.slice(0, 6).map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-2.5 dark:border-white/10"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink-800 dark:text-ink-100">
                            {t.reason}
                          </p>
                          <p className="text-[10px] text-ink-400">{t.type}</p>
                        </div>
                        <Badge
                          color={t.points >= 0 ? '#047857' : '#9F1239'}
                          bg={t.points >= 0 ? '#D1FAE5' : '#FFE4E6'}
                        >
                          {t.points >= 0 ? '+' : ''}
                          {t.points}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
