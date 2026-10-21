/**
 * TownSync — Shared domain model.
 *
 * Every module (AccessAble, FixMyTown, SafeSpot, RecycleMate) reads and writes
 * the same collections so that a single community report can appear as a route
 * obstacle, a safety hazard and a maintenance ticket without duplication.
 */

export type ID = string;
export type Timestamp = string; // ISO-8601 string

/* ------------------------------------------------------------------ *
 * Identity & access
 * ------------------------------------------------------------------ */

export type UserRole = 'resident' | 'admin' | 'maintenance' | 'operator';

export interface User {
  id: ID;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  /** Points balance maintained by RecycleMate. */
  points: number;
  /** Household / block reference used for reporting density. */
  block?: string;
  joinedAt: Timestamp;
  isDemo?: boolean;
  /** Team membership for maintenance staff. */
  teamId?: ID;
  specialties?: string[];
}

export interface MaintenanceTeam {
  id: ID;
  name: string;
  lead: string;
  members: number;
  specialty: ReportCategory[];
  activeTasks: number;
  resolvedThisMonth: number;
  avgResolutionHours: number;
  color: string;
}

/* ------------------------------------------------------------------ *
 * Township geography
 * ------------------------------------------------------------------ */

export interface Township {
  id: ID;
  name: string;
  state: string;
  country: string;
  center: LatLng;
  bounds: [LatLng, LatLng];
  population: number;
  households: number;
  areaKm2: number;
  /** True when the geography is a simulated prototype township. */
  simulated: boolean;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place extends LatLng {
  id: ID;
  name: string;
  kind: PlaceKind;
  description?: string;
}

export type PlaceKind =
  | 'landmark'
  | 'residential'
  | 'commercial'
  | 'facility'
  | 'transit'
  | 'recreation';

/* ------------------------------------------------------------------ *
 * AccessAble — pedestrian route graph
 * ------------------------------------------------------------------ */

export type WalkwayCondition = 'good' | 'fair' | 'poor' | 'blocked';

export interface RouteNode {
  id: ID;
  name: string;
  position: LatLng;
  /** Wayfinding landmark description. */
  landmark?: string;
}

export interface RouteEdge {
  id: ID;
  from: ID;
  to: ID;
  distanceM: number;
  /** 0-100. Higher is smoother / better surfaced. */
  surfaceQuality: number;
  /** 0-100. Higher is more usable for wheelchair users. */
  accessibilityScore: number;
  /** Number of curb ramps / step-free transitions on the segment. */
  rampCount: number;
  /** 0-100. Higher is more sheltered (canopy, covered walkways). */
  shelterScore: number;
  /** 0-100. Higher is safer (lighting, traffic separation, sightlines). */
  safetyScore: number;
  /** 0-100. Higher is smoother (evenness, no lips). */
  smoothness: number;
  /** True when the segment has a dedicated, traffic-separated walkway. */
  separatedWalkway: boolean;
  /** True when the segment is wheelchair-accessible without steps. */
  stepFree: boolean;
  /** Known obstacles pinned to this segment. */
  obstacleIds: ID[];
  /** Surface description, e.g. "Interlocking brick paving". */
  surfaceNote?: string;
}

export type ObstacleCategory =
  | 'broken_lift'
  | 'damaged_ramp'
  | 'blocked_pavement'
  | 'missing_curb_ramp'
  | 'unsafe_crossing'
  | 'damaged_sidewalk';

export interface AccessibilityObstacle {
  id: ID;
  category: ObstacleCategory;
  title: string;
  description: string;
  position: LatLng;
  /** Closest route edge, when the obstacle blocks a known segment. */
  edgeId?: ID;
  /** Severity multiplier used by the routing engine (0 = blocking). */
  severity: number;
  status: 'open' | 'acknowledged' | 'resolved';
  reportedBy: ID;
  reportedAt: Timestamp;
  photoUrl?: string;
  /** Derived from the parent FixMyTown report when one exists. */
  reportId?: ID;
  votes: number;
}

export type MobilityProfile =
  | 'wheelchair'
  | 'older_adult'
  | 'stroller'
  | 'temporary_limitation'
  | 'general';

export interface MobilityProfileSpec {
  id: MobilityProfile;
  label: string;
  description: string;
  icon: string;
  /** Multipliers applied to edge weights. */
  weights: {
    accessibility: number;
    shelter: number;
    smoothness: number;
    safety: number;
    distance: number;
  };
  /** Minimum acceptable accessibility score for a segment. */
  minAccessibility: number;
  /** Hard requirement: segment must be step free. */
  requireStepFree: boolean;
}

export type RouteStrategy = 'shortest' | 'accessible' | 'comfortable';

export interface RouteLeg {
  edgeId: ID;
  from: ID;
  to: ID;
  distanceM: number;
  accessibilityScore: number;
  obstacleCount: number;
  rampCount: number;
  shelterScore: number;
  condition: WalkwayCondition;
  notes: string[];
}

export interface RouteResult {
  strategy: RouteStrategy;
  label: string;
  description: string;
  nodeIds: ID[];
  legs: RouteLeg[];
  distanceM: number;
  durationMin: number;
  accessibilityScore: number;
  comfortScore: number;
  safetyScore: number;
  obstacleCount: number;
  rampCount: number;
  /** Count of edges with poor or blocked surface condition. */
  degradedSegmentCount: number;
  hasShelter: boolean;
  warnings: string[];
}

/* ------------------------------------------------------------------ *
 * FixMyTown — community reports
 * ------------------------------------------------------------------ */

export type ReportCategory =
  | 'pothole'
  | 'damaged_pavement'
  | 'streetlight'
  | 'drainage'
  | 'public_facility'
  | 'accessibility'
  | 'other';

export type ReportStatus =
  | 'pending'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface PriorityBreakdown {
  safetyImpact: number;
  populationImpact: number;
  accessibilityImpact: number;
  severity: number;
  ageFactor: number;
  duplicateFactor: number;
  total: number;
  level: PriorityLevel;
}

export interface Report {
  id: ID;
  reference: string;
  title: string;
  description: string;
  category: ReportCategory;
  severity: ReportSeverity;
  status: ReportStatus;
  position: LatLng;
  address: string;
  photoUrl?: string;
  reportedBy: ID;
  reportedByName: string;
  reportedAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
  assignedTeamId?: ID;
  assignedStaffId?: ID;
  assignedStaffName?: string;
  /** Number of residents supporting this report. */
  supporters: string[];
  duplicateOf?: ID;
  potentialDuplicates: ID[];
  priority: PriorityBreakdown;
  /** Set when the report also has a safety dimension. */
  safetyHazardId?: ID;
  /** Set when the report is also an accessibility obstacle. */
  obstacleId?: ID;
  /** Set when the report created a maintenance task. */
  taskId?: ID;
  affectedResidents: number;
  tags: string[];
  timeline: ReportTimelineEntry[];
}

export interface ReportTimelineEntry {
  id: ID;
  at: Timestamp;
  actorId: ID;
  actorName: string;
  actorRole: UserRole;
  type:
    | 'submitted'
    | 'review'
    | 'assigned'
    | 'progress'
    | 'evidence'
    | 'verified'
    | 'resolved'
    | 'rejected'
    | 'duplicate'
    | 'supported'
    | 'priority_change';
  status?: ReportStatus;
  note: string;
  photoUrl?: string;
}

export interface MaintenanceTask {
  id: ID;
  reportId: ID;
  title: string;
  teamId?: ID;
  assigneeId?: ID;
  assigneeName?: string;
  status: 'open' | 'accepted' | 'in_progress' | 'awaiting_verification' | 'completed';
  scheduledFor?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  notes: string[];
  evidence: TaskEvidence[];
  laborMinutes?: number;
}

export interface TaskEvidence {
  id: ID;
  uploadedBy: ID;
  uploadedByName: string;
  uploadedAt: Timestamp;
  photoUrl?: string;
  note: string;
  kind: 'progress' | 'completion';
}

/* ------------------------------------------------------------------ *
 * SafeSpot — safety hazards
 * ------------------------------------------------------------------ */

export type HazardType =
  | 'streetlight'
  | 'unsafe_walkway'
  | 'flood_prone'
  | 'damaged_crossing'
  | 'reported_hazard'
  | 'active_warning';

export type HazardStatus = 'active' | 'monitoring' | 'resolved' | 'dismissed';

export interface SafetyHazard {
  id: ID;
  type: HazardType;
  title: string;
  description: string;
  position: LatLng;
  address: string;
  status: HazardStatus;
  severity: ReportSeverity;
  /** Linked FixMyTown report — SafeSpot never stores its own copy of the issue. */
  reportId?: ID;
  /** 0-100 prototype risk estimate for the surrounding area. */
  riskScore: number;
  riskFactors: string[];
  reportedBy: ID;
  reportedAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
  lightingStatus?: 'working' | 'faulty' | 'unverified';
  photoUrl?: string;
}

export interface NeighbourhoodRisk {
  zoneId: ID;
  zoneName: string;
  center: LatLng;
  riskScore: number;
  hazardCount: number;
  openReports: number;
  accessibilityIssues: number;
  factors: string[];
}

/* ----------------------------------------------------------------— *
 * RecycleMate
 * ----------------------------------------------------------------- */

export type MaterialType =
  | 'plastic'
  | 'paper'
  | 'glass'
  | 'aluminium'
  | 'electronics'
  | 'textiles';

export type StationStatus = 'operational' | 'busy' | 'maintenance' | 'closed';

export interface RecyclingStation {
  id: ID;
  name: string;
  position: LatLng;
  address: string;
  hours: string;
  status: StationStatus;
  accepted: MaterialType[];
  capacityKg: number;
  currentKg: number;
  contact?: string;
  operatorId?: ID;
  notes?: string;
  lastServicedAt?: Timestamp;
}

export interface RecyclingActivity {
  id: ID;
  userId: ID;
  userName: string;
  material: MaterialType;
  weightKg: number;
  stationId: ID;
  stationName: string;
  submittedAt: Timestamp;
  photoUrl?: string;
  status: 'pending' | 'verified' | 'rejected';
  pointsAwarded: number;
  verifiedAt?: Timestamp;
  verifiedBy?: ID;
  verifierName?: string;
  verificationNote?: string;
}

export interface RewardTransaction {
  id: ID;
  userId: ID;
  userName: string;
  points: number;
  reason: string;
  at: Timestamp;
  activityId?: ID;
  type: 'earned' | 'bonus' | 'adjustment';
}

export interface Achievement {
  id: ID;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
  requirement: { kind: 'points' | 'activities' | 'weight'; value: number };
}

export interface RecyclingGuideItem {
  id: ID;
  term: string;
  category: MaterialType | 'general';
  recyclable: boolean;
  condition: string;
  preparation: string[];
  acceptedAt: string[];
  tips?: string;
  keywords: string[];
}

/* ------------------------------------------------------------------ *
 * Notifications
 * ------------------------------------------------------------------ */

export interface AppNotification {
  id: ID;
  userId: ID;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'hazard' | 'reward';
  at: Timestamp;
  read: boolean;
  link?: string;
  reportId?: ID;
}

/* ------------------------------------------------------------------ *
 * Aggregates used by the dashboard
 * ------------------------------------------------------------------ */

export interface TownshipStats {
  activeReports: number;
  resolvedIssues: number;
  accessibilityScore: number;
  activeHazards: number;
  recyclingParticipation: number;
  totalRecycledKg: number;
  openTasks: number;
  totalPointsAwarded: number;
  avgResolutionDays: number;
  duplicateRate: number;
}

export interface ActivityFeedItem {
  id: ID;
  at: Timestamp;
  kind: 'report' | 'status' | 'maintenance' | 'recycling' | 'hazard' | 'obstacle';
  title: string;
  description: string;
  actor?: string;
  link?: string;
}
