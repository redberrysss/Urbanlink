import type { LucideIcon } from 'lucide-react';
import {
  Accessibility,
  Activity,
  BarChart3,
  Building2,
  ClipboardList,
  FileBarChart,
  Home,
  Lightbulb,
  Map,
  MapPin,
  Recycle,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Users,
  Wrench,
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
  {
    id: 'township',
    label: 'Township',
    roles: ['resident', 'admin', 'maintenance', 'operator'],
    items: [
      { to: '/app', label: 'Overview', icon: Home, roles: ['resident', 'admin', 'maintenance', 'operator'], end: true },
      { to: '/app/navigation', label: 'Smart Navigation', icon: Map, roles: ['resident', 'admin', 'maintenance', 'operator'] },
      { to: '/app/reports', label: 'Community Reports', icon: ClipboardList, roles: ['resident', 'admin', 'maintenance', 'operator'] },
      { to: '/app/safety', label: 'Safety Map', icon: ShieldCheck, roles: ['resident', 'admin', 'maintenance', 'operator'] },
      { to: '/app/recycling', label: 'Recycling Hub', icon: Recycle, roles: ['resident', 'admin', 'maintenance', 'operator'] },
      { to: '/app/activities', label: 'My Activities', icon: Activity, roles: ['resident', 'admin', 'maintenance', 'operator'] },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    roles: ['resident', 'admin', 'maintenance', 'operator'],
    items: [
      { to: '/app/tasks', label: 'Maintenance Tasks', icon: Wrench, roles: ['maintenance', 'admin'] },
      { to: '/app/verification', label: 'Verification Queue', icon: Lightbulb, roles: ['operator', 'admin'] },
      { to: '/app/profile', label: 'Profile', icon: User, roles: ['resident', 'admin', 'maintenance', 'operator'] },
      { to: '/app/settings', label: 'Settings', icon: Settings, roles: ['resident', 'admin', 'maintenance', 'operator'] },
    ],
  },
  {
    id: 'management',
    label: 'Management',
    roles: ['admin'],
    items: [
      { to: '/app/admin', label: 'Management Dashboard', icon: BarChart3, roles: ['admin'], end: true },
      { to: '/app/admin/issues', label: 'Issue Management', icon: ClipboardList, roles: ['admin'] },
      { to: '/app/admin/teams', label: 'Maintenance Teams', icon: Wrench, roles: ['admin'] },
      { to: '/app/admin/accessibility', label: 'Accessibility Analytics', icon: Accessibility, roles: ['admin'] },
      { to: '/app/admin/safety', label: 'Safety Monitoring', icon: MapPin, roles: ['admin'] },
      { to: '/app/admin/recycling', label: 'Recycling Management', icon: Recycle, roles: ['admin'] },
      { to: '/app/admin/users', label: 'Users', icon: Users, roles: ['admin'] },
      { to: '/app/admin/analytics', label: 'Reports & Analytics', icon: FileBarChart, roles: ['admin'] },
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
    { to: '/about', label: 'About TownSync' },
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
  maintenance: '/app/tasks',
  operator: '/app/verification',
};

export const APP_ICONS = { Building2, SlidersHorizontal };
