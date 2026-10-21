import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lightbulb,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  Waves,
  Zap,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { EmptyState } from '@/components/common/EmptyState';
import { Meter } from '@/components/common/Progress';
import { TownshipMap } from '@/components/maps/TownshipMap';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { computeNeighbourhoodRisks } from '@/services/analytics/aggregations';
import {
  HAZARD_STATUS_META,
  HAZARD_TYPE_META,
  formatDateTime,
  formatRelative,
} from '@/utils/constants';
import type { HazardType } from '@/types';

import { EMPTY_LIST } from '@/utils/empty';
const HAZARD_ICONS: Record<HazardType, typeof ShieldAlert> = {
  streetlight: Lightbulb,
  unsafe_walkway: AlertTriangle,
  flood_prone: Waves,
  damaged_crossing: Zap,
  reported_hazard: ShieldAlert,
  active_warning: Activity,
};

export function SafetyPage() {
  const { hazards, reports, obstacles } = useTownshipData();
  const { hazardId } = useParams<{ hazardId: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'active' | 'monitoring' | 'resolved' | 'all'>('active');

  const all = hazards.data ?? EMPTY_LIST;

  const filtered = useMemo(() => {
    if (filter === 'all') return all;
    return all.filter((h) => h.status === filter);
  }, [all, filter]);

  const selected = useMemo(
    () => (hazardId ? all.find((h) => h.id === hazardId) : undefined),
    [all, hazardId],
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

  const stats = useMemo(
    () => ({
      active: all.filter((h) => h.status === 'active').length,
      monitoring: all.filter((h) => h.status === 'monitoring').length,
      resolved: all.filter((h) => h.status === 'resolved').length,
      avgRisk: all.length
        ? Math.round(all.reduce((s, h) => s + h.riskScore, 0) / all.length)
        : 0,
    }),
    [all],
  );

  const mapHazards = selected ? [selected] : filtered;

  return (
    <div>
      <PageHeader
        eyebrow="SafeSpot · Neighbourhood Safety Monitor"
        title="Safety monitor"
        description="Live hazard register with prototype neighbourhood risk scoring. SafeSpot never stores its own copy of an issue — every hazard links back to the original community report."
        actions={
          <Link to="/app/reports/new">
            <Button icon={<ShieldAlert className="h-4 w-4" />}>Report a hazard</Button>
          </Link>
        }
      />

      <PageBody className="space-y-6">
        {selected ? (
          <Card>
            <CardBody>
              <Link
                to="/app/safety"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:underline dark:text-primary-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to all hazards
              </Link>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      color={HAZARD_STATUS_META[selected.status].color}
                      bg={HAZARD_STATUS_META[selected.status].bg}
                    >
                      {HAZARD_STATUS_META[selected.status].label}
                    </Badge>
                    <Badge color={HAZARD_TYPE_META[selected.type].color} bg="#F1F5F9">
                      {HAZARD_TYPE_META[selected.type].label}
                    </Badge>
                  </div>
                  <h2 className="mt-2 text-lg font-extrabold text-ink-900 dark:text-white">
                    {selected.title}
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                    {selected.description}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {selected.address} · reported {formatRelative(selected.reportedAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-ink-100 p-4 text-center dark:border-white/10">
                  <p className="text-3xl font-extrabold text-ink-900 dark:text-white">
                    {selected.riskScore}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                    Prototype risk
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                    Risk factors
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {selected.riskFactors.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-xs text-ink-600 dark:text-ink-300"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Details</p>
                  <dl className="mt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500 dark:text-ink-400">Severity</dt>
                      <dd className="font-bold capitalize text-ink-800 dark:text-ink-100">
                        {selected.severity}
                      </dd>
                    </div>
                    {selected.lightingStatus ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-500 dark:text-ink-400">Lighting</dt>
                        <dd className="font-bold capitalize text-ink-800 dark:text-ink-100">
                          {selected.lightingStatus}
                        </dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500 dark:text-ink-400">Reported</dt>
                      <dd className="font-bold text-ink-800 dark:text-ink-100">
                        {formatDateTime(selected.reportedAt)}
                      </dd>
                    </div>
                    {selected.reportId ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-500 dark:text-ink-400">Linked report</dt>
                        <dd className="font-bold text-primary-600 dark:text-primary-300">
                          <Link to={`/app/reports/${selected.reportId}`}>View report</Link>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : null}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Active hazards', value: stats.active, color: '#F0330F', icon: AlertTriangle },
            { label: 'Monitoring', value: stats.monitoring, color: '#F59E0B', icon: Clock },
            { label: 'Resolved', value: stats.resolved, color: '#047857', icon: CheckCircle2 },
            { label: 'Average risk', value: stats.avgRisk, color: '#7C3AED', icon: TrendingDown },
          ].map((s) => {
            const Icon = s.icon;
            return (
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
                    <Icon className="h-5 w-5" />
                  </span>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          {/* Hazard list */}
          <div className="space-y-6">
            <Card>
              <CardHeader
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Hazard register"
                subtitle={`${filtered.length} hazards shown`}
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
                    description="Switch the filter to see hazards in other states."
                  />
                ) : (
                  <div className="space-y-2.5">
                    {filtered.map((h) => {
                      const Icon = HAZARD_ICONS[h.type];
                      const meta = HAZARD_TYPE_META[h.type];
                      const status = HAZARD_STATUS_META[h.status];
                      return (
                        <Link
                          key={h.id}
                          to={`/app/safety/${h.id}`}
                          className="flex items-start gap-3 rounded-xl border border-ink-100 p-3.5 transition hover:border-primary-300 hover:bg-primary-50/30 dark:border-white/10 dark:hover:bg-primary-500/5"
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
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-xs text-ink-500 dark:text-ink-400">
                              {h.address}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold text-ink-400">
                              {meta.label} · risk {h.riskScore}/100 · updated{' '}
                              {formatRelative(h.updatedAt)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Map + zones */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="h-[380px]">
                <TownshipMap
                  layers={{ routes: false, issues: false, hazards: true, stations: false }}
                  reports={[]}
                  obstacles={[]}
                  hazards={mapHazards}
                  stations={[]}
                  onSelectHazard={(h) => navigate(`/app/safety/${h.id}`)}
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Neighbourhood risk zones"
                subtitle="Prototype risk aggregation per zone"
              />
              <CardBody className="space-y-4">
                {risks.map((z) => (
                  <div key={z.zoneId}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-ink-800 dark:text-ink-100">{z.zoneName}</p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor:
                            z.riskScore > 60 ? '#FFE4E6' : z.riskScore > 30 ? '#FEF3C7' : '#D1FAE5',
                          color: z.riskScore > 60 ? '#9F1239' : z.riskScore > 30 ? '#B45309' : '#047857',
                        }}
                      >
                        {z.riskScore}/100
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Meter
                        label=""
                        value={z.riskScore}
                        color={z.riskScore > 60 ? '#F0330F' : z.riskScore > 30 ? '#F59E0B' : '#047857'}
                      />
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-ink-400">
                      {z.factors.join(' · ')}
                    </p>
                  </div>
                ))}
                <p className="rounded-xl bg-ink-50 p-3 text-[10px] leading-relaxed text-ink-500 dark:bg-white/[0.04] dark:text-ink-400">
                  Risk scores are prototype estimates derived from open issue counts and severity
                  weights. They are illustrative and are not an official safety assessment.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
