import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User as UserIcon,
  Users,
  Repeat,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { ROLES_META } from '@/utils/constants';
import { formatRelative } from '@/utils/constants';
import { cn } from '@/utils/cn';
import { Badge } from '../common/Badge';

import { EMPTY_LIST } from '@/utils/empty';
export function Topbar({
  onOpenMenu,
  onOpenSearch,
}: {
  onOpenMenu: () => void;
  onOpenSearch: () => void;
}) {
  const { user, signOut, switchDemoRole } = useAuth();
  const { theme, toggle } = useTheme();
  const { notifications, reports, markNotificationRead, markAllNotificationsRead } =
    useTownshipData();
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const navigate = useNavigate();
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const items = notifications.data ?? EMPTY_LIST;
  const unread = items.filter((n) => !n.read);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = useMemo(
    () =>
      (user?.name ?? 'Guest')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join(''),
    [user?.name],
  );

  const roleMeta = user ? ROLES_META[user.role] : null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/85 px-4 backdrop-blur-xl sm:px-6 dark:border-white/10 dark:bg-ink-900/85">
      <button
        type="button"
        onClick={onOpenMenu}
        className="btn-ghost h-10 w-10 p-0 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={onOpenSearch}
        className="group flex h-10 flex-1 items-center gap-2.5 rounded-xl border border-ink-200 bg-ink-50/80 px-3.5 text-left text-sm text-ink-400 transition hover:border-primary-300 hover:bg-white sm:max-w-md dark:border-white/10 dark:bg-white/5 dark:hover:border-primary-500/40"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden flex-1 truncate sm:block">
          Search reports, hazards, stations…
        </span>
        <kbd className="hidden rounded-md border border-ink-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-bold text-ink-400 dark:border-white/10 dark:bg-ink-800 sm:block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggle}
          className="btn-ghost h-10 w-10 p-0"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            onClick={() => setBellOpen((o) => !o)}
            className="btn-ghost relative h-10 w-10 p-0"
            aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ''}`}
            aria-expanded={bellOpen}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread.length > 0 ? (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-coral-500 px-1 text-[9px] font-bold text-white">
                {unread.length}
              </span>
            ) : null}
          </button>

          <AnimatePresence>
            {bellOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 z-50 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card-hover dark:border-white/10 dark:bg-ink-900"
              >
                <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-white/10">
                  <p className="text-sm font-bold text-ink-900 dark:text-white">Notifications</p>
                  {unread.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsRead()}
                      className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-300"
                    >
                      Mark all read
                    </button>
                  ) : null}
                </div>
                <div className="scrollbar-thin max-h-[380px] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-ink-400">
                      You have no notifications yet.
                    </p>
                  ) : (
                    items.slice(0, 8).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id);
                          setBellOpen(false);
                          if (n.link) navigate(n.link);
                        }}
                        className={cn(
                          'flex w-full gap-3 border-b border-ink-100 px-4 py-3 text-left transition last:border-0 hover:bg-ink-50 dark:border-white/5 dark:hover:bg-white/5',
                          !n.read && 'bg-primary-50/40 dark:bg-primary-500/5',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            n.read ? 'bg-transparent' : 'bg-primary-500',
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink-800 dark:text-ink-100">
                            {n.title}
                          </span>
                          <span className="mt-0.5 block line-clamp-2 text-xs text-ink-500 dark:text-ink-400">
                            {n.body}
                          </span>
                          <span className="mt-1 block text-[10px] font-medium text-ink-400">
                            {formatRelative(n.at)}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <Link
                  to="/app/notifications"
                  onClick={() => setBellOpen(false)}
                  className="block border-t border-ink-100 px-4 py-3 text-center text-xs font-bold text-primary-600 hover:bg-ink-50 dark:border-white/10 dark:hover:bg-white/5 dark:text-primary-300"
                >
                  View all notifications
                </Link>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setUserOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-ink-100 dark:hover:bg-white/10"
            aria-expanded={userOpen}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-600 text-sm font-bold text-white">
              {initials}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-ink-400 sm:block" />
          </button>

          <AnimatePresence>
            {userOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 z-50 w-[280px] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card-hover dark:border-white/10 dark:bg-ink-900"
              >
                <div className="border-b border-ink-100 px-4 py-3.5 dark:border-white/10">
                  <p className="truncate text-sm font-bold text-ink-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-ink-500 dark:text-ink-400">{user?.email}</p>
                  {roleMeta ? (
                    <Badge
                      className="mt-2"
                      color={roleMeta.color}
                      bg={roleMeta.bg}
                    >
                      {roleMeta.label}
                    </Badge>
                  ) : null}
                </div>

                <div className="p-1.5">
                  <Link
                    to="/app/profile"
                    onClick={() => setUserOpen(false)}
                    className="nav-link"
                  >
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to="/app/settings"
                    onClick={() => setUserOpen(false)}
                    className="nav-link"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </div>

                {user?.isDemo ? (
                  <div className="border-t border-ink-100 p-3 dark:border-white/10">
                    <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                      <Repeat className="h-3 w-3" />
                      Switch demo role
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(ROLES_META) as (keyof typeof ROLES_META)[]).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={async () => {
                            await switchDemoRole(role);
                            setUserOpen(false);
                            navigate(
                              role === 'admin'
                                ? '/app/admin'
                                : role === 'maintenance'
                                  ? '/app/tasks'
                                  : role === 'operator'
                                    ? '/app/verification'
                                    : '/app',
                            );
                          }}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition',
                            user?.role === role
                              ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-200'
                              : 'border-ink-200 text-ink-600 hover:border-primary-300 hover:text-primary-700 dark:border-white/10 dark:text-ink-300',
                          )}
                        >
                          {user?.role === role ? <Check className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                          {ROLES_META[role].label.replace('Township ', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="border-t border-ink-100 p-1.5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setUserOpen(false);
                      void signOut();
                    }}
                    className="nav-link w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {reports.data && reports.data.length === 0 ? null : null}
    </header>
  );
}
