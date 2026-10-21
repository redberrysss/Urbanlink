import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Accessibility,
  Award,
  ClipboardList,
  Mail,
  MapPin,
  Recycle,
  Sparkles,
  ThumbsUp,
  User as UserIcon,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Meter } from '@/components/common/Progress';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  PRIORITY_META,
  REPORT_CATEGORY_META,
  REPORT_STATUS_META,
  ROLES_META,
  formatDate,
  formatWeight,
} from '@/utils/constants';

import { EMPTY_LIST } from '@/utils/empty';
export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reports, activities } = useTownshipData();

  const allReports = reports.data ?? EMPTY_LIST;
  const allActivities = activities.data ?? EMPTY_LIST;

  const myReports = useMemo(
    () => allReports.filter((r) => r.reportedBy === user?.id),
    [allReports, user?.id],
  );
  const supported = useMemo(
    () => allReports.filter((r) => r.supporters.includes(user?.id ?? '')),
    [allReports, user?.id],
  );
  const myActivities = useMemo(
    () => allActivities.filter((a) => a.userId === user?.id),
    [allActivities, user?.id],
  );

  const verifiedKg = myActivities
    .filter((a) => a.status === 'verified')
    .reduce((s, a) => s + a.weightKg, 0);

  const resolved = myReports.filter((r) => r.status === 'resolved').length;
  const resolutionRate = myReports.length
    ? Math.round((resolved / myReports.length) * 100)
    : 0;

  if (!user) {
    return (
      <PageBody>
        <Card>
          <CardBody>
            <EmptyState icon={<UserIcon className="h-5 w-5" />} title="Not signed in" />
          </CardBody>
        </Card>
      </PageBody>
    );
  }

  const role = ROLES_META[user.role];

  return (
    <div>
      <PageHeader
        eyebrow="TownSync · Resident Profile"
        title="My profile"
        description="Your contribution to the township, the issues you have raised and the rewards you have earned."
        actions={
          <Link to="/app/settings">
            <Button variant="secondary">Account settings</Button>
          </Link>
        }
      />

      <PageBody className="space-y-6">
        {/* Identity card */}
        <Card>
          <CardBody>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-2xl font-extrabold text-white">
                {user.name
                  .split(' ')
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-extrabold text-ink-900 dark:text-white">{user.name}</h2>
                  <Badge color={role.color} bg={role.bg}>
                    {role.label}
                  </Badge>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                  {user.block ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {user.block}
                    </span>
                  ) : null}
                  <span>Member since {formatDate(user.joinedAt)}</span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                  {role.description}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center dark:border-emerald-500/25 dark:bg-emerald-500/10">
                <p className="flex items-center justify-center gap-1.5 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="h-5 w-5" />
                  {user.points}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800/70 dark:text-emerald-200/70">
                  Points balance
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Contribution stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Reports raised',
              value: String(myReports.length),
              icon: <ClipboardList className="h-5 w-5" />,
              color: '#FB5A36',
            },
            {
              label: 'Reports supported',
              value: String(supported.length),
              icon: <ThumbsUp className="h-5 w-5" />,
              color: '#0EA5E9',
            },
            {
              label: 'Resolution rate',
              value: `${resolutionRate}%`,
              icon: <Award className="h-5 w-5" />,
              color: '#047857',
            },
            {
              label: 'Recycled',
              value: formatWeight(verifiedKg),
              icon: <Recycle className="h-5 w-5" />,
              color: '#7C3AED',
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardBody className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{s.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-white">
                    {s.value}
                  </p>
                </div>
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.icon}
                </span>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* My reports */}
          <Card>
            <CardHeader
              icon={<ClipboardList className="h-5 w-5" />}
              title="Reports I raised"
              subtitle={`${myReports.length} submissions`}
            />
            <CardBody className="space-y-2.5">
              {myReports.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList className="h-5 w-5" />}
                  title="No reports yet"
                  description="Report an issue to start tracking it here."
                  actionLabel="Report an issue"
                  onAction={() => navigate('/app/reports/new')}
                />
              ) : (
                myReports.slice(0, 6).map((r) => {
                  const status = REPORT_STATUS_META[r.status];
                  const priority = PRIORITY_META[r.priority.level];
                  return (
                    <Link
                      key={r.id}
                      to={`/app/reports/${r.id}`}
                      className="block rounded-xl border border-ink-100 p-3.5 transition hover:border-primary-300 dark:border-white/10"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-1 text-xs font-bold text-ink-800 dark:text-ink-100">
                          {r.title}
                        </p>
                        <Badge color={status.color} bg={status.bg}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-ink-400">
                        <span
                          className="inline-flex items-center gap-1"
                          style={{ color: REPORT_CATEGORY_META[r.category].color }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: REPORT_CATEGORY_META[r.category].color }}
                          />
                          {REPORT_CATEGORY_META[r.category].label}
                        </span>
                        <span>· {r.reference}</span>
                        <span className="font-bold" style={{ color: priority.color }}>
                          · {priority.label}
                        </span>
                      </p>
                    </Link>
                  );
                })
              )}
            </CardBody>
          </Card>

          {/* Impact */}
          <div className="space-y-6">
            <Card>
              <CardHeader
                icon={<Accessibility className="h-5 w-5" />}
                title="Community impact"
                subtitle="How your reports contribute to township accessibility"
              />
              <CardBody className="space-y-4">
                <Meter
                  label="Your reports resolved"
                  value={resolutionRate}
                  suffix="%"
                  color="#047857"
                />
                <Meter
                  label="Share of reports you raised"
                  value={
                    allReports.length ? (myReports.length / allReports.length) * 100 : 0
                  }
                  suffix="%"
                  color="#176B5B"
                />
                <Meter
                  label="Reports that reached safety triage"
                  value={
                    myReports.length
                      ? (myReports.filter((r) => r.safetyHazardId).length / myReports.length) * 100
                      : 0
                  }
                  suffix="%"
                  color="#F0330F"
                />
                <Meter
                  label="Reports that affected accessibility routing"
                  value={
                    myReports.length
                      ? (myReports.filter((r) => r.obstacleId).length / myReports.length) * 100
                      : 0
                  }
                  suffix="%"
                  color="#0EA5E9"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={<Recycle className="h-5 w-5" />}
                title="Recent recycling activity"
                subtitle={`${myActivities.length} submissions`}
              />
              <CardBody>
                {myActivities.length === 0 ? (
                  <EmptyState
                    icon={<Recycle className="h-5 w-5" />}
                    title="No recycling activity"
                    description="Log a drop-off at any station to earn points."
                  />
                ) : (
                  <div className="space-y-2">
                    {myActivities.slice(0, 4).map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3 dark:border-white/10"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-ink-800 dark:text-ink-100">
                            {formatWeight(a.weightKg)} · {a.stationName}
                          </p>
                          <p className="text-[10px] capitalize text-ink-400">{a.status}</p>
                        </div>
                        <Badge
                          color={a.status === 'verified' ? '#047857' : '#B45309'}
                          bg={a.status === 'verified' ? '#D1FAE5' : '#FEF3C7'}
                        >
                          {a.pointsAwarded} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
