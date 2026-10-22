import type { LucideIcon } from 'lucide-react';
import {
  Truck,
  BarChart3,
  Bell,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  History,
  LayoutDashboard,
  Map,
  MapPin,
  Recycle,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  end?: boolean;
  badge?: 'notifications';
}

export interface NavSection {
  id: string;
  label: string;
  roles: UserRole[];
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  /* ---------------- Resident ---------------- */
  {
    id: 'resident',
    label: 'Menu',
    roles: ['resident'],
    items: [
      { to: '/app', label: 'Home', icon: Building2, roles: ['resident'], end: true },
      { to: '/app/navigation', label: 'Navigate', icon: Map, roles: ['resident'] },
      { to: '/app/reports', label: 'Reports', icon: ClipboardList, roles: ['resident'] },
      { to: '/app/safety', label: 'Safety', icon: ShieldCheck, roles: ['resident'] },
      { to: '/app/recycling', label: 'Recycling', icon: Recycle, roles: ['resident'] },
      { to: '/app/notifications', label: 'Notifications', icon: Bell, roles: ['resident'], badge: 'notifications' },
    ],
  },
  /* ---------------- Maintenance Staff ---------------- */
  {
    id: 'maintenance',
    label: 'Work',
    roles: ['maintenance'],
    items: [
      { to: '/app/maintenance/today', label: 'Today', icon: LayoutDashboard, roles: ['maintenance'], end: true },
      { to: '/app/maintenance/jobs', label: 'My Jobs', icon: ClipboardList, roles: ['maintenance'] },
      { to: '/app/maintenance/map', label: 'Job Map', icon: MapPin, roles: ['maintenance'] },
      { to: '/app/maintenance/history', label: 'Work History', icon: History, roles: ['maintenance'] },
      { to: '/app/notifications', label: 'Notifications', icon: Bell, roles: ['maintenance'], badge: 'notifications' },
    ],
  },
  /* ---------------- Recycling Operator ---------------- */
  {
    id: 'operator',
    label: 'Recycling',
    roles: ['operator'],
    items: [
      { to: '/app/recycling-operator/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['operator'], end: true },
      { to: '/app/recycling-operator/submissions', label: 'Submissions', icon: ClipboardCheck, roles: ['operator'] },
      { to: '/app/recycling-operator/stations', label: 'My Stations', icon: Recycle, roles: ['operator'] },
      { to: '/app/recycling-operator/collections', label: 'Collections', icon: Truck, roles: ['operator'] },
      { to: '/app/recycling-operator/history', label: 'History', icon: History, roles: ['operator'] },
      { to: '/app/notifications', label: 'Notifications', icon: Bell, roles: ['operator'], badge: 'notifications' },
    ],
  },
  /* ---------------- Township Admin ---------------- */
  {
    id: 'admin',
    label: 'Overview',
    roles: ['admin'],
    items: [
      { to: '/app/admin', label: 'Overview', icon: BarChart3, roles: ['admin'], end: true },
      { to: '/app/admin/reports-jobs', label: 'Reports & Jobs', icon: ClipboardList, roles: ['admin'] },
      { to: '/app/admin/township-map', label: 'Township Map', icon: Map, roles: ['admin'] },
      { to: '/app/admin/recycling', label: 'Recycling', icon: Recycle, roles: ['admin'] },
      { to: '/app/admin/analytics', label: 'Analytics', icon: FileBarChart, roles: ['admin'] },
      { to: '/app/admin/administration', label: 'Administration', icon: SlidersHorizontal, roles: ['admin'] },
      { to: '/app/notifications', label: 'Notifications', icon: Bell, roles: ['admin'], badge: 'notifications' },
    ],
  },
];

export function navForRole(role: UserRole): { section: NavSection; items: NavItem[] }[] {
  return NAV_SECTIONS.filter((s) => s.roles.includes(role)).map((s) => ({
    section: s,
    items: s.items.filter((i) => i.roles.includes(role)),
  }));
}

export const PUBLIC_NAV = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/features', label: 'Features' },
  { to: '/how-it-works', label: 'How It Works' },
];

export const FOOTER_LINKS = {
  Product: [
    { to: '/features', label: 'Features' },
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/about', label: 'About UrbanLink' },
  ],
  Modules: [
    { to: '/features#accessable', label: 'AccessAble' },
    { to: '/features#fixmytown', label: 'FixMyTown' },
    { to: '/features#safespot', label: 'SafeSpot' },
    { to: '/features#recyclemate', label: 'RecycleMate' },
  ],
  Account: [
    { to: '/signin', label: 'Sign in' },
    { to: '/register', label: 'Create account' },
  ],
};

export const ROLE_LANDING: Record<UserRole, string> = {
  resident: '/app',
  admin: '/app/admin',
  maintenance: '/app/maintenance/today',
  operator: '/app/recycling-operator/dashboard',
};

export const APP_ICONS = { Building2, SlidersHorizontal };
