import type {
  AccessibilityObstacle,
  MaintenanceTask,
  MaintenanceTeam,
  NeighbourhoodRisk,
  RecyclingActivity,
  RecyclingStation,
  Report,
  SafetyHazard,
  TownshipStats,
  User,
} from '@/types';
import { ROUTE_EDGES } from '@/data/township';
import { computeEdgeProfile } from '@/services/routing/engine';
import { MATERIAL_META } from '@/utils/constants';
import { haversineMeters, round } from '@/utils/geo';

/* ------------------------------------------------------------------ *
 * Time helpers
 * ------------------------------------------------------------------ */

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-MY', { month: 'short' });
}

export function lastMonths(count: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ key, label: monthLabel(key) });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Dashboard aggregates
 * ------------------------------------------------------------------ */

export interface TownshipDataBundle {
  reports: Report[];
  obstacles: AccessibilityObstacle[];
  hazards: SafetyHazard[];
  stations: RecyclingStation[];
  activities: RecyclingActivity[];
  tasks: MaintenanceTask[];
  teams: MaintenanceTeam[];
  users: User[];
}

export function computeTownshipStats(data: TownshipDataBundle): TownshipStats {
  const active = data.reports.filter(
    (r) => r.status !== 'resolved' && r.status !== 'rejected',
  );
  const resolved = data.reports.filter((r) => r.status === 'resolved');
  const activeHazards = data.hazards.filter(
    (h) => h.status === 'active' || h.status === 'monitoring',
  );

  const verified = data.activities.filter((a) => a.status === 'verified');
  const totalRecycledKg = verified.reduce((s, a) => s + a.weightKg, 0);
  const participants = new Set(verified.map((a) => a.userId)).size;

  const accessibilityScore = computeAccessibilityScore(data.obstacles);

  const resolutionDays = resolved
    .filter((r) => r.resolvedAt)
    .map(
      (r) =>
        (new Date(r.resolvedAt!).getTime() - new Date(r.reportedAt).getTime()) / 86_400_000,
    );
  const avgResolutionDays = resolutionDays.length
    ? round(
        resolutionDays.reduce((s, d) => s + d, 0) / resolutionDays.length,
        1,
      )
    : 0;

  const duplicateRate = data.reports.length
    ? round(
        (data.reports.filter((r) => r.potentialDuplicates.length > 0).length / data.reports.length) *
          100,
        1,
      )
    : 0;

  const totalPointsAwarded = verified.reduce((s, a) => s + a.pointsAwarded, 0);

  return {
    activeReports: active.length,
    resolvedIssues: resolved.length,
    accessibilityScore,
    activeHazards: activeHazards.length,
    recyclingParticipation: participants,
    totalRecycledKg: round(totalRecycledKg, 1),
    openTasks: data.tasks.filter((t) => t.status !== 'completed').length,
    totalPointsAwarded,
    avgResolutionDays,
    duplicateRate,
  };
}

/** Composite 0-100 accessibility health score for the township. */
export function computeAccessibilityScore(obstacles: AccessibilityObstacle[]): number {
  const open = obstacles.filter((o) => o.status !== 'resolved');
  if (obstacles.length === 0) return 100;
  const penalty = open.reduce((s, o) => s + o.severity * 100 * (o.votes > 0 ? 1 + o.votes * 0.06 : 1), 0);
  const raw = 100 - (penalty / obstacles.length) * 0.9;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export interface MonthlySeriesPoint {
  month: string;
  label: string;
  submitted: number;
  resolved: number;
}

export function monthlyIssueSeries(reports: Report[], months = 8): MonthlySeriesPoint[] {
  const buckets = lastMonths(months);
  return buckets.map(({ key, label }) => ({
    month: key,
    label,
    submitted: reports.filter((r) => monthKey(r.reportedAt) === key).length,
    resolved: reports.filter((r) => r.resolvedAt && monthKey(r.resolvedAt) === key).length,
  }));
}

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

export function categoryDistribution(reports: Report[]): CategorySlice[] {
  const counts = new Map<string, number>();
  reports.forEach((r) => counts.set(r.category, (counts.get(r.category) ?? 0) + 1));
  const palette: Record<string, string> = {
    pothole: '#F0330F',
    damaged_pavement: '#FB5A36',
    streetlight: '#F59E0B',
    drainage: '#0EA5E9',
    public_facility: '#8B5CF6',
    accessibility: '#176B5B',
    other: '#64748B',
  };
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value, color: palette[name] ?? '#64748B' }))
    .sort((a, b) => b.value - a.value);
}

export interface ConditionStat {
  label: string;
  value: number;
  color: string;
  detail: string;
}

export function accessibilityConditionStats(
  obstacles: AccessibilityObstacle[],
): ConditionStat[] {
  const edges = ROUTE_EDGES.map((edge) => computeEdgeProfile(edge, obstacles));
  const good = edges.filter((e) => e.condition === 'good').length;
  const fair = edges.filter((e) => e.condition === 'fair').length;
  const poor = edges.filter((e) => e.condition === 'poor').length;
  const blocked = edges.filter((e) => e.condition === 'blocked').length;
  const total = edges.length || 1;

  return [
    { label: 'Good', value: Math.round((good / total) * 100), color: '#047857', detail: `${good} segments` },
    { label: 'Fair', value: Math.round((fair / total) * 100), color: '#F59E0B', detail: `${fair} segments` },
    { label: 'Poor', value: Math.round((poor / total) * 100), color: '#F0330F', detail: `${poor} segments` },
    { label: 'Blocked', value: Math.round((blocked / total) * 100), color: '#9F1239', detail: `${blocked} segments` },
  ];
}

export interface HazardTrendPoint {
  label: string;
  reported: number;
  resolved: number;
}

/** Hazards reported and cleared per month — the real history behind the counts. */
export function hazardTrend(hazards: SafetyHazard[], months = 8): HazardTrendPoint[] {
  const buckets = lastMonths(months);
  return buckets.map(({ key, label }) => ({
    label,
    reported: hazards.filter((h) => monthKey(h.reportedAt) === key).length,
    resolved: hazards.filter((h) => h.resolvedAt && monthKey(h.resolvedAt) === key).length,
  }));
}

export interface RecyclingTrendPoint {
  label: string;
  kg: number;
  points: number;
  activities: number;
}

export function recyclingTrend(activities: RecyclingActivity[], months = 6): RecyclingTrendPoint[] {
  const buckets = lastMonths(months);
  return buckets.map(({ key, label }) => {
    const inMonth = activities.filter(
      (a) => a.status === 'verified' && monthKey(a.submittedAt) === key,
    );
    return {
      label,
      kg: round(inMonth.reduce((s, a) => s + a.weightKg, 0), 1),
      points: inMonth.reduce((s, a) => s + a.pointsAwarded, 0),
      activities: inMonth.length,
    };
  });
}

export interface MaintenancePerformance {
  team: string;
  lead: string;
  color: string;
  resolved: number;
  active: number;
  avgHours: number;
  completionRate: number;
}

export function maintenancePerformance(
  teams: MaintenanceTeam[],
  tasks: MaintenanceTask[],
): MaintenancePerformance[] {
  return teams.map((team) => {
    const teamTasks = tasks.filter((t) => t.teamId === team.id);
    const completed = teamTasks.filter((t) => t.status === 'completed').length;
    const active = teamTasks.filter((t) => t.status !== 'completed').length;
    const total = teamTasks.length || 1;
    return {
      team: team.name,
      lead: team.lead,
      color: team.color,
      resolved: completed,
      active,
      avgHours: team.avgResolutionHours,
      completionRate: Math.round((completed / total) * 100),
    };
  });
}

/* ------------------------------------------------------------------ *
 * Safety
 * ------------------------------------------------------------------ */

export interface SafetyZoneDefinition {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number;
}

/** Prototype neighbourhood zones used for illustrative risk aggregation. */
export const SAFETY_ZONES: SafetyZoneDefinition[] = [
  { id: 'z_north', name: 'North Residential', center: { lat: 3.0715, lng: 101.5165 }, radius: 900 },
  { id: 'z_central', name: 'Township Core', center: { lat: 3.0645, lng: 101.5185 }, radius: 900 },
  { id: 'z_east', name: 'East Promenade', center: { lat: 3.0615, lng: 101.5255 }, radius: 800 },
  { id: 'z_south', name: 'South Commercial', center: { lat: 3.0585, lng: 101.5135 }, radius: 900 },
  { id: 'z_west', name: 'West Retail', center: { lat: 3.0625, lng: 101.5105 }, radius: 700 },
];

export function computeNeighbourhoodRisks(data: TownshipDataBundle): NeighbourhoodRisk[] {
  return SAFETY_ZONES.map((zone) => {
    const hazards = data.hazards.filter(
      (h) =>
        (h.status === 'active' || h.status === 'monitoring') &&
        haversineMeters(h.position, zone.center) <= zone.radius,
    );
    const reports = data.reports.filter(
      (r) =>
        r.status !== 'resolved' &&
        r.status !== 'rejected' &&
        haversineMeters(r.position, zone.center) <= zone.radius,
    );
    const obstacles = data.obstacles.filter(
      (o) =>
        o.status !== 'resolved' &&
        haversineMeters(o.position, zone.center) <= zone.radius,
    );

    const factors: string[] = [];
    let score = 0;

    if (hazards.length) {
      score += hazards.length * 9;
      factors.push(`${hazards.length} active hazard${hazards.length > 1 ? 's' : ''}`);
    }
    const critical = hazards.filter((h) => h.severity === 'critical').length;
    if (critical) {
      score += critical * 14;
      factors.push(`${critical} critical severity`);
    }
    const unresolved = reports.filter((r) => r.severity === 'high' || r.severity === 'critical').length;
    if (unresolved) {
      score += unresolved * 5;
      factors.push(`${unresolved} high-impact unresolved report${unresolved > 1 ? 's' : ''}`);
    }
    if (obstacles.length) {
      score += obstacles.length * 6;
      factors.push(`${obstacles.length} accessibility obstacle${obstacles.length > 1 ? 's' : ''}`);
    }
    const lighting = hazards.filter((h) => h.lightingStatus === 'faulty').length;
    if (lighting) {
      score += lighting * 8;
      factors.push(`${lighting} faulty light${lighting > 1 ? 's' : ''}`);
    }

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      center: zone.center,
      riskScore: Math.min(100, Math.round(score)),
      hazardCount: hazards.length,
      openReports: reports.length,
      accessibilityIssues: obstacles.length,
      factors: factors.length ? factors : ['No active issues detected'],
    };
  });
}

/* ------------------------------------------------------------------ *
 * RecycleMate aggregates
 * ------------------------------------------------------------------ */

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  points: number;
  kg: number;
  activities: number;
  block?: string;
}

export function buildLeaderboard(
  users: User[],
  activities: RecyclingActivity[],
  limit = 10,
): LeaderboardEntry[] {
  const map = new Map<string, { points: number; kg: number; activities: number }>();
  activities
    .filter((a) => a.status === 'verified')
    .forEach((a) => {
      const current = map.get(a.userId) ?? { points: 0, kg: 0, activities: 0 };
      current.points += a.pointsAwarded;
      current.kg += a.weightKg;
      current.activities += 1;
      map.set(a.userId, current);
    });

  return [...map.entries()]
    .map(([userId, stats]) => {
      const user = users.find((u) => u.id === userId);
      return {
        rank: 0,
        userId,
        name: user?.name ?? 'Unknown resident',
        points: stats.points,
        kg: round(stats.kg, 1),
        activities: stats.activities,
        block: user?.block,
      };
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

export interface ImpactEstimate {
  kgRecycled: number;
  estimatedCo2Kg: number;
  estimatedTreesEquivalent: number;
  estimatedLandfillAvoidedKg: number;
  disclaimer: string;
}

/**
 * Illustrative environmental proxy figures.
 *
 * These use simple published-style ratios for illustration only and are not
 * verified measurements of avoided emissions for this township.
 */
export function estimateImpact(
  activities: RecyclingActivity[],
): ImpactEstimate {
  const kg = activities
    .filter((a) => a.status === 'verified')
    .reduce((s, a) => s + a.weightKg, 0);
  const co2 = kg * 1.6;
  const trees = co2 / 21;
  return {
    kgRecycled: round(kg, 1),
    estimatedCo2Kg: round(co2, 1),
    estimatedTreesEquivalent: round(trees, 2),
    estimatedLandfillAvoidedKg: round(kg * 0.92, 1),
    disclaimer:
      'Illustrative proxy figures for demonstration only — not audited environmental measurements.',
  };
}

export function materialBreakdown(activities: RecyclingActivity[]): {
  material: string;
  label: string;
  kg: number;
  points: number;
  color: string;
}[] {
  const map = new Map<string, { kg: number; points: number }>();
  activities
    .filter((a) => a.status === 'verified')
    .forEach((a) => {
      const current = map.get(a.material) ?? { kg: 0, points: 0 };
      current.kg += a.weightKg;
      current.points += a.pointsAwarded;
      map.set(a.material, current);
    });
  return [...map.entries()]
    .map(([material, v]) => ({
      material,
      label: MATERIAL_META[material as keyof typeof MATERIAL_META].label,
      kg: round(v.kg, 1),
      points: v.points,
      color: MATERIAL_META[material as keyof typeof MATERIAL_META].color,
    }))
    .sort((a, b) => b.kg - a.kg);
}
