import type {
  AccessibilityObstacle,
  LatLng,
  MobilityProfileSpec,
  RouteEdge,
  RouteLeg,
  RouteNode,
  RouteResult,
  RouteStrategy,
  WalkwayCondition,
} from '@/types';
import { MOBILITY_PROFILES } from '@/utils/constants';
import { haversineMeters, round } from '@/utils/geo';
import { ROUTE_EDGES, ROUTE_NODES } from '@/data/township';

import { EMPTY_LIST } from '@/utils/empty';
/**
 * Prototype pedestrian routing engine.
 *
 * Implements A* over a seeded pedestrian graph. Edge cost is a weighted
 * combination of travel time, accessibility, walkway smoothness, shelter,
 * safety and live community-reported obstacles. The accessibility attribute
 * values are *prototype data* authored for the TownSync demonstration — they
 * are not sourced from an audited accessibility survey.
 */

/** Walking speed in metres per minute for each mobility profile. */
const SPEED_M_PER_MIN: Record<string, number> = {
  wheelchair: 42,
  older_adult: 52,
  stroller: 60,
  temporary_limitation: 48,
  general: 78,
};

export interface EdgeProfile {
  effectiveAccessibility: number;
  effectiveSafety: number;
  effectiveSmoothness: number;
  obstacleCount: number;
  obstacleSeverity: number;
  condition: WalkwayCondition;
  notes: string[];
}

export interface Graph {
  nodes: Map<string, RouteNode>;
  adjacency: Map<string, { edge: RouteEdge; to: string }[]>;
  profiles: Map<string, EdgeProfile>;
}

export function getMobilitySpec(profileId: string): MobilityProfileSpec {
  return MOBILITY_PROFILES.find((p) => p.id === profileId) ?? MOBILITY_PROFILES[4];
}

/** Applies live community obstacles on top of the static prototype attributes. */
export function computeEdgeProfile(
  edge: RouteEdge,
  obstacles: AccessibilityObstacle[],
): EdgeProfile {
  const active = obstacles.filter(
    (o) => o.edgeId === edge.id && o.status !== 'resolved',
  );
  const notes: string[] = [];

  let accessibility = edge.accessibilityScore;
  let safety = edge.safetyScore;
  let smoothness = edge.smoothness;
  let severity = 0;

  for (const obstacle of active) {
    severity += obstacle.severity;
    accessibility -= obstacle.severity * 42;
    smoothness -= obstacle.severity * 18;
    safety -= obstacle.severity * 16;
    notes.push(`${labelForObstacle(obstacle.category)} reported${obstacle.reportId ? ' via FixMyTown' : ''}`);
  }

  accessibility = Math.max(0, Math.min(100, accessibility));
  safety = Math.max(0, Math.min(100, safety));
  smoothness = Math.max(0, Math.min(100, smoothness));

  let condition: WalkwayCondition = 'good';
  if (edge.surfaceQuality >= 82 && accessibility >= 70) condition = 'good';
  else if (edge.surfaceQuality >= 68 && accessibility >= 50) condition = 'fair';
  else condition = 'poor';
  if (severity >= 0.75) condition = 'blocked';

  if (edge.surfaceNote) notes.push(edge.surfaceNote);
  if (edge.separatedWalkway) notes.push('Traffic-separated walkway');
  if (!edge.stepFree) notes.push('Contains steps — not step-free');
  if (edge.rampCount === 0) notes.push('No curb ramps recorded');

  return {
    effectiveAccessibility: round(accessibility, 0),
    effectiveSafety: round(safety, 0),
    effectiveSmoothness: round(smoothness, 0),
    obstacleCount: active.length,
    obstacleSeverity: round(severity, 2),
    condition,
    notes,
  };
}

function labelForObstacle(category: AccessibilityObstacle['category']): string {
  switch (category) {
    case 'broken_lift':
      return 'Broken lift';
    case 'damaged_ramp':
      return 'Damaged ramp';
    case 'blocked_pavement':
      return 'Blocked pavement';
    case 'missing_curb_ramp':
      return 'Missing curb ramp';
    case 'unsafe_crossing':
      return 'Unsafe crossing';
    case 'damaged_sidewalk':
      return 'Damaged sidewalk';
  }
}

export function buildGraph(obstacles: AccessibilityObstacle[]): Graph {
  const nodes = new Map(ROUTE_NODES.map((n) => [n.id, n]));
  const adjacency = new Map<string, { edge: RouteEdge; to: string }[]>();
  const profiles = new Map<string, EdgeProfile>();

  ROUTE_EDGES.forEach((edge) => {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    if (!adjacency.has(edge.to)) adjacency.set(edge.to, []);
    adjacency.get(edge.from)!.push({ edge, to: edge.to });
    adjacency.get(edge.to)!.push({ edge, to: edge.from });
    profiles.set(edge.id, computeEdgeProfile(edge, obstacles));
  });

  return { nodes, adjacency, profiles };
}

/** Cost of traversing an edge, in arbitrary units (lower is better). */
function edgeCost(
  edge: RouteEdge,
  profile: EdgeProfile,
  spec: MobilityProfileSpec,
  strategy: RouteStrategy,
  hardConstraints: boolean,
): number | null {
  const speed = SPEED_M_PER_MIN[spec.id] ?? 60;
  const timeMin = edge.distanceM / speed;

  if (hardConstraints) {
    if (spec.requireStepFree && !edge.stepFree) return null;
    if (spec.minAccessibility > 0 && profile.effectiveAccessibility < spec.minAccessibility) {
      return null;
    }
  }

  const accShortfall = (100 - profile.effectiveAccessibility) / 100;
  const smoothShortfall = (100 - profile.effectiveSmoothness) / 100;
  const shelterShortfall = (100 - edge.shelterScore) / 100;
  const safetyShortfall = (100 - profile.effectiveSafety) / 100;

  const w = spec.weights;

  let cost: number;
  switch (strategy) {
    case 'shortest':
      cost = timeMin * (1 + profile.obstacleSeverity * 0.35);
      break;
    case 'accessible':
      cost =
        timeMin *
        (w.distance * 0.6 +
          w.accessibility * accShortfall * 2.4 +
          w.smoothness * smoothShortfall * 1.1 +
          w.safety * safetyShortfall * 0.7 +
          profile.obstacleSeverity * 2.6);
      break;
    case 'comfortable':
    default:
      cost =
        timeMin *
        (w.distance * 0.55 +
          w.shelter * shelterShortfall * 1.8 +
          w.smoothness * smoothShortfall * 1.5 +
          w.safety * safetyShortfall * 1.2 +
          w.accessibility * accShortfall * 1.1 +
          profile.obstacleSeverity * 1.6);
      break;
  }

  if (edge.rampCount === 0 && strategy !== 'shortest') cost += 6;
  if (!edge.separatedWalkway && strategy === 'comfortable') cost += timeMin * 0.12;

  return cost;
}

interface SearchResult {
  nodeIds: string[];
  edgeIds: string[];
  cost: number;
}

/** A* search with an admissible distance heuristic. */
function astar(
  graph: Graph,
  startId: string,
  goalId: string,
  spec: MobilityProfileSpec,
  strategy: RouteStrategy,
  hardConstraints: boolean,
): SearchResult | null {
  const goal = graph.nodes.get(goalId);
  if (!goal) return null;

  const h = (nodeId: string) => {
    const node = graph.nodes.get(nodeId);
    if (!node) return 0;
    return haversineMeters(node.position, goal.position) / 1000;
  };

  const open = new Map<string, number>([[startId, h(startId)]]);
  const cameFrom = new Map<string, { node: string; edge: RouteEdge }>();
  const gScore = new Map<string, number>([[startId, 0]]);
  const closed = new Set<string>();
  const queue: string[] = [startId];

  while (queue.length > 0) {
    // Small graph — linear scan for the lowest f-score is sufficient.
    let bestIndex = 0;
    let bestF = Infinity;
    for (let i = 0; i < queue.length; i += 1) {
      const id = queue[i];
      const f = (gScore.get(id) ?? Infinity) + h(id);
      if (f < bestF) {
        bestF = f;
        bestIndex = i;
      }
    }
    const current = queue.splice(bestIndex, 1)[0];

    if (current === goalId) {
      const nodeIds: string[] = [current];
      const edgeIds: string[] = [];
      let cursor = current;
      while (cameFrom.has(cursor)) {
        const step = cameFrom.get(cursor)!;
        edgeIds.unshift(step.edge.id);
        nodeIds.unshift(step.node);
        cursor = step.node;
      }
      return { nodeIds, edgeIds, cost: gScore.get(current) ?? 0 };
    }

    closed.add(current);

    for (const { edge, to } of graph.adjacency.get(current) ?? EMPTY_LIST) {
      if (closed.has(to)) continue;
      const profile = graph.profiles.get(edge.id)!;
      const cost = edgeCost(edge, profile, spec, strategy, hardConstraints);
      if (cost === null) continue;
      const tentative = (gScore.get(current) ?? Infinity) + cost;
      if (tentative < (gScore.get(to) ?? Infinity)) {
        cameFrom.set(to, { node: current, edge });
        gScore.set(to, tentative);
        open.set(to, tentative + h(to));
        if (!queue.includes(to)) queue.push(to);
      }
    }
  }

  return null;
}

function buildLegs(graph: Graph, edgeIds: string[]): RouteLeg[] {
  return edgeIds.map((edgeId) => {
    const edge = ROUTE_EDGES.find((e) => e.id === edgeId)!;
    const profile = graph.profiles.get(edgeId)!;
    return {
      edgeId,
      from: edge.from,
      to: edge.to,
      distanceM: edge.distanceM,
      accessibilityScore: profile.effectiveAccessibility,
      obstacleCount: profile.obstacleCount,
      rampCount: edge.rampCount,
      shelterScore: edge.shelterScore,
      condition: profile.condition,
      notes: profile.notes,
    };
  });
}

export function findRoute(
  graph: Graph,
  startId: string,
  goalId: string,
  profileId: string,
  strategy: RouteStrategy,
): RouteResult | null {
  const spec = getMobilitySpec(profileId);

  let search = astar(graph, startId, goalId, spec, strategy, true);
  let relaxed = false;
  if (!search) {
    relaxed = true;
    search = astar(graph, startId, goalId, spec, strategy, false);
  }
  if (!search) return null;

  const legs = buildLegs(graph, search.edgeIds);
  const distanceM = legs.reduce((sum, l) => sum + l.distanceM, 0);
  const speed = SPEED_M_PER_MIN[spec.id] ?? 60;
  const rawMinutes = distanceM / speed;
  const obstacleCount = legs.reduce((s, l) => s + l.obstacleCount, 0);
  const rampCount = legs.reduce((s, l) => s + l.rampCount, 0);
  const degradedSegmentCount = legs.filter(
    (l) => l.condition === 'poor' || l.condition === 'blocked',
  ).length;

  const accessibilityScore =
    legs.length === 0
      ? 0
      : round(legs.reduce((s, l) => s + l.accessibilityScore, 0) / legs.length, 0);
  const comfortScore =
    legs.length === 0
      ? 0
      : round(
          legs.reduce((s, l) => s + l.shelterScore * 0.35 + l.accessibilityScore * 0.45, 0) /
            legs.length,
          0,
        );
  const safetyScore =
    legs.length === 0
      ? 0
      : round(
          legs.reduce((s, l) => s + (graph.profiles.get(l.edgeId)?.effectiveSafety ?? 0), 0) /
            legs.length,
          0,
        );

  const warnings: string[] = [];
  if (relaxed) {
    warnings.push(
      'No fully step-free path exists for this mobility profile — the best available alternative is shown.',
    );
  }
  if (obstacleCount > 0) {
    warnings.push(
      `${obstacleCount} community-reported obstacle${obstacleCount > 1 ? 's' : ''} on this path.`,
    );
  }
  if (degradedSegmentCount > 0) {
    warnings.push(
      `${degradedSegmentCount} segment${degradedSegmentCount > 1 ? 's' : ''} have degraded or blocked walkway condition.`,
    );
  }
  if (rampCount === 0) {
    warnings.push('No curb ramps are recorded along this route.');
  }

  return {
    strategy,
    label: STRATEGY_LABELS[strategy],
    description: STRATEGY_DESCRIPTIONS[strategy],
    nodeIds: search.nodeIds,
    legs,
    distanceM,
    durationMin: round(rawMinutes, 0),
    accessibilityScore,
    comfortScore,
    safetyScore,
    obstacleCount,
    rampCount,
    degradedSegmentCount,
    hasShelter: legs.some((l) => l.shelterScore >= 70),
    warnings,
  };
}

export const STRATEGY_LABELS: Record<RouteStrategy, string> = {
  shortest: 'Shortest Route',
  accessible: 'Most Accessible Route',
  comfortable: 'Most Comfortable Route',
};

export const STRATEGY_DESCRIPTIONS: Record<RouteStrategy, string> = {
  shortest: 'Minimises travel time with only hard obstacles avoided.',
  accessible: 'Prioritises step-free, ramped and obstacle-free segments.',
  comfortable: 'Balances shelter, smoothness, lighting and journey comfort.',
};

export function computeAllRoutes(
  graph: Graph,
  startId: string,
  goalId: string,
  profileId: string,
): RouteResult[] {
  const strategies: RouteStrategy[] = ['shortest', 'accessible', 'comfortable'];
  return strategies
    .map((s) => findRoute(graph, startId, goalId, profileId, s))
    .filter((r): r is RouteResult => r !== null);
}

/** Finds the closest route node to an arbitrary map coordinate. */
export function nearestNode(position: LatLng): RouteNode {
  let best = ROUTE_NODES[0];
  let bestDistance = Infinity;
  for (const node of ROUTE_NODES) {
    const d = haversineMeters(position, node.position);
    if (d < bestDistance) {
      bestDistance = d;
      best = node;
    }
  }
  return best;
}

export function routeGeometry(result: RouteResult): LatLng[] {
  return result.nodeIds
    .map((id) => ROUTE_NODES.find((n) => n.id === id)?.position)
    .filter((p): p is LatLng => Boolean(p));
}

export function nodeName(id: string): string {
  return ROUTE_NODES.find((n) => n.id === id)?.name ?? id;
}
