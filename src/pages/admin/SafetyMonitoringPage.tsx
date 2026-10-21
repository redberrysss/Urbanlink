import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lightbulb,
  MapPin,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Waves,
  Zap,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { EmptyState } from '@/components/common/EmptyState';
import { Meter } from '@/components/common/Progress';
import { TownshipMap } from '@/components/maps/TownshipMap';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { computeNeighbourhoodRisks } from '@/services/analytics/aggregations';
import {
  HAZARD_STATUS_META,
  HAZARD_TYPE_META,
  formatRelative,
} from '@/utils/constants';
import type { HazardType } from '@/types';

import { EMPTY_LIST } from '@/utils/empty';
const TYPE_ICONS: Record<HazardType, typeof ShieldAlert> = {
  streetlight: Lightbulb,
  unsafe_walkway: AlertTriangle,
  flood_prone: Waves,
  damaged_crossing: Zap,
  reported_hazard: ShieldAlert,
  active_warning: Radio,
};

export function SafetyMonitoringPage() {
  const { hazards, reports, obstacles } = useTownshipData();
  const [filter, setFilter] = useState<'active' | 'monitoring' | 'resolved' | 'all'>('active');

  const all = hazards.data ?? EMPTY_LIST;

  const filtered = useMemo(
    () => (filter === 'all' ? all : all.filter((h) => h.status === filter)),
    [all, filter],
  );

  const risks = useMemo(
    () =>
      computeNeighbourhoodRisks({
        reports: reports.data ?? EMPTY_LIST,
        obstacles: obstacles.data ?? EMPTY_LIST,
        hazards: all,
        stations: [],
        activities: [],
        tasks: [],
        teams: [],
        users: [],
      }),
    [reports.data, obstacles.data, all],
  );

  const byType = useMemo(() => {
    const map = new Map<HazardType, number>();
    all.forEach((h) => map.set(h.type, (map.get(h.type) ?? 0) + 1));
    return [...map.entries()].map(([type, count]) => ({
      type,
      label: HAZARD_TYPE_META[type].label,
      count,
      color: HAZARD_TYPE_META[type].color,
    }));
  }, [all]);

  const lightingFaults = all.filter((h) => h.lightingStatus === 'faulty');

  return (
    <div>
      <PageHeader
        eyebrow="Township Administration · SafeSpot Monitoring"
        title="Safety monitoring"
        description="Operational view of the hazard register, lighting faults and neighbourhood exposure across Bandar Seri Damai."
      />

      <PageBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Active hazards', value: all.filter((h) => h.status === 'active').length, color: '#F0330F' },
            { label: 'Monitoring', value: all.filter((h) => h.status === 'monitoring').length, color: '#F59E0B' },
            { label: 'Lighting faults', value: lightingFaults.length, color: '#D97706' },
            { label: 'Resolved', value: all.filter((h) => h.status === 'resolved').length, color: '#047857' },
          ].map((s) => (
            <Card key={s.label}>
              <CardBody className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{s.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-white">
                    {s.value}
                  </p>
                </div>
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
          <Card>
            <CardHeader
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Hazard register"
              subtitle={`${filtered.length} hazards`}
              action={
                <SegmentedControl
                  value={filter}
                  onChange={setFilter}
                  size="sm"
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'monitoring', label: 'Monitoring' },
                    { value: 'resolved', label: 'Resolved' },
                    { value: 'all', label: 'All' },
                  ]}
                />
              }
            />
            <CardBody>
              {filtered.length === 0 ? (
                <EmptyState
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="No hazards in this view"
                  description="Change the filter to review hazards in other states."
                />
              ) : (
                <div className="space-y-2.5">
                  {filtered.map((h) => {
                    const Icon = TYPE_ICONS[h.type];
                    const meta = HAZARD_TYPE_META[h.type];
                    const status = HAZARD_STATUS_META[h.status];
                    return (
                      <Link
                        key={h.id}
                        to={`/app/safety/${h.id}`}
                        className="flex flex-wrap items-start gap-3 rounded-xl border border-ink-100 p-3.5 transition hover:border-primary-300 dark:border-white/10"
                      >
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
                          style={{ backgroundColor: meta.color }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-ink-900 dark:text-white">{h.title}</p>
                            <Badge color={status.color} bg={status.bg}>
                              {status.label}
                            </Badge>
                            {h.lightingStatus === 'faulty' ? (
                              <Badge color="#D97706" bg="#FEF3C7">
                                Lighting fault
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500 dark:text-ink-400">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {h.address}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelative(h.updatedAt)}
                            </span>
                          </p>
                          <p className="mt-1 text-[10px] text-ink-400">
                            {h.riskFactors.join(' · ')}
                          </p>
                        </div>
                        <div className="w-28 shrink-0">
                          <Meter
                            label="Risk"
                            value={h.riskScore}
                            color={h.riskScore > 60 ? '#F0330F' : h.riskScore > 30 ? '#F59E0B' : '#047857'}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="h-[320px]">
                <TownshipMap
                  layers={{ routes: false, issues: false, hazards: true, stations: false }}
                  reports={[]}
                  obstacles={[]}
                  hazards={filtered}
                  stations={[]}
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<AlertTriangle className="h-5 w-5" />}
                title="Hazards by type"
                subtitle="Distribution across the register"
              />
              <CardBody className="space-y-2.5">
                {byType.map((t) => (
                  <div key={t.type}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-700 dark:text-ink-200">{t.label}</span>
                      <span className="font-bold text-ink-400">{t.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(t.count / Math.max(1, all.length)) * 100}%`,
                          backgroundColor: t.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={<ShieldAlert className="h-5 w-5" />}
                title="Zone exposure"
                subtitle="Risk concentration by neighbourhood"
              />
              <CardBody className="space-y-3">
                {[...risks]
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .map((z) => (
                    <div key={z.zoneId}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-ink-800 dark:text-ink-100">{z.zoneName}</span>
                        <span className="font-extrabold text-ink-900 dark:text-white">
                          {z.riskScore}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <Meter
                          label=""
                          value={z.riskScore}
                          color={z.riskScore > 60 ? '#F0330F' : z.riskScore > 30 ? '#F59E0B' : '#047857'}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-ink-400">
                        {z.hazardCount} hazards · {z.openReports} open reports
                      </p>
                    </div>
                  ))}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <p className="text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                    Hazards are never created independently — they are linked to the originating
                    community report. Resolving that report clears the hazard here and re-opens the
                    affected route segments automatically.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
