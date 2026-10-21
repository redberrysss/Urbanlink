import type { Report } from '@/types';
import { haversineMeters, round, textSimilarity } from '@/utils/geo';

export interface DuplicateSuggestion {
  reportId: string;
  score: number;
  reasons: string[];
  distanceM: number;
}

export interface DuplicateCandidate {
  category: string;
  title: string;
  description: string;
  position: { lat: number; lng: number };
}

/**
 * Prototype duplicate detection.
 *
 * Combines category match, geographic proximity and simple token-overlap text
 * similarity. Suggestions are surfaced to management for review — nothing is
 * ever deleted automatically.
 */
export function findPotentialDuplicates(
  candidate: DuplicateCandidate,
  existing: Report[],
  options: { excludeId?: string; radiusM?: number; threshold?: number } = {},
): DuplicateSuggestion[] {
  const radiusM = options.radiusM ?? 120;
  const threshold = options.threshold ?? 0.42;
  const results: DuplicateSuggestion[] = [];

  for (const report of existing) {
    if (report.id === options.excludeId) continue;
    if (report.status === 'rejected') continue;

    const distanceM = haversineMeters(candidate.position, report.position);
    const sameCategory = report.category === candidate.category;
    const similarity = textSimilarity(
      `${candidate.title} ${candidate.description}`,
      `${report.title} ${report.description}`,
    );

    let score = 0;
    const reasons: string[] = [];

    if (sameCategory) {
      score += 0.4;
      reasons.push('Same category');
    }
    if (distanceM <= radiusM) {
      score += 0.35 * (1 - distanceM / radiusM) + 0.1;
      reasons.push(`Within ${Math.round(distanceM)} m`);
    }
    if (similarity >= 0.25) {
      score += similarity * 0.5;
      reasons.push(`Similar description (${Math.round(similarity * 100)}%)`);
    }

    if (score >= threshold) {
      results.push({
        reportId: report.id,
        score: round(Math.min(1, score), 2),
        reasons,
        distanceM: Math.round(distanceM),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

/** Categories that are frequently reported as the same underlying defect. */
const RELATED_CATEGORY_GROUPS: string[][] = [
  ['damaged_pavement', 'accessibility'],
  ['pothole', 'damaged_pavement'],
  ['streetlight', 'other'],
];

export function areRelatedCategories(a: string, b: string): boolean {
  if (a === b) return true;
  return RELATED_CATEGORY_GROUPS.some((g) => g.includes(a) && g.includes(b));
}
