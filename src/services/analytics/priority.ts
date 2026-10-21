import type {
  PriorityBreakdown,
  PriorityLevel,
  Report,
  ReportCategory,
  ReportSeverity,
} from '@/types';
import { clamp, round } from '@/utils/geo';

/**
 * Prototype priority scoring.
 *
 * The weights below are an illustrative heuristic built for the TownSync
 * demonstration build. They are not a validated municipal prioritisation model
 * and should be recalibrated against real township data before operational use.
 */

const CATEGORY_SAFETY_WEIGHT: Record<ReportCategory, number> = {
  pothole: 26,
  damaged_pavement: 20,
  streetlight: 22,
  drainage: 24,
  public_facility: 14,
  accessibility: 18,
  other: 10,
};

const CATEGORY_ACCESSIBILITY_WEIGHT: Record<ReportCategory, number> = {
  pothole: 4,
  damaged_pavement: 12,
  streetlight: 8,
  drainage: 6,
  public_facility: 8,
  accessibility: 20,
  other: 3,
};

const SEVERITY_WEIGHT: Record<ReportSeverity, number> = {
  low: 5,
  medium: 12,
  high: 20,
  critical: 25,
};

export interface PriorityInput {
  category: ReportCategory;
  severity: ReportSeverity;
  affectedResidents: number;
  isSafetyRelated: boolean;
  daysSinceSubmission: number;
  duplicateCount: number;
  supporterCount: number;
}

export function computePriority(input: PriorityInput): PriorityBreakdown {
  const safetyImpact = round(
    clamp(
      CATEGORY_SAFETY_WEIGHT[input.category] +
        (input.isSafetyRelated ? 12 : 0) +
        (input.severity === 'critical' ? 6 : 0),
      0,
      40,
    ),
    1,
  );

  const populationImpact = round(
    clamp(Math.log10(Math.max(1, input.affectedResidents)) * 11 + input.supporterCount * 1.6, 0, 25),
    1,
  );

  const accessibilityImpact = round(
    clamp(
      CATEGORY_ACCESSIBILITY_WEIGHT[input.category] + input.supporterCount * 0.8,
      0,
      20,
    ),
    1,
  );

  const severity = SEVERITY_WEIGHT[input.severity];

  const ageFactor = round(clamp(input.daysSinceSubmission * 1.35, 0, 15), 1);

  const duplicateFactor = round(clamp(input.duplicateCount * 4.5, 0, 10), 1);

  const total = round(
    safetyImpact + populationImpact + accessibilityImpact + severity + ageFactor + duplicateFactor,
    1,
  );

  let level: PriorityLevel = 'low';
  if (total >= 72) level = 'critical';
  else if (total >= 52) level = 'high';
  else if (total >= 32) level = 'medium';

  return {
    safetyImpact,
    populationImpact,
    accessibilityImpact,
    severity,
    ageFactor,
    duplicateFactor,
    total,
    level,
  };
}

export function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, (Date.now() - then) / 86_400_000);
}

/** Recomputes the live priority of a report (priority is never stored stale). */
export function recomputePriority(report: Report, safetyRelated: boolean): PriorityBreakdown {
  return computePriority({
    category: report.category,
    severity: report.severity,
    affectedResidents: report.affectedResidents,
    isSafetyRelated: safetyRelated,
    daysSinceSubmission: daysSince(report.reportedAt),
    duplicateCount: report.potentialDuplicates.length,
    supporterCount: report.supporters.length,
  });
}
