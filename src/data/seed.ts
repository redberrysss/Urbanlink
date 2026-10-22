import type {
  AccessibilityObstacle,
  Achievement,
  AppNotification,
  MaintenanceTask,
  MaintenanceTeam,
  RecyclingActivity,
  RecyclingGuideItem,
  RecyclingStation,
  Report,
  ReportTimelineEntry,
  SafetyHazard,
  User,
} from '@/types';
import { daysAgo, round } from '@/utils/geo';
import { TOWNSHIP_NOTICE_RECIPIENT } from '@/utils/constants';
import { demoPhoto } from '@/utils/placeholderImage';
import { computePriority } from '@/services/analytics/priority';
import { ROUTE_EDGES, ROUTE_NODE_MAP } from './township';

import { EMPTY_LIST } from '@/utils/empty';
/* ------------------------------------------------------------------ *
 * People
 * ------------------------------------------------------------------ */

export const DEMO_USERS: User[] = [
  {
    id: 'u_resident',
    name: 'Nur Aisyah Rahman',
    email: 'resident@townsync.demo',
    role: 'resident',
    points: 640,
    block: 'Emerald Residence Block B',
    phone: '+6012-555 0148',
    joinedAt: daysAgo(240),
    isDemo: true,
  },
  {
    id: 'u_admin',
    name: 'Ir. Farhan Ismail',
    email: 'admin@townsync.demo',
    role: 'admin',
    points: 0,
    block: 'Township Office',
    phone: '+603-5511 2400',
    joinedAt: daysAgo(520),
    isDemo: true,
  },
  {
    id: 'u_maintenance',
    name: 'Lim Wei Jian',
    email: 'maintenance@townsync.demo',
    role: 'maintenance',
    points: 120,
    block: 'Depot 2',
    phone: '+6012-555 0771',
    joinedAt: daysAgo(400),
    isDemo: true,
    teamId: 'team_a',
    specialties: ['accessibility', 'damaged_pavement'],
  },
  {
    id: 'u_operator',
    name: 'Siti Hajar Yusof',
    email: 'operator@townsync.demo',
    role: 'operator',
    points: 0,
    block: 'Recycling Centre',
    phone: '+6012-555 0912',
    joinedAt: daysAgo(360),
    isDemo: true,
  },
  { id: 'u_r2', name: 'Ahmed Danish Hakim', email: 'danish@residents.demo', role: 'resident', points: 1180, block: 'Palm Grove Row 7', joinedAt: daysAgo(300) },
  { id: 'u_r3', name: 'Tan Mei Ling', email: 'meiling@residents.demo', role: 'resident', points: 985, block: 'Emerald Residence Block C', joinedAt: daysAgo(280) },
  { id: 'u_r4', name: 'Kumar Selvan', email: 'selvan@residents.demo', role: 'resident', points: 760, block: 'Damai Residence 12', joinedAt: daysAgo(260) },
  { id: 'u_r5', name: 'Priya Anandan', email: 'priya@residents.demo', role: 'resident', points: 615, block: 'Bayu Perdana Court', joinedAt: daysAgo(210) },
  { id: 'u_r6', name: 'Wong Wai Ming', email: 'waiming@residents.demo', role: 'resident', points: 520, block: 'Palm Grove Row 3', joinedAt: daysAgo(190) },
  { id: 'u_r7', name: 'Farah Adilah', email: 'farah@residents.demo', role: 'resident', points: 430, block: 'Emerald Residence Block A', joinedAt: daysAgo(160) },
  { id: 'u_r8', name: 'Devi Rani', email: 'devi@residents.demo', role: 'resident', points: 355, block: 'Perdana Heights', joinedAt: daysAgo(140) },
  { id: 'u_r9', name: 'Zulkifli Hamid', email: 'zulkifli@residents.demo', role: 'resident', points: 290, block: 'Taman Reka Court', joinedAt: daysAgo(120) },
  { id: 'u_r10', name: 'Nurul Izzati', email: 'izzati@residents.demo', role: 'resident', points: 205, block: 'Emerald Residence Block D', joinedAt: daysAgo(90) },
];

export const MAINTENANCE_TEAMS: MaintenanceTeam[] = [
  {
    id: 'team_a',
    name: 'Team A — Accessible Paths',
    lead: 'Lim Wei Jian',
    members: 6,
    specialty: ['accessibility', 'damaged_pavement'],
    activeTasks: 4,
    resolvedThisMonth: 17,
    avgResolutionHours: 46,
    color: '#176B5B',
  },
  {
    id: 'team_b',
    name: 'Team B — Road & Drainage',
    lead: 'Ramesh Rajoo',
    members: 8,
    specialty: ['pothole', 'drainage'],
    activeTasks: 6,
    resolvedThisMonth: 23,
    avgResolutionHours: 61,
    color: '#0EA5E9',
  },
  {
    id: 'team_c',
    name: 'Team C — Lighting & Electrical',
    lead: 'Suhaila Nor',
    members: 5,
    specialty: ['streetlight', 'public_facility'],
    activeTasks: 3,
    resolvedThisMonth: 14,
    avgResolutionHours: 38,
    color: '#F59E0B',
  },
  {
    id: 'team_d',
    name: 'Team D — General Works',
    lead: 'Bala Krishnan',
    members: 7,
    specialty: ['other', 'public_facility'],
    activeTasks: 2,
    resolvedThisMonth: 11,
    avgResolutionHours: 72,
    color: '#7C3AED',
  },
];

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

let tlCounter = 0;
function tl(
  at: string,
  actorId: string,
  actorName: string,
  actorRole: ReportTimelineEntry['actorRole'],
  type: ReportTimelineEntry['type'],
  note: string,
  extra: Partial<ReportTimelineEntry> = {},
): ReportTimelineEntry {
  tlCounter += 1;
  return {
    id: `tl_${tlCounter}`,
    at,
    actorId,
    actorName,
    actorRole,
    type,
    note,
    ...extra,
  };
}

interface ReportSeed {
  id: string;
  ref: string;
  title: string;
  description: string;
  category: Report['category'];
  severity: Report['severity'];
  status: Report['status'];
  lat: number;
  lng: number;
  address: string;
  reportedBy: string;
  reportedByName: string;
  daysAgo: number;
  affected: number;
  tags: string[];
  supporters?: string[];
  assignedTeamId?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  resolvedDaysAgo?: number;
  safetyHazardId?: string;
  obstacleId?: string;
  photoHue?: number;
  duplicateOf?: string;
}

const REPORT_SEEDS: ReportSeed[] = [
  {
    id: 'r01',
    ref: 'TS-2601-00001',
    title: 'Deep pothole cluster at sports complex entrance',
    description:
      'Three connected potholes about 40 cm wide right at the drop-off junction beside the badminton centre. A wheelchair user tipped over on Tuesday morning and the kerb has no markings left.',
    category: 'pothole',
    severity: 'high',
    status: 'resolved',
    lat: 3.0632,
    lng: 101.5159,
    address: 'Jalan Damai Sukan, beside main car park entrance',
    reportedBy: 'u_r3',
    reportedByName: 'Tan Mei Ling',
    daysAgo: 26,
    affected: 210,
    tags: ['wheelchair', 'school-rush'],
    supporters: ['u_r5', 'u_r7'],
    assignedTeamId: 'team_b',
    assignedStaffId: 'u_maintenance',
    assignedStaffName: 'Lim Wei Jian',
    resolvedDaysAgo: 19,
    photoHue: 18,
  },
  {
    id: 'r02',
    ref: 'TS-2601-00002',
    title: 'Streetlight out along Riverwalk Promenade',
    description:
      'Four lamp posts are dark between the mosque and the promenade. At night the boardwalk is completely unlit and it is the only step-free route to the bus route.',
    category: 'streetlight',
    severity: 'high',
    status: 'in_progress',
    lat: 3.0587,
    lng: 101.5283,
    address: 'Riverwalk Promenade, between Surau and boardwalk',
    reportedBy: 'u_resident',
    reportedByName: 'Nur Aisyah Rahman',
    daysAgo: 11,
    affected: 340,
    tags: ['night-safety', 'step-free'],
    supporters: ['u_r2', 'u_r3', 'u_r8', 'u_r9'],
    assignedTeamId: 'team_c',
    assignedStaffId: 'u_maintenance',
    assignedStaffName: 'Lim Wei Jian',
    safetyHazardId: 'h01',
    photoHue: 42,
  },
  {
    id: 'r03',
    ref: 'TS-2601-00003',
    title: 'Damaged access ramp at Emerald Residence Block A',
    description:
      'The ramp from the visitor bay up to the Block A lobby has a collapsed section on the left side. The temporary plank is loose and the gradient is far too steep for a wheelchair.',
    category: 'accessibility',
    severity: 'critical',
    status: 'assigned',
    lat: 3.0626,
    lng: 101.5211,
    address: 'Emerald Residence Block A, visitor car park ramp',
    reportedBy: 'u_r7',
    reportedByName: 'Farah Adilah',
    daysAgo: 8,
    affected: 95,
    tags: ['ramp', 'wheelchair', 'seniors'],
    supporters: ['u_r3', 'u_r5', 'u_r10', 'u_resident'],
    assignedTeamId: 'team_a',
    assignedStaffId: 'u_maintenance',
    assignedStaffName: 'Lim Wei Jian',
    obstacleId: 'ob01',
    photoHue: 150,
  },
  {
    id: 'r04',
    ref: 'TS-2601-00004',
    title: 'Drain overflowing in front of Grandmart',
    description:
      'The open drain in front of the hypermarket backs up every time it rains. Water pools across the covered walkway and pushes shoppers onto the road.',
    category: 'drainage',
    severity: 'medium',
    status: 'under_review',
    lat: 3.0603,
    lng: 101.5117,
    address: 'Grandmart Hypermarket, front entrance drain',
    reportedBy: 'u_r6',
    reportedByName: 'Wong Wai Ming',
    daysAgo: 6,
    affected: 480,
    tags: ['flooding', 'retail'],
    supporters: ['u_r9'],
    photoHue: 205,
  },
  {
    id: 'r05',
    ref: 'TS-2601-00005',
    title: 'Pedestrian crossing markings gone at school gate',
    description:
      'The zebra crossing outside Bayu Perdana Primary has almost no paint left. During the 7am drop-off it is chaotic and the traffic marshal has left.',
    category: 'accessibility',
    severity: 'high',
    status: 'pending',
    lat: 3.0684,
    lng: 101.5162,
    address: 'Bayu Perdana Primary School, east gate crossing',
    reportedBy: 'u_r5',
    reportedByName: 'Priya Anandan',
    daysAgo: 4,
    affected: 260,
    tags: ['school', 'children'],
    supporters: ['u_r6', 'u_r8'],
    photoHue: 275,
  },
  {
    id: 'r06',
    ref: 'TS-2601-00006',
    title: 'Cracked pavement slabs at Taman Reka cycleway',
    description:
      'Six interlocking slabs have lifted and now trip height of about 4 cm across the cycleway approach. Clear hazard for wheelchairs and prams.',
    category: 'damaged_pavement',
    severity: 'medium',
    status: 'resolved',
    lat: 3.0631,
    lng: 101.5097,
    address: 'Taman Reka Cycleway Hub, northern approach',
    reportedBy: 'u_r9',
    reportedByName: 'Zulkifli Hamid',
    daysAgo: 34,
    affected: 140,
    tags: ['cycleway'],
    supporters: ['u_r4'],
    assignedTeamId: 'team_a',
    assignedStaffId: 'u_maintenance',
    assignedStaffName: 'Lim Wei Jian',
    resolvedDaysAgo: 27,
    photoHue: 120,
  },
  {
    id: 'r07',
    ref: 'TS-2601-00007',
    title: 'Park path lighting dead for two weeks',
    description:
      'The stretch of the Bukit Indah canopy walkway towards the playground has not been lit for a fortnight. Very isolated after sunset.',
    category: 'streetlight',
    severity: 'medium',
    status: 'pending',
    lat: 3.0731,
    lng: 101.5212,
    address: 'Bukit Indah Park, canopy walkway to playground',
    reportedBy: 'u_r4',
    reportedByName: 'Kumar Selvan',
    daysAgo: 9,
    affected: 190,
    tags: ['park', 'night-safety'],
    supporters: ['u_r2'],
    photoHue: 45,
  },
  {
    id: 'r08',
    ref: 'TS-2601-00008',
    title: 'Public lift out of service at Damai Medical Centre',
    description:
      'The only lift serving the second floor of the clinic has been out of order since last week. Wheelchair users must be carried up the stairs by porters.',
    category: 'public_facility',
    severity: 'critical',
    status: 'in_progress',
    lat: 3.0699,
    lng: 101.5151,
    address: 'Damai Medical Centre, main atrium lift',
    reportedBy: 'u_resident',
    reportedByName: 'Nur Aisyah Rahman',
    daysAgo: 5,
    affected: 160,
    tags: ['lift', 'medical', 'wheelchair'],
    supporters: ['u_r3', 'u_r7', 'u_r8', 'u_r10', 'u_r5'],
    assignedTeamId: 'team_c',
    assignedStaffId: 'u_maintenance',
    assignedStaffName: 'Lim Wei Jian',
    obstacleId: 'ob02',
    photoHue: 330,
  },
  {
    id: 'r09',
    ref: 'TS-2601-00009',
    title: 'Pothole on main township road',
    description: 'Moderate pothole in the nearside lane outside the community hub.',
    category: 'pothole',
    severity: 'medium',
    status: 'resolved',
    lat: 3.0712,
    lng: 101.5193,
    address: 'Jalan Seri Damai, opposite community hub',
    reportedBy: 'u_r2',
    reportedByName: 'Ahmed Danish Hakim',
    daysAgo: 47,
    affected: 320,
    tags: [],
    supporters: ['u_r4'],
    assignedTeamId: 'team_b',
    resolvedDaysAgo: 41,
    photoHue: 25,
  },
  {
    id: 'r10',
    ref: 'TS-2601-00010',
    title: 'Pavement blocked by illegal parking at food court',
    description:
      'Delivery vans park across the footpath every evening, leaving barely 40 cm for pedestrians. The remaining strip has an open drain on one side.',
    category: 'accessibility',
    severity: 'medium',
    status: 'under_review',
    lat: 3.0601,
    lng: 101.5177,
    address: 'Damai Food Court, east footpath',
    reportedBy: 'u_r8',
    reportedByName: 'Devi Rani',
    daysAgo: 13,
    affected: 230,
    tags: ['enforcement', 'footpath'],
    supporters: ['u_r6', 'u_r10'],
    photoHue: 350,
  },
  {
    id: 'r11',
    ref: 'TS-2601-00011',
    title: 'Drainage blockage flooding wetland boardwalk',
    description:
      'The boardwalk decking floods ankle deep after every heavy shower. The silt trap at the wetland entrance is completely choked.',
    category: 'drainage',
    severity: 'high',
    status: 'assigned',
    lat: 3.0572,
    lng: 101.5223,
    address: 'Damai Wetland Park, boardwalk entrance',
    reportedBy: 'u_r10',
    reportedByName: 'Nurul Izzati',
    daysAgo: 16,
    affected: 150,
    tags: ['flooding', 'boardwalk'],
    supporters: ['u_r3', 'u_r8'],
    assignedTeamId: 'team_b',
    safetyHazardId: 'h03',
    photoHue: 195,
  },
  {
    id: 'r12',
    ref: 'TS-2601-00012',
    title: 'Streetlight flickering above food court tables',
    description: 'The lamp above the outdoor tables flickers constantly and is distracting at night.',
    category: 'streetlight',
    severity: 'low',
    status: 'resolved',
    lat: 3.0602,
    lng: 101.5174,
    address: 'Damai Food Court, outdoor seating',
    reportedBy: 'u_r9',
    reportedByName: 'Zulkifli Hamid',
    daysAgo: 40,
    affected: 120,
    tags: [],
    assignedTeamId: 'team_c',
    resolvedDaysAgo: 35,
    photoHue: 50,
  },
  {
    id: 'r13',
    ref: 'TS-2601-00013',
    title: 'Missing curb ramp at market crossing',
    description:
      'There is no dropped kerb on the market side of the crossing. The kerb is a full 15 cm straight drop with a drainage grate right in the middle.',
    category: 'accessibility',
    severity: 'high',
    status: 'pending',
    lat: 3.0663,
    lng: 101.5137,
    address: 'Seri Damai Market, market-side crossing',
    reportedBy: 'u_resident',
    reportedByName: 'Nur Aisyah Rahman',
    daysAgo: 3,
    affected: 260,
    tags: ['curb-ramp', 'market'],
    supporters: ['u_r5', 'u_r7'],
    obstacleId: 'ob04',
    photoHue: 95,
  },
  {
    id: 'r14',
    ref: 'TS-2601-00014',
    title: 'Broken swing set at Taman Damai playground',
    description: 'One of the toddler swings has a cracked frame and the seat strap is frayed.',
    category: 'public_facility',
    severity: 'medium',
    status: 'resolved',
    lat: 3.0679,
    lng: 101.5219,
    address: 'Taman Damai Playground, toddler swing set',
    reportedBy: 'u_r5',
    reportedByName: 'Priya Anandan',
    daysAgo: 30,
    affected: 90,
    tags: ['children', 'playground'],
    assignedTeamId: 'team_d',
    resolvedDaysAgo: 24,
    photoHue: 100,
  },
  {
    id: 'r15',
    ref: 'TS-2601-00015',
    title: 'Unsafe crossing at Perdana Heights gate',
    description:
      'Cars routinely ignore the give-way markings at the gate crossing and there is no lighting at all after 7pm. Very dangerous for anyone on foot.',
    category: 'accessibility',
    severity: 'critical',
    status: 'in_progress',
    lat: 3.0552,
    lng: 101.5204,
    address: 'Perdana Heights Gate, main pedestrian crossing',
    reportedBy: 'u_r8',
    reportedByName: 'Devi Rani',
    daysAgo: 7,
    affected: 380,
    tags: ['crossing', 'night-safety'],
    supporters: ['u_r2', 'u_r3', 'u_r6', 'u_r9', 'u_resident'],
    assignedTeamId: 'team_a',
    assignedStaffId: 'u_maintenance',
    assignedStaffName: 'Lim Wei Jian',
    safetyHazardId: 'h04',
    obstacleId: 'ob05',
    photoHue: 10,
  },
  {
    id: 'r16',
    ref: 'TS-2601-00016',
    title: 'Deep pothole near transit link plaza',
    description: 'Large broken patch of road surface where the shuttle turns into the plaza.',
    category: 'pothole',
    severity: 'high',
    status: 'resolved',
    lat: 3.0562,
    lng: 101.5147,
    address: 'Damai Transit Link, shuttle turning bay',
    reportedBy: 'u_r4',
    reportedByName: 'Kumar Selvan',
    daysAgo: 21,
    affected: 300,
    tags: ['transit'],
    supporters: ['u_r9'],
    assignedTeamId: 'team_b',
    resolvedDaysAgo: 15,
    photoHue: 30,
  },
  {
    id: 'r17',
    ref: 'TS-2601-00017',
    title: 'Damaged sidewalk along Palm Grove row',
    description:
      'The kerb-side pavement has collapsed along row 7. Loose tiles and an open edge — impossible to pass with a pram.',
    category: 'damaged_pavement',
    severity: 'medium',
    status: 'under_review',
    lat: 3.0589,
    lng: 101.5269,
    address: 'Palm Grove Housing, row 7 kerb-side walkway',
    reportedBy: 'u_r6',
    reportedByName: 'Wong Wai Ming',
    daysAgo: 10,
    affected: 175,
    tags: ['housing'],
    supporters: ['u_r8'],
    safetyHazardId: 'h02',
    obstacleId: 'ob06',
    photoHue: 88,
  },
  {
    id: 'r18',
    ref: 'TS-2601-00018',
    title: 'Water pooling at transit plaza underpass',
    description: 'The underpass ramp floods during monsoon mornings and the pumps take hours to clear it.',
    category: 'drainage',
    severity: 'high',
    status: 'under_review',
    lat: 3.0563,
    lng: 101.5142,
    address: 'Damai Transit Link, pedestrian underpass ramp',
    reportedBy: 'u_resident',
    reportedByName: 'Nur Aisyah Rahman',
    daysAgo: 18,
    affected: 410,
    tags: ['flooding', 'transit'],
    supporters: ['u_r3', 'u_r5'],
    safetyHazardId: 'h06',
    photoHue: 210,
  },
  {
    id: 'r19',
    ref: 'TS-2601-00019',
    title: 'Broken bench and overflowing bin at food court',
    description: 'One of the timber benches has a missing slat and the bin next to it is always full.',
    category: 'public_facility',
    severity: 'low',
    status: 'resolved',
    lat: 3.0599,
    lng: 101.5178,
    address: 'Damai Food Court, west seating area',
    reportedBy: 'u_r10',
    reportedByName: 'Nurul Izzati',
    daysAgo: 44,
    affected: 85,
    tags: [],
    assignedTeamId: 'team_d',
    resolvedDaysAgo: 38,
    photoHue: 140,
  },
  {
    id: 'r20',
    ref: 'TS-2601-00020',
    title: 'Streetlight column damaged after vehicle collision',
    description:
      'A van clipped the column on Jalan Seri Damai and the lamp is hanging at an angle, arcing onto the carriageway at night.',
    category: 'streetlight',
    severity: 'high',
    status: 'assigned',
    lat: 3.0723,
    lng: 101.5143,
    address: 'Township North Gate, Jalan Seri Damai',
    reportedBy: 'u_r2',
    reportedByName: 'Ahmed Danish Hakim',
    daysAgo: 12,
    affected: 290,
    tags: ['electrical', 'night-safety'],
    supporters: ['u_r4', 'u_r9'],
    assignedTeamId: 'team_c',
    assignedStaffId: 'u_maintenance',
    assignedStaffName: 'Lim Wei Jian',
    safetyHazardId: 'h05',
    photoHue: 15,
  },
];

/* ------------------------------------------------------------------ *
 * Accessibility obstacles
 * ------------------------------------------------------------------ */

const OBSTACLE_SEEDS: (AccessibilityObstacle & { edgeFrom?: string; edgeTo?: string })[] = [
  {
    id: 'ob01',
    category: 'damaged_ramp',
    title: 'Collapsed section on Emerald Residence Block A ramp',
    description: 'Ramp surface broken with a loose temporary plank; gradient too steep for assisted wheelchairs.',
    position: { lat: 3.06262, lng: 101.52108 },
    edgeFrom: 'n9',
    edgeTo: 'n10',
    severity: 0.85,
    status: 'open',
    reportedBy: 'u_r7',
    reportedAt: daysAgo(8),
    reportId: 'r03',
    votes: 4,
  },
  {
    id: 'ob02',
    category: 'broken_lift',
    title: 'Clinic atrium lift out of service',
    description: 'Second-floor lift non-operational; porter assistance required for wheelchair users.',
    position: { lat: 3.06988, lng: 101.51513 },
    edgeFrom: 'n3',
    edgeTo: 'n4',
    severity: 0.8,
    status: 'acknowledged',
    reportedBy: 'u_resident',
    reportedAt: daysAgo(5),
    reportId: 'r08',
    votes: 5,
  },
  {
    id: 'ob03',
    category: 'blocked_pavement',
    title: 'Illegal parking narrows clinic footpath to 40 cm',
    description: 'Vans parked across the path leaving an open drain gutter on the other side.',
    position: { lat: 3.06014, lng: 101.51768 },
    edgeFrom: 'n17',
    edgeTo: 'n19',
    severity: 0.6,
    status: 'open',
    reportedBy: 'u_r8',
    reportedAt: daysAgo(13),
    reportId: 'r10',
    votes: 3,
  },
  {
    id: 'ob04',
    category: 'missing_curb_ramp',
    title: 'No dropped kerb at the market crossing',
    description: 'Full 15 cm kerb drop with a drainage grate centred on the desire line.',
    position: { lat: 3.06634, lng: 101.51366 },
    edgeFrom: 'n8',
    edgeTo: 'n19',
    severity: 0.75,
    status: 'open',
    reportedBy: 'u_resident',
    reportedAt: daysAgo(3),
    reportId: 'r13',
    votes: 2,
  },
  {
    id: 'ob05',
    category: 'unsafe_crossing',
    title: 'Unlit, unsigned crossing at Perdana Heights gate',
    description: 'No lighting, faded give-way markings and vehicles ignoring the crossing.',
    position: { lat: 3.05518, lng: 101.52042 },
    edgeFrom: 'n14',
    edgeTo: 'n20',
    severity: 0.9,
    status: 'acknowledged',
    reportedBy: 'u_r8',
    reportedAt: daysAgo(7),
    reportId: 'r15',
    votes: 5,
  },
  {
    id: 'ob06',
    category: 'damaged_sidewalk',
    title: 'Collapsed kerb-side walkway at Palm Grove row 7',
    description: 'Loose tiles with an open kerb edge; impassable with a pram or mobility scooter.',
    position: { lat: 3.05892, lng: 101.52688 },
    edgeFrom: 'n13',
    edgeTo: 'n21',
    severity: 0.7,
    status: 'open',
    reportedBy: 'u_r6',
    reportedAt: daysAgo(10),
    reportId: 'r17',
    votes: 2,
  },
  {
    id: 'ob07',
    category: 'blocked_pavement',
    title: 'Construction hoarding blocks the wetland boardwalk entrance',
    description: 'Hoarding narrows the boardwalk entry to 50 cm with a protruding pipe at knee height.',
    position: { lat: 3.05704, lng: 101.52241 },
    edgeFrom: 'n22',
    edgeTo: 'n14',
    severity: 0.55,
    status: 'open',
    reportedBy: 'u_r10',
    reportedAt: daysAgo(6),
    votes: 3,
  },
  {
    id: 'ob08',
    category: 'damaged_ramp',
    title: 'Transit underpass ramp slippery when wet',
    description: 'Standing water makes the underpass ramp surface slick with no handrail on the descent.',
    position: { lat: 3.05628, lng: 101.51438 },
    edgeFrom: 'n14',
    edgeTo: 'n18',
    severity: 0.65,
    status: 'acknowledged',
    reportedBy: 'u_resident',
    reportedAt: daysAgo(18),
    reportId: 'r18',
    votes: 2,
  },
  {
    id: 'ob09',
    category: 'damaged_sidewalk',
    title: 'Lifted slabs at Taman Reka cycleway approach',
    description: 'Six interlocking slabs lifted roughly 4 cm creating a trip hazard.',
    position: { lat: 3.06306, lng: 101.50968 },
    edgeFrom: 'n15',
    edgeTo: 'n16',
    severity: 0.5,
    status: 'resolved',
    reportedBy: 'u_r9',
    reportedAt: daysAgo(34),
    reportId: 'r06',
    votes: 1,
  },
  {
    id: 'ob10',
    category: 'missing_curb_ramp',
    title: 'School gate kerb ramp replaced with a ramped board',
    description: 'Temporary wooden board ramps are steep and lack a handrail beside the crossing.',
    position: { lat: 3.06842, lng: 101.51618 },
    edgeFrom: 'n4',
    edgeTo: 'n7',
    severity: 0.62,
    status: 'open',
    reportedBy: 'u_r5',
    reportedAt: daysAgo(4),
    reportId: 'r05',
    votes: 2,
  },
];

/* ------------------------------------------------------------------ *
 * Safety hazards
 * ------------------------------------------------------------------ */

interface HazardSeed {
  id: string;
  type: SafetyHazard['type'];
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  status: SafetyHazard['status'];
  severity: SafetyHazard['severity'];
  reportId?: string;
  reportedBy: string;
  daysAgo: number;
  lightingStatus?: SafetyHazard['lightingStatus'];
  resolvedDaysAgo?: number;
  factors: string[];
  photoHue?: number;
}

const HAZARD_SEEDS: HazardSeed[] = [
  {
    id: 'h01',
    type: 'streetlight',
    title: 'Unlit stretch of Riverwalk Promenade',
    description: 'Four lamp posts non-functional along the covered boardwalk between the surau and the promenade.',
    lat: 3.05868,
    lng: 101.52832,
    address: 'Riverwalk Promenade, between Surau and boardwalk',
    status: 'active',
    severity: 'high',
    reportId: 'r02',
    reportedBy: 'u_resident',
    daysAgo: 11,
    lightingStatus: 'faulty',
    factors: ['4 unlit lamps', 'Sole step-free route to transit', 'No alternative lighting'],
    photoHue: 45,
  },
  {
    id: 'h02',
    type: 'unsafe_walkway',
    title: 'Collapsed kerb edge at Palm Grove row 7',
    description: 'Section of kerb-side walkway has collapsed leaving an unprotected drop.',
    lat: 3.05892,
    lng: 101.52688,
    address: 'Palm Grove Housing, row 7 kerb-side walkway',
    status: 'active',
    severity: 'medium',
    reportId: 'r17',
    reportedBy: 'u_r6',
    daysAgo: 10,
    factors: ['Open kerb edge', 'Uneven surface', 'Narrow residual path'],
    photoHue: 88,
  },
  {
    id: 'h03',
    type: 'flood_prone',
    title: 'Waterlogged wetland boardwalk entrance',
    description: 'Boardwalk decking floods after heavy showers, hiding surface level changes.',
    lat: 3.05718,
    lng: 101.52232,
    address: 'Damai Wetland Park, boardwalk entrance',
    status: 'active',
    severity: 'high',
    reportId: 'r11',
    reportedBy: 'u_r10',
    daysAgo: 16,
    factors: ['Blocked silt trap', 'Ankle-deep standing water', 'Hidden trip hazards'],
    photoHue: 198,
  },
  {
    id: 'h04',
    type: 'damaged_crossing',
    title: 'Unlit and unsigned crossing at Perdana Heights gate',
    description: 'Give-way markings faded and no lighting after 7pm at a busy township gate.',
    lat: 3.05518,
    lng: 101.52042,
    address: 'Perdana Heights Gate, main pedestrian crossing',
    status: 'active',
    severity: 'critical',
    reportId: 'r15',
    reportedBy: 'u_r8',
    daysAgo: 7,
    lightingStatus: 'unverified',
    factors: ['No lighting', 'Faded markings', 'High vehicle volume', 'School and gate traffic'],
    photoHue: 8,
  },
  {
    id: 'h05',
    type: 'streetlight',
    title: 'Damaged lighting column at North Gate',
    description: 'Column struck by a vehicle, lamp hanging at an angle above the carriageway.',
    lat: 3.07231,
    lng: 101.51428,
    address: 'Township North Gate, Jalan Seri Damai',
    status: 'active',
    severity: 'high',
    reportId: 'r20',
    reportedBy: 'u_r2',
    daysAgo: 12,
    lightingStatus: 'faulty',
    factors: ['Electrical hazard', 'Atypical obstruction', 'Main entry route'],
    photoHue: 14,
  },
  {
    id: 'h06',
    type: 'flood_prone',
    title: 'Transit underpass ramp water pooling',
    description: 'Underpass ramp floods during monsoon mornings; pumps take hours to clear.',
    lat: 3.05628,
    lng: 101.51428,
    address: 'Damai Transit Link, pedestrian underpass ramp',
    status: 'monitoring',
    severity: 'high',
    reportId: 'r18',
    reportedBy: 'u_resident',
    daysAgo: 18,
    factors: ['Peak-hour flooding', 'Step-free route affected', 'Slippery surface'],
    photoHue: 212,
  },
  {
    id: 'h07',
    type: 'reported_hazard',
    title: 'Temporary scaffolding narrowing the playground path',
    description: 'Contractor scaffolding reduces the playground approach path to 60 cm with protruding poles.',
    lat: 3.06762,
    lng: 101.52234,
    address: 'Taman Damai Playground, northern approach',
    status: 'active',
    severity: 'medium',
    reportedBy: 'u_r4',
    daysAgo: 6,
    factors: ['Temporary works', 'Protruding poles', 'Children and prams affected'],
    photoHue: 265,
  },
  {
    id: 'h08',
    type: 'active_warning',
    title: 'Heavy rain advisory — low-lying areas',
    description: 'Township office advisory: expect standing water in the wetland and underpass approaches.',
    lat: 3.0645,
    lng: 101.5185,
    address: 'Township-wide advisory',
    status: 'active',
    severity: 'medium',
    reportedBy: 'u_admin',
    daysAgo: 2,
    factors: ['Monsoon front', 'Low-lying terrain', 'Drainage load'],
    photoHue: 230,
  },
  {
    id: 'h09',
    type: 'streetlight',
    title: 'Park canopy walkway lighting',
    description: 'Canopy walkway lighting reported non-functional for two weeks.',
    lat: 3.07312,
    lng: 101.52118,
    address: 'Bukit Indah Park, canopy walkway to playground',
    status: 'resolved',
    severity: 'medium',
    reportId: 'r07',
    reportedBy: 'u_r4',
    daysAgo: 9,
    resolvedDaysAgo: 1,
    lightingStatus: 'working',
    factors: ['Isolated path', 'Resident reports'],
    photoHue: 48,
  },
];

/* ------------------------------------------------------------------ *
 * Recycling
 * ------------------------------------------------------------------ */

export const RECYCLING_STATIONS: RecyclingStation[] = [
  {
    id: 's1',
    name: 'Damai Community Recycling Centre',
    position: { lat: 3.0643, lng: 101.5189 },
    address: '12 Jalan Seri Damai, next to the township office',
    hours: 'Mon–Sat 8:30am – 6:30pm · Sun 9:00am – 1:00pm',
    status: 'operational',
    accepted: ['plastic', 'paper', 'glass', 'aluminium', 'electronics', 'textiles'],
    capacityKg: 12000,
    currentKg: 7850,
    contact: '+603-5511 2420',
    operatorId: 'u_operator',
    notes: 'Full sorting line with glass crusher and e-waste bench.',
    lastServicedAt: daysAgo(9),
  },
  {
    id: 's2',
    name: 'Grandmart Recycling Point',
    position: { lat: 3.0606, lng: 101.5112 },
    address: 'Grandmart Hypermarket, covered trolley bay (level 1)',
    hours: 'Daily 7:00am – 10:00pm',
    status: 'busy',
    accepted: ['plastic', 'paper', 'aluminium'],
    capacityKg: 3000,
    currentKg: 2410,
    operatorId: 'u_operator',
    notes: 'Reverse vending machines for bottles and cans.',
    lastServicedAt: daysAgo(14),
  },
  {
    id: 's3',
    name: 'Seri Damai Market Bring-Back Station',
    position: { lat: 3.0666, lng: 101.5133 },
    address: 'Seri Damai Market, entrance beside the fish stall',
    hours: 'Tue, Thu, Sat 6:00am – 1:00pm',
    status: 'operational',
    accepted: ['plastic', 'paper', 'glass'],
    capacityKg: 1600,
    currentKg: 640,
    operatorId: 'u_operator',
    notes: 'Weekday-morning collection for market traders.',
    lastServicedAt: daysAgo(4),
  },
  {
    id: 's4',
    name: 'Emerald Residence Block A Collection Point',
    position: { lat: 3.0624, lng: 101.5208 },
    address: 'Emerald Residence Block A, ground floor lobby',
    hours: 'Daily 8:00am – 8:00pm',
    status: 'operational',
    accepted: ['paper', 'plastic', 'glass', 'textiles'],
    capacityKg: 900,
    currentKg: 520,
    operatorId: 'u_operator',
    notes: 'Community-compost textile drop-off alongside.',
    lastServicedAt: daysAgo(6),
  },
  {
    id: 's5',
    name: 'Bukit Indah Park Gate Recycling Corner',
    position: { lat: 3.0743, lng: 101.5207 },
    address: 'Bukit Indah Park, beside the visitor centre',
    hours: 'Daily 7:00am – 8:00pm',
    status: 'maintenance',
    accepted: ['plastic', 'aluminium', 'textiles'],
    capacityKg: 700,
    currentKg: 690,
    operatorId: 'u_operator',
    notes: 'Container swap scheduled — temporarily closed for glass.',
    lastServicedAt: daysAgo(21),
  },
  {
    id: 's6',
    name: 'Damai Transit Link Recycle Hub',
    position: { lat: 3.0559, lng: 101.5143 },
    address: 'Damai Transit Link, concourse level B1',
    hours: 'Daily 6:00am – 11:00pm',
    status: 'operational',
    accepted: ['plastic', 'paper', 'aluminium', 'electronics'],
    capacityKg: 2200,
    currentKg: 1180,
    operatorId: 'u_operator',
    notes: 'Highest footfall — average 180 drops per day.',
    lastServicedAt: daysAgo(3),
  },
];

interface ActivitySeed {
  id: string;
  userId: string;
  userName: string;
  material: RecyclingActivity['material'];
  weightKg: number;
  stationId: string;
  daysAgo: number;
  status: RecyclingActivity['status'];
  points?: number;
  note?: string;
}

const ACTIVITY_SEEDS: ActivitySeed[] = [
  { id: 'a01', userId: 'u_resident', userName: 'Nur Aisyah Rahman', material: 'plastic', weightKg: 4.5, stationId: 's1', daysAgo: 2, status: 'verified', points: 45 },
  { id: 'a02', userId: 'u_resident', userName: 'Nur Aisyah Rahman', material: 'paper', weightKg: 6.2, stationId: 's4', daysAgo: 9, status: 'verified', points: 31 },
  { id: 'a03', userId: 'u_resident', userName: 'Nur Aisyah Rahman', material: 'glass', weightKg: 3.1, stationId: 's1', daysAgo: 16, status: 'verified', points: 25 },
  { id: 'a04', userId: 'u_resident', userName: 'Nur Aisyah Rahman', material: 'aluminium', weightKg: 2.4, stationId: 's2', daysAgo: 23, status: 'pending' },
  { id: 'a05', userId: 'u_resident', userName: 'Nur Aisyah Rahman', material: 'textiles', weightKg: 5.0, stationId: 's4', daysAgo: 31, status: 'verified', points: 30 },
  { id: 'a06', userId: 'u_r2', userName: 'Ahmed Danish Hakim', material: 'aluminium', weightKg: 7.8, stationId: 's6', daysAgo: 3, status: 'verified', points: 117 },
  { id: 'a07', userId: 'u_r2', userName: 'Ahmed Danish Hakim', material: 'plastic', weightKg: 9.4, stationId: 's1', daysAgo: 12, status: 'verified', points: 94 },
  { id: 'a08', userId: 'u_r3', userName: 'Tan Mei Ling', material: 'paper', weightKg: 12.1, stationId: 's1', daysAgo: 5, status: 'verified', points: 61 },
  { id: 'a09', userId: 'u_r3', userName: 'Tan Mei Ling', material: 'electronics', weightKg: 2.2, stationId: 's1', daysAgo: 19, status: 'verified', points: 44 },
  { id: 'a10', userId: 'u_r4', userName: 'Kumar Selvan', material: 'plastic', weightKg: 5.6, stationId: 's2', daysAgo: 7, status: 'verified', points: 56 },
  { id: 'a11', userId: 'u_r4', userName: 'Kumar Selvan', material: 'glass', weightKg: 4.4, stationId: 's3', daysAgo: 21, status: 'rejected', note: 'Weight could not be verified against the station scale log.' },
  { id: 'a12', userId: 'u_r5', userName: 'Priya Anandan', material: 'textiles', weightKg: 8.2, stationId: 's4', daysAgo: 4, status: 'verified', points: 49 },
  { id: 'a13', userId: 'u_r6', userName: 'Wong Wai Ming', material: 'aluminium', weightKg: 3.3, stationId: 's1', daysAgo: 14, status: 'pending' },
  { id: 'a14', userId: 'u_r7', userName: 'Farah Adilah', material: 'paper', weightKg: 6.7, stationId: 's2', daysAgo: 8, status: 'verified', points: 34 },
  { id: 'a15', userId: 'u_r8', userName: 'Devi Rani', material: 'plastic', weightKg: 3.9, stationId: 's6', daysAgo: 1, status: 'pending' },
];

/* ------------------------------------------------------------------ *
 * Guide & achievements
 * ------------------------------------------------------------------ */

export const RECYCLING_GUIDE: RecyclingGuideItem[] = [
  { id: 'g01', term: 'Plastic bottle (PET)', category: 'plastic', recyclable: true, condition: 'Empty and rinsed, cap on', preparation: ['Empty and rinse', 'Leave the cap on', 'Flatten if possible'], acceptedAt: ['s1', 's2', 's3', 's4', 's6'], keywords: ['pet', 'bottle', 'water', 'drink'], tips: 'Only PET and HDPE bottles are accepted at the community centre.' },
  { id: 'g02', term: 'Plastic takeaway container', category: 'plastic', recyclable: true, condition: 'Clean, lid separated', preparation: ['Wash out food residue', 'Separate lid'], acceptedAt: ['s1', 's2'], keywords: ['food container', 'takeaway', 'tupperware'] },
  { id: 'g03', term: 'Bubble wrap', category: 'plastic', recyclable: false, condition: 'Not accepted', preparation: ['Return to retailer for recycling'], acceptedAt: [], keywords: ['plastic film', 'bubble', 'packing'], tips: 'Plastic film cannot be processed by the township sorting line.' },
  { id: 'g04', term: 'Newspaper', category: 'paper', recyclable: true, condition: 'Dry, bundled', preparation: ['Keep dry', 'Bundle or paper-bag'], acceptedAt: ['s1', 's2', 's3', 's4', 's6'], keywords: ['news', 'paper', 'newsprint'] },
  { id: 'g05', term: 'Office paper', category: 'paper', recyclable: true, condition: 'Clean, no wax coating', preparation: ['Remove plastic sleeves'], acceptedAt: ['s1', 's2', 's3', 's4', 's6'], keywords: ['a4', 'printer', 'copy'] },
  { id: 'g06', term: 'Greasy takeaway box', category: 'paper', recyclable: false, condition: 'Not accepted', preparation: ['Compost where available'], acceptedAt: [], keywords: ['oily', 'greasy', 'food box'] },
  { id: 'g07', term: 'Glass bottle', category: 'glass', recyclable: true, condition: 'Empty, lid removed', preparation: ['Empty and rinse', 'Remove metal lid'], acceptedAt: ['s1', 's3'], keywords: ['bottle', 'beer', 'sauce'] },
  { id: 'g08', term: 'Glass jar', category: 'glass', recyclable: true, condition: 'Empty, clean', preparation: ['Empty and rinse'], acceptedAt: ['s1', 's3'], keywords: ['jar', 'preserve'] },
  { id: 'g09', term: 'Mirror glass', category: 'glass', recyclable: false, condition: 'Not accepted', preparation: ['Dispose as general waste'], acceptedAt: [], keywords: ['mirror', 'window', 'tempered'] },
  { id: 'g10', term: 'Aluminium drink can', category: 'aluminium', recyclable: true, condition: 'Empty, rinsed', preparation: ['Empty and rinse', 'Do not flatten'], acceptedAt: ['s1', 's2', 's5', 's6'], keywords: ['can', 'aluminium', 'soda', 'beer'], tips: 'Aluminium carries the highest points-per-kilogram in the demo rules.' },
  { id: 'g11', term: 'Steel food can', category: 'aluminium', recyclable: true, condition: 'Empty, rinsed, label removed', preparation: ['Empty and rinse', 'Remove paper label'], acceptedAt: ['s1', 's2', 's6'], keywords: ['tin', 'steel', 'sardine'] },
  { id: 'g12', term: 'Scrap aluminium (small items)', category: 'aluminium', recyclable: true, condition: 'Clean, under 10 cm', preparation: ['Separate non-metallic parts'], acceptedAt: ['s1'], keywords: ['scrap', 'foil', 'trim'] },
  { id: 'g13', term: 'Mobile phone', category: 'electronics', recyclable: true, condition: 'Working or faulty', preparation: ['Remove SIM and memory card', 'Wipe personal data'], acceptedAt: ['s1', 's6'], keywords: ['phone', 'mobile', 'smartphone', 'iphone'], tips: 'Data wiping is completed by the e-waste bench operator.' },
  { id: 'g14', term: 'Laptop and accessories', category: 'electronics', recyclable: true, condition: 'Complete unit', preparation: ['Remove personal data', 'Include charger if available'], acceptedAt: ['s1'], keywords: ['laptop', 'computer', 'tablet'] },
  { id: 'g15', term: 'Household battery', category: 'electronics', recyclable: false, condition: 'Not accepted — hazardous', preparation: ['Take to a dedicated collection point'], acceptedAt: [], keywords: ['battery', 'lithium', 'power'], tips: 'Household batteries are excluded from the demo rules for safety reasons.' },
  { id: 'g16', term: 'Cotton clothing', category: 'textiles', recyclable: true, condition: 'Clean, dry, bagged', preparation: ['Clean and dry', 'Bag separately', 'No shoes or wet items'], acceptedAt: ['s1', 's4', 's5'], keywords: ['clothes', 'shirt', 'cotton', 'textile'] },
  { id: 'g17', term: 'Textile offcuts and curtains', category: 'textiles', recyclable: true, condition: 'Clean, bagged', preparation: ['Bag separately from clothing'], acceptedAt: ['s1', 's4'], keywords: ['offcut', 'curtain', 'fabric'] },
  { id: 'g18', term: 'Worn-out mattress', category: 'textiles', recyclable: false, condition: 'Not accepted', preparation: ['Arrange bulky-waste collection'], acceptedAt: [], keywords: ['mattress', 'bed'] },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'ac1', name: 'First Drop', description: 'Submit your first recycling activity.', icon: 'Sparkles', tier: 'bronze', requirement: { kind: 'activities', value: 1 } },
  { id: 'ac2', name: 'Sorting Starter', description: 'Recycle 25 kg in total across all materials.', icon: 'Recycle', tier: 'bronze', requirement: { kind: 'weight', value: 25 } },
  { id: 'ac3', name: 'Green Streak', description: 'Recycle across 3 consecutive months.', icon: 'Flame', tier: 'bronze', requirement: { kind: 'activities', value: 3 } },
  { id: 'ac4', name: 'Community Hero', description: 'Earn 500 Green Reward points.', icon: 'Trophy', tier: 'silver', requirement: { kind: 'points', value: 500 } },
  { id: 'ac5', name: 'Weight Champion', description: 'Recycle 100 kg in total.', icon: 'Weight', tier: 'silver', requirement: { kind: 'weight', value: 100 } },
  { id: 'ac6', name: 'Ten Verified Drops', description: 'Have 10 recycling activities verified.', icon: 'BadgeCheck', tier: 'silver', requirement: { kind: 'activities', value: 10 } },
  { id: 'ac7', name: 'Green Leader', description: 'Earn 1,000 Green Reward points.', icon: 'Crown', tier: 'gold', requirement: { kind: 'points', value: 1000 } },
  { id: 'ac8', name: 'Eco Champion', description: 'Recycle 250 kg in total.', icon: 'Leaf', tier: 'gold', requirement: { kind: 'weight', value: 250 } },
];

/* ------------------------------------------------------------------ *
 * Seed builder
 * ------------------------------------------------------------------ */

function buildTimeline(seed: ReportSeed): ReportTimelineEntry[] {
  const submittedAt = daysAgo(seed.daysAgo);
  const entries: ReportTimelineEntry[] = [
    tl(submittedAt, seed.reportedBy, seed.reportedByName, 'resident', 'submitted', 'Report submitted by resident with photo evidence.'),
  ];

  if (seed.supporters && seed.supporters.length > 0) {
    entries.push(
      tl(submittedAt, seed.reportedBy, seed.reportedByName, 'resident', 'supported', `${seed.supporters.length} residents supported this report.`, {
        status: seed.status,
      }),
    );
  }

  const order = ['pending', 'under_review', 'assigned', 'in_progress', 'resolved'];
  const reached = order.indexOf(seed.status);

  if (reached >= 1) {
    entries.push(
      tl(daysAgo(Math.max(0, seed.daysAgo - 1)), 'u_admin', 'Ir. Farhan Ismail', 'admin', 'review', 'Management reviewed the submission and confirmed it for action.', { status: 'under_review' }),
    );
  }
  if (reached >= 2) {
    entries.push(
      tl(daysAgo(Math.max(0, seed.daysAgo - 2)), 'u_admin', 'Ir. Farhan Ismail', 'admin', 'assigned', `Assigned to ${MAINTENANCE_TEAMS.find((t) => t.id === seed.assignedTeamId)?.name ?? 'maintenance team'}.`, { status: 'assigned' }),
    );
  }
  if (reached >= 3) {
    entries.push(
      tl(daysAgo(Math.max(0, seed.daysAgo - 3)), seed.assignedStaffId ?? 'u_maintenance', seed.assignedStaffName ?? 'Maintenance Crew', 'maintenance', 'progress', 'Team on site, work has started. Temporary signage placed.', { status: 'in_progress' }),
    );
  }
  if (reached >= 4 && seed.resolvedDaysAgo !== undefined) {
    entries.push(
      tl(daysAgo(seed.resolvedDaysAgo), seed.assignedStaffId ?? 'u_maintenance', seed.assignedStaffName ?? 'Maintenance Crew', 'maintenance', 'evidence', 'Repair completed and photographic evidence uploaded for verification.', {
        status: 'in_progress',
        photoUrl: demoPhoto(seed.title.slice(0, 26), seed.photoHue ?? 190),
      }),
    );
    entries.push(
      tl(daysAgo(Math.max(0, seed.resolvedDaysAgo - 1)), 'u_admin', 'Ir. Farhan Ismail', 'admin', 'verified', 'Evidence reviewed and accepted. Report marked resolved.', { status: 'resolved' }),
    );
  }

  return entries;
}

export function buildSeedReports(): Report[] {
  return REPORT_SEEDS.map((seed) => {
    const reportedAt = daysAgo(seed.daysAgo);
    const safetyRelated = Boolean(seed.safetyHazardId) || seed.severity === 'critical';
    const priority = computePriority({
      category: seed.category,
      severity: seed.severity,
      affectedResidents: seed.affected,
      isSafetyRelated: safetyRelated,
      daysSinceSubmission: seed.daysAgo,
      duplicateCount: seed.id === 'r17' || seed.id === 'r05' ? 1 : 0,
      supporterCount: seed.supporters?.length ?? 0,
    });

    return {
      id: seed.id,
      reference: seed.ref,
      title: seed.title,
      description: seed.description,
      category: seed.category,
      severity: seed.severity,
      status: seed.status,
      position: { lat: seed.lat, lng: seed.lng },
      address: seed.address,
      photoUrl: demoPhoto(seed.title.slice(0, 26), seed.photoHue ?? 190),
      reportedBy: seed.reportedBy,
      reportedByName: seed.reportedByName,
      reportedAt,
      updatedAt: daysAgo(Math.max(0, seed.daysAgo - Math.min(seed.daysAgo, 2))),
      resolvedAt: seed.resolvedDaysAgo !== undefined ? daysAgo(seed.resolvedDaysAgo) : undefined,
      assignedTeamId: seed.assignedTeamId,
      assignedStaffId: seed.assignedStaffId,
      assignedStaffName: seed.assignedStaffName,
      supporters: seed.supporters ?? EMPTY_LIST,
      potentialDuplicates:
        seed.id === 'r17' ? ['r06'] : seed.id === 'r05' ? ['r15'] : [],
      duplicateOf: seed.duplicateOf,
      priority,
      safetyHazardId: seed.safetyHazardId,
      obstacleId: seed.obstacleId,
      taskId: seed.id ? `task_${seed.id}` : undefined,
      affectedResidents: seed.affected,
      tags: seed.tags,
      timeline: buildTimeline(seed),
    };
  });
}

export function buildSeedObstacles(): AccessibilityObstacle[] {
  return OBSTACLE_SEEDS.map((seed) => {
    const edge = seed.edgeFrom && seed.edgeTo
      ? ROUTE_EDGES.find(
          (e) =>
            (e.from === seed.edgeFrom && e.to === seed.edgeTo) ||
            (e.from === seed.edgeTo && e.to === seed.edgeFrom),
        )
      : undefined;
    const position = seed.position;
    return {
      id: seed.id,
      category: seed.category,
      title: seed.title,
      description: seed.description,
      position,
      edgeId: edge?.id,
      severity: seed.severity,
      status: seed.status,
      reportedBy: seed.reportedBy,
      reportedAt: seed.reportedAt,
      reportId: seed.reportId,
      photoUrl: demoPhoto(seed.title.slice(0, 24), 200),
      votes: seed.votes,
    };
  });
}

export function buildSeedHazards(): SafetyHazard[] {
  return HAZARD_SEEDS.map((seed) => ({
    id: seed.id,
    type: seed.type,
    title: seed.title,
    description: seed.description,
    position: { lat: seed.lat, lng: seed.lng },
    address: seed.address,
    status: seed.status,
    severity: seed.severity,
    reportId: seed.reportId,
    riskScore: round(
      Math.min(
        100,
        (seed.severity === 'critical' ? 82 : seed.severity === 'high' ? 66 : seed.severity === 'medium' ? 46 : 26) +
          seed.factors.length * 4,
      ),
      0,
    ),
    riskFactors: seed.factors,
    reportedBy: seed.reportedBy,
    reportedAt: daysAgo(seed.daysAgo),
    updatedAt: daysAgo(Math.max(0, seed.daysAgo - 1)),
    resolvedAt: seed.resolvedDaysAgo !== undefined ? daysAgo(seed.resolvedDaysAgo) : undefined,
    lightingStatus: seed.lightingStatus,
    photoUrl: demoPhoto(seed.title.slice(0, 24), seed.photoHue ?? 220),
  }));
}

export function buildSeedActivities(): RecyclingActivity[] {
  return ACTIVITY_SEEDS.map((seed) => {
    const station = RECYCLING_STATIONS.find((s) => s.id === seed.stationId)!;
    const basePoints =
      seed.status === 'verified'
        ? Math.round(
            seed.weightKg *
              ({ plastic: 10, paper: 5, glass: 8, aluminium: 15, electronics: 20, textiles: 6 }[seed.material]),
          )
        : 0;
    return {
      id: seed.id,
      userId: seed.userId,
      userName: seed.userName,
      material: seed.material,
      weightKg: seed.weightKg,
      stationId: seed.stationId,
      stationName: station.name,
      submittedAt: daysAgo(seed.daysAgo),
      photoUrl: demoPhoto(`${seed.material} ${seed.weightKg}kg`, 150),
      status: seed.status,
      pointsAwarded: seed.points ?? basePoints,
      verifiedAt: seed.status === 'verified' ? daysAgo(Math.max(0, seed.daysAgo - 1)) : undefined,
      verifiedBy: seed.status === 'verified' ? 'u_operator' : undefined,
      verifierName: seed.status === 'verified' ? 'Siti Hajar Yusof' : undefined,
      verificationNote: seed.note,
    };
  });
}

export function buildSeedTasks(): MaintenanceTask[] {
  return REPORT_SEEDS.filter((s) => s.assignedTeamId).map((seed) => {
    const status: MaintenanceTask['status'] =
      seed.status === 'resolved'
        ? 'completed'
        : seed.status === 'in_progress'
          ? 'in_progress'
          : seed.status === 'assigned'
            ? 'accepted'
            : 'open';
    const evidence: MaintenanceTask['evidence'] = [];
    if (seed.status === 'resolved') {
      evidence.push({
        id: `ev_${seed.id}`,
        uploadedBy: seed.assignedStaffId ?? 'u_maintenance',
        uploadedByName: seed.assignedStaffName ?? 'Maintenance Crew',
        uploadedAt: daysAgo(seed.resolvedDaysAgo ?? 2),
        photoUrl: demoPhoto(`Repair — ${seed.title.slice(0, 20)}`, seed.photoHue ?? 190),
        note: 'Repair completed. Surface reinstated and site cleared.',
        kind: 'completion',
      });
    } else if (status === 'in_progress') {
      evidence.push({
        id: `ev_${seed.id}`,
        uploadedBy: seed.assignedStaffId ?? 'u_maintenance',
        uploadedByName: seed.assignedStaffName ?? 'Maintenance Crew',
        uploadedAt: daysAgo(2),
        photoUrl: demoPhoto(`Progress — ${seed.title.slice(0, 20)}`, seed.photoHue ?? 190),
        note: 'Temporary works in place, permanent repair scheduled.',
        kind: 'progress',
      });
    }
    return {
      id: `task_${seed.id}`,
      reportId: seed.id,
      title: seed.title,
      teamId: seed.assignedTeamId,
      assigneeId: seed.assignedStaffId,
      assigneeName: seed.assignedStaffName,
      status,
      scheduledFor: daysAgo(-1),
      startedAt: status === 'open' ? undefined : daysAgo(3),
      completedAt: seed.resolvedDaysAgo !== undefined ? daysAgo(seed.resolvedDaysAgo) : undefined,
      notes: status === 'open' ? [] : ['Site inspection completed.', 'Materials requisitioned from depot.'],
      evidence,
      laborMinutes: status === 'completed' ? 120 : status === 'in_progress' ? 45 : undefined,
    };
  });
}

export function buildSeedNotifications(): AppNotification[] {
  return [
    {
      id: 'nt1',
      userId: 'u_resident',
      title: 'Report assigned to a team',
      body: '"Damaged access ramp at Emerald Residence Block A" has been assigned to Team A — Accessible Paths.',
      type: 'info',
      at: daysAgo(6),
      read: false,
      reportId: 'r03',
    },
    {
      id: 'nt2',
      userId: 'u_resident',
      title: 'Nearby safety hazard reported',
      body: 'An unlit crossing was reported at Perdana Heights Gate, about 900 m from you.',
      type: 'hazard',
      at: daysAgo(7),
      read: false,
      reportId: 'r15',
    },
    {
      id: 'nt3',
      userId: 'u_resident',
      title: 'Recycling activity verified — 45 points',
      body: 'Your plastic recycling activity at Damai Community Recycling Centre was verified. 45 points added.',
      type: 'reward',
      at: daysAgo(2),
      read: false,
    },
    {
      id: 'nt4',
      userId: 'u_resident',
      title: 'Report resolved',
      body: '"Cracked pavement slabs at Taman Reka cycleway" was resolved after verification.',
      type: 'success',
      at: daysAgo(27),
      read: true,
      reportId: 'r06',
    },
    {
      id: 'nt5',
      userId: TOWNSHIP_NOTICE_RECIPIENT,
      scope: 'township',
      title: 'Heavy rain advisory',
      body: 'Standing water expected in the wetland and transit underpass approaches.',
      type: 'warning',
      at: daysAgo(2),
      read: false,
    },
    {
      id: 'nt9',
      userId: TOWNSHIP_NOTICE_RECIPIENT,
      scope: 'township',
      title: 'Boardwalk resurfacing works until Sunday',
      body: 'The wetland boardwalk is being resurfaced from Monday to Sunday. The northern approach is closed — use the Perdana Heights path in Smart Navigation while works are on site.',
      type: 'info',
      at: daysAgo(0, 5),
      read: false,
      link: '/app/navigation',
    },
    {
      id: 'nt6',
      userId: 'u_admin',
      title: '6 reports awaiting review',
      body: 'Priority queue has 6 submissions that still need a management review.',
      type: 'warning',
      at: daysAgo(0, 4),
      read: false,
    },
    {
      id: 'nt7',
      userId: 'u_maintenance',
      title: 'New task assigned to you',
      body: 'Damaged access ramp at Emerald Residence Block A — due tomorrow.',
      type: 'info',
      at: daysAgo(6),
      read: false,
      reportId: 'r03',
    },
    {
      id: 'nt8',
      userId: 'u_operator',
      title: '3 activities awaiting verification',
      body: 'Residents have submitted recycling activities that need checking before points are awarded.',
      type: 'warning',
      at: daysAgo(0, 2),
      read: false,
    },
  ];
}

/** Reference the node map so the seed stays in sync with the route graph. */
export const SEED_NODE_REFERENCE = ROUTE_NODE_MAP;
