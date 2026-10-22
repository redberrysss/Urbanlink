import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Filter, Inbox, Megaphone, Send } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Select } from '@/components/common/Select';
import { useToast } from '@/components/common/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { NOTIFICATION_TYPES, formatRelative } from '@/utils/constants';
import type { AppNotification } from '@/types';
import { cn } from '@/utils/cn';

import { EMPTY_LIST } from '@/utils/empty';
type FilterKey = 'all' | 'unread' | AppNotification['type'];

export function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, broadcastUpdate } =
    useTownshipData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterKey>('all');
  const isAdmin = user?.role === 'admin';

  const [composerOpen, setComposerOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeType, setNoticeType] = useState<'info' | 'warning'>('info');
  const [noticeLink, setNoticeLink] = useState('');
  const [publishing, setPublishing] = useState(false);

  const resetComposer = () => {
    setNoticeTitle('');
    setNoticeBody('');
    setNoticeType('info');
    setNoticeLink('');
  };

  const publishNotice = async () => {
    if (!noticeTitle.trim() || !noticeBody.trim()) return;
    setPublishing(true);
    try {
      await broadcastUpdate({
        title: noticeTitle,
        body: noticeBody,
        type: noticeType,
        link: noticeLink || undefined,
      });
      toast({
        kind: 'success',
        title: 'Town update published',
        description: 'Every resident now sees this notice in their notifications.',
      });
      resetComposer();
      setComposerOpen(false);
    } catch (error) {
      toast({
        kind: 'error',
        title: 'Could not publish the update',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setPublishing(false);
    }
  };

  const all = notifications.data ?? EMPTY_LIST;

  const personal = useMemo(() => all.filter((n) => n.scope !== 'township'), [all]);
  const townNotices = useMemo(() => all.filter((n) => n.scope === 'township'), [all]);

  const filtered = useMemo(() => {
    if (filter === 'all') return personal;
    if (filter === 'unread') return personal.filter((n) => !n.read);
    return personal.filter((n) => n.type === filter);
  }, [personal, filter]);

  const unread = personal.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        eyebrow="TownSync · Notification Centre"
        title="Notifications"
        description="Everything that changed on your reports, plus township-wide updates — one feed, no duplicate activity list."
        actions={
          <>
            {unread > 0 ? (
              <Button
                variant="secondary"
                onClick={() => markAllNotificationsRead()}
                icon={<CheckCheck className="h-4 w-4" />}
              >
                Mark all read
              </Button>
            ) : null}
            {isAdmin ? (
              <Button
                onClick={() => setComposerOpen(true)}
                icon={<Megaphone className="h-4 w-4" />}
              >
                Broadcast town update
              </Button>
            ) : null}
          </>
        }
      />

      <PageBody className="space-y-6">
        <Card>
          <CardHeader
            icon={<Bell className="h-5 w-5" />}
            title="Your updates"
            subtitle={
              unread > 0
                ? `${unread} unread · report progress, maintenance work and recycling rewards`
                : 'Report progress, maintenance work and recycling rewards'
            }
            action={
              <SegmentedControl
                value={filter}
                onChange={setFilter}
                size="sm"
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'unread', label: `Unread (${unread})` },
                  { value: 'info', label: 'Progress' },
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
          <CardHeader
            icon={<Megaphone className="h-5 w-5" />}
            title="Town updates"
            subtitle="Notices broadcast to every resident in Bandar Seri Damai"
            action={
              isAdmin ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setComposerOpen(true)}
                  icon={<Megaphone className="h-3.5 w-3.5" />}
                >
                  New notice
                </Button>
              ) : undefined
            }
          />
          <CardBody>
            {townNotices.length === 0 ? (
              <EmptyState
                icon={<Megaphone className="h-5 w-5" />}
                title="No town-wide notices"
                description="Advisories such as heavy rain, road works or utility shutdowns appear here for everyone."
              />
            ) : (
              <div className="space-y-2.5">
                {townNotices.map((n, i) => {
                  const meta = NOTIFICATION_TYPES[n.type];
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                      className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/50 p-3.5 dark:border-sky-500/30 dark:bg-sky-500/[0.07]"
                    >
                      <span
                        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                        style={{ backgroundColor: `${meta.color}1A` }}
                      >
                        <Megaphone className="h-3.5 w-3.5" style={{ color: meta.color }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-ink-900 dark:text-white">{n.title}</p>
                          <Badge color={meta.color} bg={meta.bg}>
                            {meta.label}
                          </Badge>
                          <Badge color="#0369A1" bg="#E0F2FE">
                            Everyone
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
                          {n.body}
                        </p>
                        <p className="mt-1.5 text-[10px] font-medium text-ink-400">
                          {formatRelative(n.at)}
                        </p>
                      </div>
                      {n.link ? (
                        <Link
                          to={n.link}
                          className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-ink-600 transition hover:bg-primary-100 hover:text-primary-700 dark:bg-white/10 dark:text-ink-300 dark:hover:bg-primary-500/20"
                        >
                          View
                        </Link>
                      ) : null}
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
                  reported or supported it — with no duplicated records. Maintenance crews add their own
                  progress notes the same way, and town-wide notices are broadcast from one record
                  rather than one copy per resident.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </PageBody>

      {isAdmin ? (
        <Modal
          open={composerOpen}
          onClose={() => setComposerOpen(false)}
          title="Broadcast a town update"
          description="One notice, stored once, shown to every resident. Use it for resolved issues, maintenance and construction work, or community announcements."
          icon={<Megaphone className="h-5 w-5" />}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setComposerOpen(false)}>
                Cancel
              </button>
              <Button
                onClick={publishNotice}
                loading={publishing}
                disabled={!noticeTitle.trim() || !noticeBody.trim()}
                icon={<Send className="h-4 w-4" />}
              >
                Publish update
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="update-title" className="label">
                Title
              </label>
              <input
                id="update-title"
                className="input"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="e.g. Boardwalk resurfacing until Sunday"
                maxLength={90}
              />
            </div>
            <div>
              <label htmlFor="update-body" className="label">
                Message
              </label>
              <textarea
                id="update-body"
                className="input min-h-[110px]"
                value={noticeBody}
                onChange={(e) => setNoticeBody(e.target.value)}
                placeholder="What changed, where, and what residents should do."
                maxLength={600}
              />
              <p className="hint">{noticeBody.length}/600 characters</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Update type"
                value={noticeType}
                onChange={(v) => setNoticeType(v as 'info' | 'warning')}
                options={[
                  { value: 'info', label: 'Town notice' },
                  { value: 'warning', label: 'Advisory / warning' },
                ]}
              />
              <Select
                label="Link (optional)"
                value={noticeLink}
                onChange={setNoticeLink}
                options={[
                  { value: '', label: 'No link' },
                  { value: '/app/reports', label: 'Community Reports' },
                  { value: '/app/navigation', label: 'Smart Navigation' },
                  { value: '/app/safety', label: 'Safety Monitor' },
                  { value: '/app/recycling', label: 'Recycling Hub' },
                ]}
              />
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
