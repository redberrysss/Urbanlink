import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Leaf,
  MapPin,
  Recycle,
  Scale,
  TrendingUp,
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
import {
  buildLeaderboard,
  estimateImpact,
  materialBreakdown,
} from '@/services/analytics/aggregations';
import {
  MATERIAL_META,
  STATION_STATUS_META,
  formatDateTime,
  formatWeight,
} from '@/utils/constants';
import type { MaterialType, StationStatus } from '@/types';

import { EMPTY_LIST } from '@/utils/empty';
export function RecyclingManagementPage() {
  const { stations, activities, users, transactions } = useTownshipData();
  const [statusFilter, setStatusFilter] = useState<StationStatus | 'all'>('all');

  const allStations = stations.data ?? EMPTY_LIST;
  const allActivities = activities.data ?? EMPTY_LIST;

  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? allStations
        : allStations.filter((s) => s.status === statusFilter),
    [allStations, statusFilter],
  );

  const impact = useMemo(() => estimateImpact(allActivities), [allActivities]);
  const breakdown = useMemo(() => materialBreakdown(allActivities), [allActivities]);
  const leaderboard = useMemo(
    () => buildLeaderboard(users.data ?? EMPTY_LIST, allActivities, 8),
    [users.data, allActivities],
  );

  const pending = allActivities.filter((a) => a.status === 'pending');
  const verified = allActivities.filter((a) => a.status === 'verified');
  const pointsIssued = (transactions.data ?? EMPTY_LIST).reduce((s, t) => s + t.points, 0);

  const totalCapacity = allStations.reduce((s, st) => s + st.capacityKg, 0);
  const totalLoad = allStations.reduce((s, st) => s + st.currentKg, 0);
  const utilisation = totalCapacity ? Math.round((totalLoad / totalCapacity) * 100) : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Township Administration · RecycleMate Operations"
        title="Recycling operations"
        description="Station capacity, verification throughput, material mix and reward issuance across the township recycling network."
        actions={
          <Link to="/app/verification">
            <Button icon={<CheckCircle2 className="h-4 w-4" />}>Verification queue</Button>
          </Link>
        }
      />

      <PageBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Network utilisation',
              value: `${utilisation}%`,
              icon: <Scale className="h-5 w-5" />,
              color: '#047857',
            },
            {
              label: 'Pending verification',
              value: String(pending.length),
              icon: <Clock className="h-5 w-5" />,
              color: '#F59E0B',
            },
            {
              label: 'Verified entries',
              value: String(verified.length),
              icon: <CheckCircle2 className="h-5 w-5" />,
              color: '#176B5B',
            },
            {
              label: 'Points issued',
              value: formatWeight(pointsIssued).replace(' kg', ''),
              icon: <TrendingUp className="h-5 w-5" />,
              color: '#7C3AED',
            },
          ].map((s) => (
            <Card key={s.label}>
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
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Card>
              <CardHeader
                icon={<Recycle className="h-5 w-5" />}
                title="Station network"
                subtitle={`${filtered.length} of ${allStations.length} stations`}
                action={
                  <Select
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v as StationStatus | 'all')}
                    options={[
                      { value: 'all', label: 'All statuses' },
                      ...(
                        Object.keys(STATION_STATUS_META) as StationStatus[]
                      ).map((s) => ({ value: s, label: STATION_STATUS_META[s].label })),
                    ]}
                    className="w-[180px]"
                  />
                }
              />
              <CardBody className="space-y-3">
                {filtered.length === 0 ? (
                  <EmptyState icon={<Recycle className="h-5 w-5" />} title="No stations in this view" />
                ) : (
                  filtered.map((s) => {
                    const status = STATION_STATUS_META[s.status];
                    const fill = s.capacityKg ? Math.round((s.currentKg / s.capacityKg) * 100) : 0;
                    return (
                      <div
                        key={s.id}
                        className="rounded-xl border border-ink-100 p-4 dark:border-white/10"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-ink-900 dark:text-white">{s.name}</p>
                              <span className="inline-flex items-center gap-1.5">
                                <StatusDot color={status.color} pulse={status.pulse} />
                                <span className="text-[10px] font-bold" style={{ color: status.color }}>
                                  {status.label}
                                </span>
                              </span>
                            </div>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-500 dark:text-ink-400">
                              <MapPin className="h-3 w-3" />
                              {s.address}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-500 dark:text-ink-400">
                              <Clock className="h-3 w-3" />
                              {s.hours}
                            </p>
                          </div>
                          <div className="w-full sm:w-48">
                            <Meter
                              label={`${formatWeight(s.currentKg)} / ${formatWeight(s.capacityKg)}`}
                              value={fill}
                              color={fill > 85 ? '#F0330F' : fill > 60 ? '#F59E0B' : '#047857'}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {s.accepted.map((m: MaterialType) => (
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
                          {s.lastServicedAt ? (
                            <span className="ml-auto text-[10px] text-ink-400">
                              serviced {formatDateTime(s.lastServicedAt)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={<Weight className="h-5 w-5" />}
                title="Material mix"
                subtitle="Verified collection by material"
              />
              <CardBody className="space-y-3">
                {breakdown.length === 0 ? (
                  <EmptyState icon={<Weight className="h-5 w-5" />} title="No verified collections" />
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
                        <Meter
                          label=""
                          value={
                            impact.kgRecycled ? (b.kg / impact.kgRecycled) * 100 : 0
                          }
                          color={b.color}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="h-[300px]">
                <TownshipMap
                  layers={{ routes: false, issues: false, hazards: false, stations: true }}
                  reports={[]}
                  obstacles={[]}
                  hazards={[]}
                  stations={filtered}
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<Leaf className="h-5 w-5" />}
                title="Estimated impact"
                subtitle="Illustrative proxies for the verified tonnage"
              />
              <CardBody className="space-y-3">
                {[
                  { label: 'Kilograms recycled', value: formatWeight(impact.kgRecycled) },
                  { label: 'Landfill avoided', value: formatWeight(impact.estimatedLandfillAvoidedKg) },
                  { label: 'CO₂ avoided', value: `${impact.estimatedCo2Kg.toFixed(0)} kg` },
                  {
                    label: 'Tree-years equivalent',
                    value: impact.estimatedTreesEquivalent.toFixed(2),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 border-b border-ink-100 pb-2 last:border-0 dark:border-white/10"
                  >
                    <span className="text-xs font-semibold text-ink-500 dark:text-ink-400">
                      {row.label}
                    </span>
                    <span className="text-sm font-extrabold text-ink-900 dark:text-white">
                      {row.value}
                    </span>
                  </div>
                ))}
                <p className="text-[10px] leading-relaxed text-ink-400">{impact.disclaimer}</p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={<TrendingUp className="h-5 w-5" />}
                title="Leading recyclers"
                subtitle="Top contributors by verified points"
              />
              <CardBody className="space-y-2.5">
                {leaderboard.length === 0 ? (
                  <EmptyState icon={<TrendingUp className="h-5 w-5" />} title="No activity yet" />
                ) : (
                  leaderboard.map((entry) => (
                    <div key={entry.userId} className="flex items-center gap-3">
                      <Badge color="#176B5B" bg="#EAF6F3">
                        #{entry.rank}
                      </Badge>
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
          </div>
        </div>
      </PageBody>
    </div>
  );
}
