import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Clock,
  Leaf,
  MapPin,
  Recycle,
  Search,
  Users,
  Weight,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { StatusDot } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { Meter } from '@/components/common/Progress';
import { TownshipMap } from '@/components/maps/TownshipMap';
import { RecyclingActivityPanel } from '@/components/recycling/RecyclingActivityPanel';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import {
  MATERIAL_META,
  STATION_STATUS_META,
  formatWeight,
} from '@/utils/constants';
import type { MaterialType } from '@/types';
import { cn } from '@/utils/cn';

import { EMPTY_LIST } from '@/utils/empty';

type HubTab = 'stations' | 'activity';

export function RecyclingHubPage() {
  const { stations, activities } = useTownshipData();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [material, setMaterial] = useState<MaterialType | 'all'>('all');

  const allStations = stations.data ?? EMPTY_LIST;
  const allActivities = activities.data ?? EMPTY_LIST;

  const tab: HubTab = params.get('tab') === 'activity' ? 'activity' : 'stations';
  const focusedStationId = params.get('station');

  const setTab = (next: HubTab) => {
    const nextParams = new URLSearchParams(params);
    if (next === 'activity') nextParams.set('tab', 'activity');
    else nextParams.delete('tab');
    setParams(nextParams, { replace: true });
  };

  const filtered = useMemo(() => {
    let list = [...allStations];
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
  }, [allStations, material, search]);

  const focusedStation = useMemo(
    () => allStations.find((s) => s.id === focusedStationId),
    [allStations, focusedStationId],
  );

  const focusStation = (stationId: string | null) => {
    const next = new URLSearchParams(params);
    if (stationId) next.set('station', stationId);
    else next.delete('station');
    setParams(next, { replace: true });
  };

  /** Township-wide impact computed from operator-verified submissions only. */
  const impact = useMemo(() => {
    const verified = allActivities.filter((a) => a.status === 'verified');
    const kg = verified.reduce((s, a) => s + a.weightKg, 0);
    const participating = new Set(verified.map((a) => a.userId)).size;
    return {
      verifiedKg: kg,
      verifiedCount: verified.length,
      participating,
    };
  }, [allActivities]);

  return (
    <div>
      <PageHeader
        title="Recycling"
        description="Stations, your submissions and rewards — all in one place."
        actions={
          <div className="flex gap-1 rounded-xl bg-ink-100 p-1 dark:bg-white/[0.06]">
            {(
              [
                { id: 'stations' as const, label: 'Stations' },
                { id: 'activity' as const, label: 'My submissions & rewards' },
              ]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={tab === t.id}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-xs font-bold transition',
                  tab === t.id
                    ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-900 dark:text-white'
                    : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      <PageBody className="space-y-6">
        {tab === 'activity' ? (
          <RecyclingActivityPanel />
        ) : (
          <>
            {/* ---------- Township-wide community impact (measured, not estimated) ---------- */}
            <Card>
              <CardHeader
                icon={<Leaf className="h-5 w-5" />}
                title="Community impact"
                subtitle="Counted from operator-verified recycling submissions across the township"
              />
              <CardBody className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: 'Waste diverted from disposal',
                      value: formatWeight(impact.verifiedKg),
                      icon: <Weight className="h-5 w-5" />,
                    },
                    {
                      label: 'Verified submissions',
                      value: String(impact.verifiedCount),
                      icon: <Recycle className="h-5 w-5" />,
                    },
                    {
                      label: 'Residents taking part',
                      value: String(impact.participating),
                      icon: <Users className="h-5 w-5" />,
                    },
                    {
                      label: 'Stations available',
                      value: String(allStations.length),
                      icon: <MapPin className="h-5 w-5" />,
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10"
                    >
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
                </div>
                <div className="rounded-xl border border-ink-200 bg-ink-50 p-3.5 text-[11px] leading-relaxed text-ink-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-400">
                  <p className="font-bold text-ink-700 dark:text-ink-200">
                    What these figures count, and for which period
                  </p>
                  <p className="mt-1">
                    Only submissions an operator has verified are included — pending and rejected
                    drop-offs are left out, so nothing here is an estimate. “Waste diverted from
                    disposal” is the verified weight of those submissions; “residents taking part”
                    counts distinct residents with at least one verified submission.
                  </p>
                  <p className="mt-1">
                    Reporting period: every verified submission recorded in the township so far.
                    Individual resident figures stay private — only township totals are shown here,
                    and your own submissions are on the “My activity” tab.
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* ---------- Station map + list ---------- */}
            <Card className="overflow-hidden">
              <CardHeader
                icon={<MapPin className="h-5 w-5" />}
                title="Recycling stations"
                subtitle={`${filtered.length} of ${allStations.length} stations · pick a marker or a card to see the details`}
              />
              <div className="h-[340px] w-full sm:h-[420px]">
                <TownshipMap
                  layers={{ routes: false, issues: false, hazards: false, stations: true }}
                  reports={[]}
                  obstacles={[]}
                  hazards={[]}
                  stations={filtered}
                  onSelectStation={(s) => focusStation(s.id)}
                />
              </div>

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

                {focusedStation ? (
                  <div className="rounded-2xl border border-emerald-300 bg-emerald-50/60 p-4 dark:border-emerald-500/40 dark:bg-emerald-500/10">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-ink-900 dark:text-white">
                          {focusedStation.name}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-600 dark:text-ink-300">
                          <MapPin className="h-3.5 w-3.5" />
                          {focusedStation.address}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-600 dark:text-ink-300">
                          <Clock className="h-3.5 w-3.5" />
                          {focusedStation.hours}
                        </p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => focusStation(null)}>
                        Clear selection
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {focusedStation.accepted.map((m) => (
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
                        label={`Current load ${formatWeight(focusedStation.currentKg)} / ${formatWeight(focusedStation.capacityKg)}`}
                        value={
                          focusedStation.capacityKg
                            ? Math.round(
                                (focusedStation.currentKg / focusedStation.capacityKg) * 100,
                              )
                            : 0
                        }
                        color={
                          focusedStation.capacityKg &&
                          focusedStation.currentKg / focusedStation.capacityKg > 0.85
                            ? '#F0330F'
                            : '#047857'
                        }
                      />
                    </div>
                  </div>
                ) : null}

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
                          onClick={() => focusStation(focusedStationId === s.id ? null : s.id)}
                          aria-pressed={focusedStationId === s.id}
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

          </>
        )}
      </PageBody>
    </div>
  );
}
