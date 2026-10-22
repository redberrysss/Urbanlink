import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  ClipboardList,
  Map,
  Plus,
  Recycle,
  ShieldAlert,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import {
  formatRelative,
  NOTIFICATION_TYPES,
  REPORT_CATEGORY_META,
  REPORT_STATUS_META,
} from '@/utils/constants';
import type { ReportStatus } from '@/types';

import { EMPTY_LIST } from '@/utils/empty';

const QUICK_ACTIONS = [
  { to: '/app/navigation', label: 'Plan a route', icon: Map, color: '#2563EB' },
  { to: '/app/reports/new', label: 'Report an issue', icon: Plus, color: '#FB5A36' },
  { to: '/app/safety', label: 'Check nearby hazards', icon: ShieldAlert, color: '#DC2626' },
  { to: '/app/recycling', label: 'Recycle', icon: Recycle, color: '#047857' },
];

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: 'Received',
  under_review: 'Being reviewed',
  assigned: 'Repair scheduled',
  in_progress: 'Work underway',
  resolved: 'Resolved',
  rejected: 'Received',
};

export function HomePage() {
  const { user } = useAuth();
  const { reports, hazards, notifications, activities, transactions } = useTownshipData();

  const allReports = reports.data ?? EMPTY_LIST;
  const myReports = useMemo(
    () =>
      allReports
        .filter((r) => r.reportedBy === user?.id)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .slice(0, 4),
    [allReports, user?.id],
  );

  const allHazards = hazards.data ?? EMPTY_LIST;
  const activeAlerts = useMemo(
    () =>
      allHazards
        .filter((h) => h.status !== 'resolved')
        .sort((a, b) => (a.reportedAt < b.reportedAt ? 1 : -1))
        .slice(0, 3),
    [allHazards],
  );

  const allActivities = activities.data ?? EMPTY_LIST;
  const myActivities = useMemo(
    () => allActivities.filter((a) => a.userId === user?.id),
    [allActivities, user?.id],
  );
  const pendingSubmissions = myActivities.filter((a) => a.status === 'pending').length;

  const myTx = useMemo(
    () =>
      (transactions.data ?? EMPTY_LIST)
        .filter((t) => t.userId === user?.id)
        .reduce((sum, t) => sum + t.points, 0),
    [transactions.data, user?.id],
  );

  const items = notifications.data ?? EMPTY_LIST;
  const townNotices = useMemo(
    () => items.filter((n) => n.scope === 'township').sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 2),
    [items],
  );

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div>
      <PageHeader
        title={`Home · Hello, ${firstName}`}
        description="Take action, track your reports and see what matters near you."
        actions={
          <Link to="/app/reports/new">
            <Button icon={<Plus className="h-4 w-4" />}>Report an issue</Button>
          </Link>
        }
      />
      <PageBody className="space-y-6">
        {/* Quick actions */}
        <section>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.to}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Link
                    to={action.to}
                    className="surface flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-card-hover"
                  >
                    <span
                      className="grid h-11 w-11 place-items-center rounded-xl text-white"
                      style={{ backgroundColor: action.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink-900 dark:text-white">{action.label}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">Go</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-ink-300" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          {/* My reports */}
          <Card>
            <CardHeader
              icon={<ClipboardList className="h-5 w-5" />}
              title="My reports"
              subtitle="Your issues and their latest updates"
              action={
                <Link to="/app/reports/new">
                  <Button size="sm" variant="secondary" icon={<Plus className="h-4 w-4" />}>
                    Report an issue
                  </Button>
                </Link>
              }
            />
            <CardBody className="space-y-2.5">
              {myReports.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList className="h-5 w-5" />}
                  title="No reports yet—report a problem in your neighbourhood."
                  description="Use Report an issue to get started."
                  action={
                    <Link to="/app/reports/new">
                      <Button icon={<Plus className="h-4 w-4" />}>Report an issue</Button>
                    </Link>
                  }
                />
              ) : (
                myReports.map((report) => {
                  const cat = REPORT_CATEGORY_META[report.category];
                  const statusMeta = REPORT_STATUS_META[report.status];
                  return (
                    <Link
                      key={report.id}
                      to={`/app/reports/${report.id}`}
                      className="flex items-start gap-3 rounded-xl border border-ink-100 p-3.5 transition hover:border-primary-200 hover:bg-primary-50/40 dark:border-white/10 dark:hover:border-primary-500/40 dark:hover:bg-primary-500/5"
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        <ClipboardList className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-ink-900 dark:text-white">
                            {report.title}
                          </p>
                          <Badge color={statusMeta.color} bg={statusMeta.bg}>
                            {STATUS_LABEL[report.status]}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-400">
                          {report.address}
                        </p>
                        <p className="mt-1 text-[10px] text-ink-400">
                          Latest update · {formatRelative(report.updatedAt)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-ink-300" />
                    </Link>
                  );
                })
              )}
              {myReports.length > 0 ? (
                <div className="pt-1 text-center">
                  <Link to="/app/reports?scope=mine" className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-300">
                    View all my reports
                  </Link>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <div className="space-y-6">
            {/* Important local alerts */}
            <Card>
              <CardHeader
                icon={<ShieldAlert className="h-5 w-5" />}
                title="Important local alerts"
                subtitle="Active safety alerts near you"
                action={
                  <Link to="/app/safety">
                    <Button size="sm" variant="secondary">Nearby safety alerts</Button>
                  </Link>
                }
              />
              <CardBody className="space-y-2.5">
                {activeAlerts.length === 0 ? (
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    No active alerts in your area right now.
                  </p>
                ) : (
                  activeAlerts.map((alert) => (
                    <Link
                      key={alert.id}
                      to={`/app/safety/${alert.id}`}
                      className="block rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 transition hover:bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-600 text-white">
                          <ShieldAlert className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-ink-900 dark:text-white">{alert.title}</p>
                          <p className="mt-0.5 text-xs text-ink-600 dark:text-ink-300">{alert.address}</p>
                          <p className="mt-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                            Severity: {alert.severity} · {formatRelative(alert.reportedAt)}
                          </p>
                          <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-400 line-clamp-2">
                            {alert.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-rose-400" />
                      </div>
                    </Link>
                  ))
                )}
              </CardBody>
            </Card>

            {/* Compact recycling summary */}
            <Card>
              <CardHeader
                icon={<Recycle className="h-5 w-5" />}
                title="Recycling"
                subtitle="Your points and pending submissions"
                action={
                  <Link to="/app/recycling">
                    <Button size="sm" variant="secondary">Open recycling</Button>
                  </Link>
                }
              />
              <CardBody>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/app/recycling?tab=activity"
                    className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 transition hover:bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10"
                  >
                    <p className="text-xs font-semibold text-emerald-800/80 dark:text-emerald-200/80">Points</p>
                    <p className="mt-1 text-xl font-extrabold text-emerald-900 dark:text-emerald-50">{myTx}</p>
                  </Link>
                  <Link
                    to="/app/recycling?tab=activity"
                    className="rounded-xl border border-ink-200 bg-ink-50 p-3.5 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <p className="text-xs font-semibold text-ink-600 dark:text-ink-300">Awaiting verification</p>
                    <p className="mt-1 text-xl font-extrabold text-ink-900 dark:text-white">{pendingSubmissions}</p>
                  </Link>
                </div>
              </CardBody>
            </Card>

            {/* Town notices */}
            {townNotices.length > 0 ? (
              <Card>
                <CardHeader
                  icon={<Bell className="h-5 w-5" />}
                  title="Neighbourhood updates"
                  subtitle="Town-wide notices"
                  action={
                    <Link to="/app/notifications">
                      <Button size="sm" variant="ghost">View all</Button>
                    </Link>
                  }
                />
                <CardBody className="space-y-2">
                  {townNotices.map((n) => {
                    const meta = NOTIFICATION_TYPES[n.type];
                    return (
                      <Link
                        key={n.id}
                        to={n.link ?? '/app/notifications'}
                        className="flex items-start gap-2.5 rounded-lg p-2 transition hover:bg-ink-50 dark:hover:bg-white/5"
                      >
                        <span
                          className="mt-1 h-2 w-2 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{n.title}</p>
                          <p className="text-[11px] text-ink-400">{formatRelative(n.at)}</p>
                        </div>
                      </Link>
                    );
                  })}
                </CardBody>
              </Card>
            ) : null}
          </div>
        </div>
      </PageBody>
    </div>
  );
}
