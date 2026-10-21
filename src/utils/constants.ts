import type {
  AppNotification,
  MaterialType,
  MobilityProfile,
  MobilityProfileSpec,
  ReportCategory,
  ReportSeverity,
  ReportStatus,
  PriorityLevel,
  HazardType,
  StationStatus,
} from '@/types';

/* ------------------------------------------------------------------ *
 * Formatting
 * ------------------------------------------------------------------ */

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-MY', opts ?? { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatRelative(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 1) return 'just now';
  if (Math.abs(mins) < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return `${months}mo ago`;
  return formatDate(d);
}

export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(metres < 10000 ? 2 : 1)} km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function formatWeight(kg: number): string {
  if (kg < 1) return `${Math.round(kg * 1000)} g`;
  return `${kg.toFixed(1)} kg`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-MY').format(Math.round(n));
}

export function formatPoints(n: number): string {
  return new Intl.NumberFormat('en-MY').format(Math.round(n));
}

/* ------------------------------------------------------------------ *
 * ID / reference generation
 * ------------------------------------------------------------------ */

let counter = 0;
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function reportReference(seed = Date.now()): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const rand = String(Math.floor(seed % 100000)).padStart(5, '0');
  return `TS-${yy}${mm}-${rand}`;
}

/* ------------------------------------------------------------------ *
 * Domain constants
 * ------------------------------------------------------------------ */

export const REPORT_CATEGORY_META: Record<
  ReportCategory,
  { label: string; icon: string; color: string; description: string }
> = {
  pothole: {
    label: 'Potholes',
    icon: 'Construction',
    color: '#F0330F',
    description: 'Road surface damage creating risk to vehicles and pedestrians.',
  },
  damaged_pavement: {
    label: 'Damaged Pavements',
    icon: 'Footprints',
    color: '#FB5A36',
    description: 'Broken or uneven pedestrian walkways.',
  },
  streetlight: {
    label: 'Faulty Streetlights',
    icon: 'Lightbulb',
    color: '#F59E0B',
    description: 'Street lighting that is out, flickering or dim.',
  },
  drainage: {
    label: 'Overflowing Drains',
    icon: 'Waves',
    color: '#0EA5E9',
    description: 'Blocked or overflowing drainage causing waterlogging.',
  },
  public_facility: {
    label: 'Broken Public Facilities',
    icon: 'Building2',
    color: '#8B5CF6',
    description: 'Benches, bins, shelters, lifts and other communal assets.',
  },
  accessibility: {
    label: 'Accessibility Problems',
    icon: 'Accessibility',
    color: '#176B5B',
    description: 'Obstacles affecting step-free movement for all users.',
  },
  other: {
    label: 'Other',
    icon: 'CircleDot',
    color: '#64748B',
    description: 'Anything that does not fit another category.',
  },
};

export const REPORT_STATUS_META: Record<
  ReportStatus,
  { label: string; color: string; bg: string; description: string; order: number }
> = {
  pending: {
    label: 'Pending',
    color: '#B45309',
    bg: '#FEF3C7',
    description: 'Submitted and awaiting management review.',
    order: 1,
  },
  under_review: {
    label: 'Under Review',
    color: '#0369A1',
    bg: '#E0F2FE',
    description: 'Management is assessing the issue and priority.',
    order: 2,
  },
  assigned: {
    label: 'Assigned',
    color: '#7C3AED',
    bg: '#EDE9FE',
    description: 'A maintenance team has been tasked.',
    order: 3,
  },
  in_progress: {
    label: 'In Progress',
    color: '#C2410C',
    bg: '#FFEDD5',
    description: 'Work is actively being carried out on site.',
    order: 4,
  },
  resolved: {
    label: 'Resolved',
    color: '#047857',
    bg: '#D1FAE5',
    description: 'Repair verified and closed.',
    order: 5,
  },
  rejected: {
    label: 'Rejected',
    color: '#9F1239',
    bg: '#FFE4E6',
    description: 'Not actionable by the township office.',
    order: 6,
  },
};

export const STATUS_FLOW: ReportStatus[] = [
  'pending',
  'under_review',
  'assigned',
  'in_progress',
  'resolved',
];

export const SEVERITY_META: Record<ReportSeverity, { label: string; color: string; bg: string; weight: number }> = {
  low: { label: 'Low', color: '#047857', bg: '#D1FAE5', weight: 8 },
  medium: { label: 'Medium', color: '#0369A1', bg: '#E0F2FE', weight: 18 },
  high: { label: 'High', color: '#C2410C', bg: '#FFEDD5', weight: 28 },
  critical: { label: 'Critical', color: '#9F1239', bg: '#FFE4E6', weight: 40 },
};

export const PRIORITY_META: Record<PriorityLevel, { label: string; color: string; bg: string; ring: string }> = {
  critical: { label: 'Critical', color: '#9F1239', bg: '#FFE4E6', ring: 'ring-rose-200' },
  high: { label: 'High', color: '#C2410C', bg: '#FFEDD5', ring: 'ring-orange-200' },
  medium: { label: 'Medium', color: '#0369A1', bg: '#E0F2FE', ring: 'ring-sky-200' },
  low: { label: 'Low', color: '#047857', bg: '#D1FAE5', ring: 'ring-emerald-200' },
};

export const HAZARD_TYPE_META: Record<
  HazardType,
  { label: string; icon: string; color: string; description: string }
> = {
  streetlight: {
    label: 'Faulty Streetlight',
    icon: 'Lightbulb',
    color: '#F59E0B',
    description: 'Unlit or flickering lighting along pedestrian routes.',
  },
  unsafe_walkway: {
    label: 'Unsafe Walkway',
    icon: 'TriangleAlert',
    color: '#F0330F',
    description: 'Walkways with structural or surface risk.',
  },
  flood_prone: {
    label: 'Flood Prone',
    icon: 'Waves',
    color: '#0EA5E9',
    description: 'Locations that waterlog during heavy rain.',
  },
  damaged_crossing: {
    label: 'Damaged Crossing',
    icon: 'Zap',
    color: '#D97706',
    description: 'Crossings with broken signals, markings or surfaces.',
  },
  reported_hazard: {
    label: 'Community Hazard',
    icon: 'Flag',
    color: '#7C3AED',
    description: 'Hazards reported directly by residents.',
  },
  active_warning: {
    label: 'Active Warning',
    icon: 'Radio',
    color: '#176B5B',
    description: 'Live operational warnings issued by the township office.',
  },
};

export const HAZARD_STATUS_META: Record<
  'active' | 'monitoring' | 'resolved' | 'dismissed',
  { label: string; color: string; bg: string }
> = {
  active: { label: 'Active', color: '#9F1239', bg: '#FFE4E6' },
  monitoring: { label: 'Monitoring', color: '#B45309', bg: '#FEF3C7' },
  resolved: { label: 'Resolved', color: '#047857', bg: '#D1FAE5' },
  dismissed: { label: 'Dismissed', color: '#64748B', bg: '#F1F5F9' },
};

export const MATERIAL_META: Record<
  MaterialType,
  { label: string; color: string; bg: string; pointsPerKg: number; icon: string }
> = {
  plastic: { label: 'Plastic', color: '#0EA5E9', bg: '#E0F2FE', pointsPerKg: 10, icon: 'Bottle' },
  paper: { label: 'Paper', color: '#C2410C', bg: '#FFEDD5', pointsPerKg: 5, icon: 'FileText' },
  glass: { label: 'Glass', color: '#047857', bg: '#D1FAE5', pointsPerKg: 8, icon: 'Wine' },
  aluminium: { label: 'Aluminium', color: '#64748B', bg: '#F1F5F9', pointsPerKg: 15, icon: 'Cylinder' },
  electronics: { label: 'Electronics', color: '#7C3AED', bg: '#EDE9FE', pointsPerKg: 20, icon: 'Smartphone' },
  textiles: { label: 'Textiles', color: '#DB2777', bg: '#FCE7F3', pointsPerKg: 6, icon: 'Shirt' },
};

export const STATION_STATUS_META: Record<
  StationStatus,
  { label: string; color: string; bg: string; pulse: boolean }
> = {
  operational: { label: 'Operational', color: '#047857', bg: '#D1FAE5', pulse: false },
  busy: { label: 'Busy', color: '#B45309', bg: '#FEF3C7', pulse: true },
  maintenance: { label: 'Under Maintenance', color: '#C2410C', bg: '#FFEDD5', pulse: false },
  closed: { label: 'Closed', color: '#9F1239', bg: '#FFE4E6', pulse: false },
};

export const MOBILITY_PROFILES: MobilityProfileSpec[] = [
  {
    id: 'wheelchair',
    label: 'Wheelchair user',
    description: 'Prioritises step-free, smooth, level surfaces and usable curb ramps.',
    icon: 'Accessibility',
    weights: { accessibility: 3.2, shelter: 0.4, smoothness: 2.2, safety: 1.0, distance: 1.0 },
    minAccessibility: 55,
    requireStepFree: true,
  },
  {
    id: 'older_adult',
    label: 'Older adult',
    description: 'Values rest points, shelter from sun and rain, and gentle gradients.',
    icon: 'HeartPulse',
    weights: { accessibility: 1.6, shelter: 1.8, smoothness: 1.6, safety: 1.4, distance: 0.9 },
    minAccessibility: 40,
    requireStepFree: false,
  },
  {
    id: 'stroller',
    label: 'Parent with stroller',
    description: 'Prefers smooth wide paths, gentle turns and minimal kerb transitions.',
    icon: 'Baby',
    weights: { accessibility: 2.4, shelter: 1.0, smoothness: 2.4, safety: 1.2, distance: 1.0 },
    minAccessibility: 50,
    requireStepFree: true,
  },
  {
    id: 'temporary_limitation',
    label: 'Temporary mobility limitation',
    description: 'Balances distance with rest and stability — avoid uneven surfaces.',
    icon: 'Bandage',
    weights: { accessibility: 2.2, shelter: 1.2, smoothness: 2.0, safety: 1.3, distance: 0.95 },
    minAccessibility: 45,
    requireStepFree: true,
  },
  {
    id: 'general',
    label: 'General pedestrian',
    description: 'Balanced preference: shortest practical path with reasonable comfort.',
    icon: 'Footprints',
    weights: { accessibility: 1.0, shelter: 0.6, smoothness: 0.8, safety: 0.9, distance: 1.4 },
    minAccessibility: 0,
    requireStepFree: false,
  },
];

export const NOTIFICATION_TYPES: Record<
  AppNotification['type'],
  { label: string; color: string; bg: string }
> = {
  info: { label: 'Info', color: '#0369A1', bg: '#E0F2FE' },
  success: { label: 'Resolved', color: '#047857', bg: '#D1FAE5' },
  warning: { label: 'Attention', color: '#B45309', bg: '#FEF3C7' },
  hazard: { label: 'Safety', color: '#9F1239', bg: '#FFE4E6' },
  reward: { label: 'Reward', color: '#7C3AED', bg: '#EDE9FE' },
};

export const ROLES_META: Record<
  'resident' | 'admin' | 'maintenance' | 'operator',
  { label: string; color: string; bg: string; description: string; icon: string }
> = {
  resident: {
    label: 'Resident',
    color: '#176B5B',
    bg: '#EAF6F3',
    description: 'Reports issues, navigates the township and earns recycling rewards.',
    icon: 'Users',
  },
  admin: {
    label: 'Township Admin',
    color: '#7C3AED',
    bg: '#EDE9FE',
    description: 'Full oversight of reports, teams, hazards and analytics.',
    icon: 'ShieldCheck',
  },
  maintenance: {
    label: 'Maintenance Staff',
    color: '#C2410C',
    bg: '#FFEDD5',
    description: 'Executes assigned tasks and uploads repair evidence.',
    icon: 'HardHat',
  },
  operator: {
    label: 'Recycling Operator',
    color: '#047857',
    bg: '#D1FAE5',
    description: 'Verifies recycling activities and manages stations.',
    icon: 'Recycle',
  },
};

export const ALL_REPORT_CATEGORIES = Object.keys(REPORT_CATEGORY_META) as ReportCategory[];
export const ALL_MATERIALS = Object.keys(MATERIAL_META) as MaterialType[];
export const ALL_MOBILITY_PROFILES = Object.keys(
  MOBILITY_PROFILES.reduce<Record<string, true>>((acc, p) => ({ ...acc, [p.id]: true }), {}),
) as MobilityProfile[];
