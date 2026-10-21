import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Filter, Inbox } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { NOTIFICATION_TYPES, formatRelative } from '@/utils/constants';
import type { AppNotification } from '@/types';
import { cn } from '@/utils/cn';

import { EMPTY_LIST } from '@/utils/empty';
type FilterKey = 'all' | 'unread' | AppNotification['type'];

export function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useTownshipData();
  const [filter, setFilter] = useState<FilterKey>('all');

  const all = notifications.data ?? EMPTY_LIST;

  const filtered = useMemo(() => {
    if (filter === 'all') return all;
    if (filter === 'unread') return all.filter((n) => !n.read);
    return all.filter((n) => n.type === filter);
  }, [all, filter]);

  const unread = all.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        eyebrow="TownSync · Notification Centre"
        title="Notifications"
        description="Updates on your reports, safety warnings, maintenance progress and recycling rewards — all in one feed."
        actions={
          unread > 0 ? (
            <Button
              variant="secondary"
              onClick={() => markAllNotificationsRead()}
              icon={<CheckCheck className="h-4 w-4" />}
            >
              Mark all read
            </Button>
          ) : null
        }
      />

      <PageBody className="space-y-6">
        <Card>
          <CardHeader
            icon={<Bell className="h-5 w-5" />}
            title="Your feed"
            subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
            action={
              <SegmentedControl
                value={filter}
                onChange={setFilter}
                size="sm"
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'unread', label: `Unread (${unread})` },
                  { value: 'hazard', label: 'Safety' },
                  { value: 'success', label: 'Resolved' },
                  { value: 'reward', label: 'Rewards' },
                ]}
              />
            }
          />
          <CardBody>
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-5 w-5" />}
                title="No notifications here"
                description="Switch the filter or check back later — TownSync notifies you whenever something changes on your reports."
              />
            ) : (
              <div className="space-y-2.5">
                {filtered.map((n, i) => {
                  const meta = NOTIFICATION_TYPES[n.type];
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                    >
                      <div
                        className={cn(
                          'flex items-start gap-3 rounded-xl border p-3.5 transition',
                          n.read
                            ? 'border-ink-100 dark:border-white/10'
                            : 'border-primary-200 bg-primary-50/40 dark:border-primary-500/30 dark:bg-primary-500/[0.07]',
                        )}
                      >
                        <span
                          className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-ink-900 dark:text-white">{n.title}</p>
                            <Badge color={meta.color} bg={meta.bg}>
                              {meta.label}
                            </Badge>
                            {!n.read ? (
                              <Badge color="#176B5B" bg="#EAF6F3">
                                New
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
                            {n.body}
                          </p>
                          <p className="mt-1.5 text-[10px] font-medium text-ink-400">
                            {formatRelative(n.at)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          {n.link ? (
                            <Link
                              to={n.link}
                              onClick={() => markNotificationRead(n.id)}
                              className="rounded-lg bg-ink-100 px-2.5 py-1 text-[11px] font-bold text-ink-600 transition hover:bg-primary-100 hover:text-primary-700 dark:bg-white/10 dark:text-ink-300 dark:hover:bg-primary-500/20"
                            >
                              View
                            </Link>
                          ) : null}
                          {!n.read ? (
                            <button
                              type="button"
                              onClick={() => markNotificationRead(n.id)}
                              className="text-[11px] font-semibold text-ink-400 underline-offset-2 hover:text-primary-600 hover:underline dark:hover:text-primary-300"
                            >
                              Mark read
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
                <Filter className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-900 dark:text-white">
                  Notifications are generated by the shared data layer
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                  A single status change in FixMyTown writes an entry to the report timeline, updates
                  the linked SafeSpot hazard and AccessAble obstacle, and notifies every resident who
                  reported or supported it — with no duplicated records.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </PageBody>
    </div>
  );
}
