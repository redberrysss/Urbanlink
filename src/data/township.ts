import type { Place, RouteEdge, RouteNode, Township } from '@/types';
import { haversineMeters } from '@/utils/geo';

/**
 * PROTOTYPE GEOGRAPHY
 * --------------------
 * "Bandar Seri Damai" is a *simulated* Malaysian township used for the
 * TownSync demonstration build. Street names, landmarks and every coordinate
 * below are invented for demonstration purposes and do not describe a real
 * surveyed place. OpenStreetMap base tiles remain real; the accessibility
 * attributes attached to the route graph are prototype data authored for this
 * demo, not verified field survey results.
 */

export const TOWNSHIP: Township = {
  id: 'tw_seri_damai',
  name: 'Bandar Seri Damai',
  state: 'Selangor',
  country: 'Malaysia',
  center: { lat: 3.0645, lng: 101.5185 },
  bounds: [
    { lat: 3.0525, lng: 101.506 },
    { lat: 3.0775, lng: 101.532 },
  ],
  population: 42500,
  households: 11800,
  areaKm2: 6.4,
  simulated: true,
};

export const ROUTE_NODES: RouteNode[] = [
  { id: 'n1', name: 'Township North Gate', position: { lat: 3.0725, lng: 101.514 }, landmark: 'Main vehicular entrance with covered walkway canopy' },
  { id: 'n2', name: 'Bukit Indah Park — Main Gate', position: { lat: 3.0745, lng: 101.5205 }, landmark: 'Park ticketing and visitor centre' },
  { id: 'n3', name: 'Seri Damai Community Hub', position: { lat: 3.0715, lng: 101.5195 }, landmark: 'Community centre with medical and social services' },
  { id: 'n4', name: 'Damai Medical Centre', position: { lat: 3.07, lng: 101.515 }, landmark: '24-hour clinic entrance' },
  { id: 'n5', name: 'Taman Damai Playground', position: { lat: 3.068, lng: 101.522 }, landmark: 'Children play area with adjacent open lawn' },
  { id: 'n6', name: 'Damai Linear Park — North', position: { lat: 3.066, lng: 101.5265 }, landmark: 'Shaded cycling and walking corridor' },
  { id: 'n7', name: 'Bayu Perdana Primary School', position: { lat: 3.0685, lng: 101.516 }, landmark: 'School gate with morning drop-off peak' },
  { id: 'n8', name: 'Seri Damai Market', position: { lat: 3.0665, lng: 101.5135 }, landmark: 'Wet market and food stalls' },
  { id: 'n9', name: 'Damai Sports Complex', position: { lat: 3.063, lng: 101.516 }, landmark: 'Badminton centre, pool and stadium' },
  { id: 'n10', name: 'Emerald Residence — Block A', position: { lat: 3.0625, lng: 101.521 }, landmark: 'Accessible lobby with lift access' },
  { id: 'n11', name: 'Emerald Residence — Block C', position: { lat: 3.06, lng: 101.524 }, landmark: 'Long-stay flat blocks' },
  { id: 'n12', name: 'Damai Neighbourhood Mosque', position: { lat: 3.0645, lng: 101.5255 }, landmark: 'Surau and prayer hall' },
  { id: 'n13', name: 'Riverwalk Promenade', position: { lat: 3.0585, lng: 101.5285 }, landmark: 'Covered riverside boardwalk' },
  { id: 'n14', name: 'Damai Wetland Park', position: { lat: 3.057, lng: 101.5225 }, landmark: 'Retained wetland with boardwalk trails' },
  { id: 'n15', name: 'Grandmart Hypermarket', position: { lat: 3.0605, lng: 101.5115 }, landmark: 'Retail anchor with covered trolley bay' },
  { id: 'n16', name: 'Taman Reka Cycleway Hub', position: { lat: 3.063, lng: 101.5095 }, landmark: 'Bike-share station and repair kiosk' },
  { id: 'n17', name: 'Damai Food Court', position: { lat: 3.06, lng: 101.5175 }, landmark: 'Hawker centre with level open walkway' },
  { id: 'n18', name: 'Damai Transit Link', position: { lat: 3.056, lng: 101.5145 }, landmark: 'Elevated transit link to the Klang Valley line' },
  { id: 'n19', name: 'Damai Clinic 2', position: { lat: 3.064, lng: 101.51 }, landmark: 'Neighbourhood clinic with ramped entrance' },
  { id: 'n20', name: 'Perdana Heights Gate', position: { lat: 3.055, lng: 101.5205 }, landmark: 'Eastern township gate' },
  { id: 'n21', name: 'Palm Grove Housing', position: { lat: 3.059, lng: 101.527 }, landmark: 'Terrace housing rows' },
  { id: 'n22', name: 'Damai Kindergarden', position: { lat: 3.062, lng: 101.5245 }, landmark: 'Early years centre with buggy parking' },
  { id: 'n23', name: 'Wellness Park Entrance', position: { lat: 3.0655, lng: 101.528 }, landmark: 'Fitness trail and outdoor gym' },
  { id: 'n24', name: 'Damai Fire Station', position: { lat: 3.0575, lng: 101.511 }, landmark: 'Emergency services depot' },
];

const NODE_MAP = new Map(ROUTE_NODES.map((n) => [n.id, n]));

interface EdgeSeed {
  from: string;
  to: string;
  surfaceQuality: number;
  accessibilityScore: number;
  rampCount: number;
  shelterScore: number;
  safetyScore: number;
  smoothness: number;
  separatedWalkway: boolean;
  stepFree: boolean;
  surfaceNote: string;
}

const EDGE_SEEDS: EdgeSeed[] = [
  { from: 'n1', to: 'n2', surfaceQuality: 84, accessibilityScore: 78, rampCount: 2, shelterScore: 62, safetyScore: 74, smoothness: 80, separatedWalkway: true, stepFree: true, surfaceNote: 'Interlocking brick paving, level' },
  { from: 'n2', to: 'n3', surfaceQuality: 88, accessibilityScore: 86, rampCount: 2, shelterScore: 55, safetyScore: 82, smoothness: 88, separatedWalkway: true, stepFree: true, surfaceNote: 'Wide asphalt walkway' },
  { from: 'n3', to: 'n4', surfaceQuality: 80, accessibilityScore: 72, rampCount: 1, shelterScore: 48, safetyScore: 70, smoothness: 76, separatedWalkway: false, stepFree: true, surfaceNote: 'Concrete slab, slight crossfall' },
  { from: 'n3', to: 'n5', surfaceQuality: 90, accessibilityScore: 90, rampCount: 3, shelterScore: 72, safetyScore: 88, smoothness: 92, separatedWalkway: true, stepFree: true, surfaceNote: 'Park path with timber decking' },
  { from: 'n4', to: 'n7', surfaceQuality: 72, accessibilityScore: 64, rampCount: 1, shelterScore: 44, safetyScore: 58, smoothness: 70, separatedWalkway: false, stepFree: true, surfaceNote: 'Asphalt, kerb edges unmarked' },
  { from: 'n5', to: 'n6', surfaceQuality: 86, accessibilityScore: 84, rampCount: 2, shelterScore: 86, safetyScore: 80, smoothness: 85, separatedWalkway: true, stepFree: true, surfaceNote: 'Shaded linear park path' },
  { from: 'n6', to: 'n23', surfaceQuality: 92, accessibilityScore: 93, rampCount: 4, shelterScore: 78, safetyScore: 90, smoothness: 93, separatedWalkway: true, stepFree: true, surfaceNote: 'Cycling strip separated by planter' },
  { from: 'n7', to: 'n8', surfaceQuality: 66, accessibilityScore: 58, rampCount: 1, shelterScore: 32, safetyScore: 52, smoothness: 62, separatedWalkway: false, stepFree: true, surfaceNote: 'Worn asphalt with patched cracks' },
  { from: 'n7', to: 'n17', surfaceQuality: 74, accessibilityScore: 68, rampCount: 2, shelterScore: 50, safetyScore: 62, smoothness: 72, separatedWalkway: false, stepFree: true, surfaceNote: 'Concrete paving' },
  { from: 'n8', to: 'n15', surfaceQuality: 78, accessibilityScore: 70, rampCount: 2, shelterScore: 58, safetyScore: 66, smoothness: 74, separatedWalkway: true, stepFree: true, surfaceNote: 'Retail frontage walkway' },
  { from: 'n8', to: 'n19', surfaceQuality: 68, accessibilityScore: 56, rampCount: 1, shelterScore: 28, safetyScore: 60, smoothness: 60, separatedWalkway: false, stepFree: false, surfaceNote: 'Narrow footpath, 3 steps near clinic' },
  { from: 'n15', to: 'n16', surfaceQuality: 82, accessibilityScore: 76, rampCount: 3, shelterScore: 40, safetyScore: 72, smoothness: 80, separatedWalkway: true, stepFree: true, surfaceNote: 'Painted carriageway with covered walkway' },
  { from: 'n16', to: 'n18', surfaceQuality: 70, accessibilityScore: 62, rampCount: 2, shelterScore: 36, safetyScore: 58, smoothness: 66, separatedWalkway: true, stepFree: true, surfaceNote: 'Along collector road' },
  { from: 'n18', to: 'n24', surfaceQuality: 76, accessibilityScore: 70, rampCount: 2, shelterScore: 34, safetyScore: 64, smoothness: 72, separatedWalkway: true, stepFree: true, surfaceNote: 'Transit plaza approach' },
  { from: 'n24', to: 'n15', surfaceQuality: 80, accessibilityScore: 74, rampCount: 3, shelterScore: 42, safetyScore: 70, smoothness: 78, separatedWalkway: true, stepFree: true, surfaceNote: 'Fire station frontage' },
  { from: 'n17', to: 'n9', surfaceQuality: 88, accessibilityScore: 88, rampCount: 3, shelterScore: 66, safetyScore: 86, smoothness: 90, separatedWalkway: true, stepFree: true, surfaceNote: 'Wide level promenade' },
  { from: 'n17', to: 'n19', surfaceQuality: 64, accessibilityScore: 52, rampCount: 1, shelterScore: 24, safetyScore: 48, smoothness: 56, separatedWalkway: false, stepFree: false, surfaceNote: 'Uneven gravel shoulder' },
  { from: 'n9', to: 'n10', surfaceQuality: 84, accessibilityScore: 80, rampCount: 3, shelterScore: 52, safetyScore: 78, smoothness: 82, separatedWalkway: true, stepFree: true, surfaceNote: 'Sports complex perimeter' },
  { from: 'n9', to: 'n16', surfaceQuality: 72, accessibilityScore: 64, rampCount: 2, shelterScore: 30, safetyScore: 60, smoothness: 66, separatedWalkway: true, stepFree: true, surfaceNote: 'Connector with painted buffer' },
  { from: 'n10', to: 'n11', surfaceQuality: 86, accessibilityScore: 84, rampCount: 4, shelterScore: 60, safetyScore: 82, smoothness: 86, separatedWalkway: true, stepFree: true, surfaceNote: 'Covered link between blocks' },
  { from: 'n11', to: 'n12', surfaceQuality: 78, accessibilityScore: 72, rampCount: 2, shelterScore: 56, safetyScore: 70, smoothness: 74, separatedWalkway: false, stepFree: true, surfaceNote: 'Mosaic paving, level' },
  { from: 'n11', to: 'n22', surfaceQuality: 88, accessibilityScore: 90, rampCount: 4, shelterScore: 68, safetyScore: 86, smoothness: 92, separatedWalkway: true, stepFree: true, surfaceNote: 'Flat shared path, buggy friendly' },
  { from: 'n10', to: 'n22', surfaceQuality: 84, accessibilityScore: 82, rampCount: 3, shelterScore: 58, safetyScore: 78, smoothness: 84, separatedWalkway: true, stepFree: true, surfaceNote: 'Path beside Emerald Residence' },
  { from: 'n12', to: 'n13', surfaceQuality: 76, accessibilityScore: 68, rampCount: 2, shelterScore: 74, safetyScore: 66, smoothness: 70, separatedWalkway: true, stepFree: true, surfaceNote: 'Covered boardwalk entry' },
  { from: 'n13', to: 'n21', surfaceQuality: 90, accessibilityScore: 92, rampCount: 5, shelterScore: 88, safetyScore: 90, smoothness: 94, separatedWalkway: true, stepFree: true, surfaceNote: 'Fully covered riverside boardwalk' },
  { from: 'n13', to: 'n20', surfaceQuality: 82, accessibilityScore: 78, rampCount: 3, shelterScore: 70, safetyScore: 74, smoothness: 80, separatedWalkway: true, stepFree: true, surfaceNote: 'Promenade to east gate' },
  { from: 'n21', to: 'n23', surfaceQuality: 84, accessibilityScore: 82, rampCount: 3, shelterScore: 70, safetyScore: 76, smoothness: 82, separatedWalkway: true, stepFree: true, surfaceNote: 'Terrace row frontage' },
  { from: 'n23', to: 'n5', surfaceQuality: 88, accessibilityScore: 89, rampCount: 4, shelterScore: 76, safetyScore: 86, smoothness: 90, separatedWalkway: true, stepFree: true, surfaceNote: 'Wellness trail through lawn' },
  { from: 'n22', to: 'n14', surfaceQuality: 76, accessibilityScore: 68, rampCount: 2, shelterScore: 52, safetyScore: 64, smoothness: 70, separatedWalkway: true, stepFree: true, surfaceNote: 'Wetland approach, gentle slope' },
  { from: 'n14', to: 'n20', surfaceQuality: 70, accessibilityScore: 58, rampCount: 1, shelterScore: 44, safetyScore: 56, smoothness: 62, separatedWalkway: false, stepFree: true, surfaceNote: 'Unpaved track, seasonal mud' },
  { from: 'n6', to: 'n12', surfaceQuality: 80, accessibilityScore: 76, rampCount: 2, shelterScore: 66, safetyScore: 74, smoothness: 78, separatedWalkway: true, stepFree: true, surfaceNote: 'Linear park link to surau' },
  { from: 'n3', to: 'n23', surfaceQuality: 82, accessibilityScore: 80, rampCount: 3, shelterScore: 64, safetyScore: 76, smoothness: 80, separatedWalkway: true, stepFree: true, surfaceNote: 'Cross-park promenade' },
  { from: 'n1', to: 'n4', surfaceQuality: 78, accessibilityScore: 70, rampCount: 2, shelterScore: 50, safetyScore: 66, smoothness: 74, separatedWalkway: false, stepFree: true, surfaceNote: 'Entrance boulevard' },
  { from: 'n1', to: 'n7', surfaceQuality: 72, accessibilityScore: 64, rampCount: 1, shelterScore: 40, safetyScore: 60, smoothness: 68, separatedWalkway: false, stepFree: true, surfaceNote: 'Shared road edge' },
  { from: 'n14', to: 'n18', surfaceQuality: 66, accessibilityScore: 54, rampCount: 1, shelterScore: 30, safetyScore: 52, smoothness: 58, separatedWalkway: false, stepFree: false, surfaceNote: 'Old drainage path, uneven' },
  { from: 'n2', to: 'n5', surfaceQuality: 74, accessibilityScore: 70, rampCount: 2, shelterScore: 80, safetyScore: 78, smoothness: 72, separatedWalkway: true, stepFree: true, surfaceNote: 'Canopy walkway through park' },
];

export const ROUTE_EDGES: RouteEdge[] = EDGE_SEEDS.map((seed, i) => {
  const from = NODE_MAP.get(seed.from)!;
  const to = NODE_MAP.get(seed.to)!;
  const distanceM = Math.round(haversineMeters(from.position, to.position));
  return {
    id: `e${String(i + 1).padStart(2, '0')}`,
    from: seed.from,
    to: seed.to,
    distanceM,
    surfaceQuality: seed.surfaceQuality,
    accessibilityScore: seed.accessibilityScore,
    rampCount: seed.rampCount,
    shelterScore: seed.shelterScore,
    safetyScore: seed.safetyScore,
    smoothness: seed.smoothness,
    separatedWalkway: seed.separatedWalkway,
    stepFree: seed.stepFree,
    obstacleIds: [],
    surfaceNote: seed.surfaceNote,
  };
});

export const PLACES: Place[] = [
  { id: 'p1', name: 'Township North Gate', kind: 'transit', lat: 3.0725, lng: 101.514, description: 'Primary vehicular entry point.' },
  { id: 'p2', name: 'Seri Damai Community Hub', kind: 'facility', lat: 3.0715, lng: 101.5195, description: 'Primary civic services node.' },
  { id: 'p3', name: 'Bukit Indah Park', kind: 'recreation', lat: 3.0745, lng: 101.5205, description: 'Hilltop park and wellness trail.' },
  { id: 'p4', name: 'Seri Damai Market', kind: 'commercial', lat: 3.0665, lng: 101.5135, description: 'Daily wet market and food stalls.' },
  { id: 'p5', name: 'Grandmart Hypermarket', kind: 'commercial', lat: 3.0605, lng: 101.5115, description: 'Retail anchor store.' },
  { id: 'p6', name: 'Damai Sports Complex', kind: 'facility', lat: 3.063, lng: 101.516, description: 'Sports and community centre.' },
  { id: 'p7', name: 'Emerald Residence', kind: 'residential', lat: 3.0625, lng: 101.521, description: 'Mixed-rise accessible housing blocks.' },
  { id: 'p8', name: 'Damai Transit Link', kind: 'transit', lat: 3.056, lng: 101.5145, description: 'Elevated rail connection.' },
  { id: 'p9', name: 'Damai Wetland Park', kind: 'recreation', lat: 3.057, lng: 101.5225, description: 'Retained wetland boardwalk.' },
  { id: 'p10', name: 'Riverwalk Promenade', kind: 'recreation', lat: 3.0585, lng: 101.5285, description: 'Covered riverside walkway.' },
  { id: 'p11', name: 'Perdana Heights Gate', kind: 'transit', lat: 3.055, lng: 101.5205, description: 'Eastern entry point.' },
  { id: 'p12', name: 'Bayu Perdana Primary School', kind: 'facility', lat: 3.0685, lng: 101.516, description: 'Community school.' },
];


export const ROUTE_NODE_MAP = NODE_MAP;
export const EDGE_MAP = new Map(ROUTE_EDGES.map((e) => [e.id, e]));
export const EDGE_BY_PAIR = new Map(
  ROUTE_EDGES.map((e) => [`${e.from}|${e.to}`, e] as const),
);
export function getEdgeBetween(a: string, b: string): RouteEdge | undefined {
  return EDGE_BY_PAIR.get(`${a}|${b}`) ?? EDGE_BY_PAIR.get(`${b}|${a}`);
}
