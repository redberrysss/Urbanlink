import { useMemo, useState } from 'react';
import { Mail, MapPin, Search, Shield, Sparkles, User as UserIcon, Users } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { StatCard } from '@/components/common/StatCard';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Select } from '@/components/common/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { ROLES_META, formatDate } from '@/utils/constants';
import type { User, UserRole } from '@/types';

import { EMPTY_LIST } from '@/utils/empty';
export function UsersManagementPage() {
  const { users, reports, activities } = useTownshipData();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | 'all'>('all');

  const all = users.data ?? EMPTY_LIST;

  const filtered = useMemo(() => {
    let list = [...all];
    if (role !== 'all') list = list.filter((u) => u.role === role);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.block ?? '').toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => b.points - a.points);
  }, [all, role, search]);

  const contributions = useMemo(() => {
    const map = new Map<string, { reports: number; activities: number; kg: number }>();
    (reports.data ?? EMPTY_LIST).forEach((r) => {
      const c = map.get(r.reportedBy) ?? { reports: 0, activities: 0, kg: 0 };
      c.reports += 1;
      map.set(r.reportedBy, c);
    });
    (activities.data ?? EMPTY_LIST).forEach((a) => {
      const c = map.get(a.userId) ?? { reports: 0, activities: 0, kg: 0 };
      c.activities += 1;
      if (a.status === 'verified') c.kg += a.weightKg;
      map.set(a.userId, c);
    });
    return map;
  }, [reports.data, activities.data]);

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Resident',
      sortable: true,
      sortValue: (u) => u.name,
      render: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-xs font-extrabold text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
            {u.name
              .split(' ')
              .slice(0, 2)
              .map((p) => p[0])
              .join('')}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink-900 dark:text-white">{u.name}</p>
            <p className="truncate text-[11px] text-ink-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      sortValue: (u) => u.role,
      render: (u) => {
        const meta = ROLES_META[u.role];
        return (
          <Badge color={meta.color} bg={meta.bg}>
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: 'block',
      header: 'Block',
      sortable: true,
      sortValue: (u) => u.block ?? '',
      hideBelow: 'md',
      render: (u) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-600 dark:text-ink-300">
          <MapPin className="h-3 w-3" />
          {u.block ?? '—'}
        </span>
      ),
    },
    {
      key: 'contribution',
      header: 'Contribution',
      sortable: true,
      sortValue: (u) => contributions.get(u.id)?.reports ?? 0,
      hideBelow: 'lg',
      render: (u) => {
        const c = contributions.get(u.id);
        return (
          <span className="text-xs font-semibold text-ink-600 dark:text-ink-300">
            {c?.reports ?? 0} reports · {c?.activities ?? 0} recycling
          </span>
        );
      },
    },
    {
      key: 'points',
      header: 'Points',
      sortable: true,
      sortValue: (u) => u.points,
      render: (u) => (
        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          {u.points}
        </span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      sortable: true,
      sortValue: (u) => u.joinedAt,
      hideBelow: 'lg',
      render: (u) => (
        <span className="text-xs text-ink-500 dark:text-ink-400">{formatDate(u.joinedAt)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Township Administration · Community"
        title="User management"
        description="Registered residents, their roles, blocks and contribution to the township's active reports and recycling programme."
      />

      <PageBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Registered Users" value={all.length} icon={<Users className="h-5 w-5" />} accent="#176B5B" />
          <StatCard
            label="Residents"
            value={all.filter((u) => u.role === 'resident').length}
            icon={<UserIcon className="h-5 w-5" />}
            accent="#0EA5E9"
          />
          <StatCard
            label="Staff & Operators"
            value={all.filter((u) => u.role !== 'resident').length}
            icon={<Shield className="h-5 w-5" />}
            accent="#7C3AED"
          />
          <StatCard
            label="Points Circulated"
            value={all.reduce((s, u) => s + u.points, 0)}
            icon={<Sparkles className="h-5 w-5" />}
            accent="#047857"
          />
        </div>

        <Card>
          <CardBody>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email or block…"
                  className="input pl-9"
                  aria-label="Search users"
                />
              </div>
              <Select
                value={role}
                onChange={(v) => setRole(v as UserRole | 'all')}
                options={[
                  { value: 'all', label: 'All roles' },
                  ...(
                    Object.keys(ROLES_META) as UserRole[]
                  ).map((r) => ({ value: r, label: ROLES_META[r].label })),
                ]}
                className="w-[200px]"
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-0">
            <DataTable
              columns={columns}
              rows={filtered}
              pageSize={10}
              empty={
                <EmptyState
                  icon={<Users className="h-5 w-5" />}
                  title="No users match"
                  description="Try a different search term or role filter."
                />
              }
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
                <Mail className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-900 dark:text-white">
                  Role-based access
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                  Residents report and navigate, maintenance staff execute repairs, recycling
                  operators verify submissions and township admins oversee everything. In production
                  these roles map to Firebase Auth custom claims and Firestore security rules.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
