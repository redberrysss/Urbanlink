import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, X, MapPin } from 'lucide-react';
import { navForRole } from '@/config/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { cn } from '@/utils/cn';
import { TOWNSHIP } from '@/data/township';
import { Logo } from '../common/Logo';

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { user } = useAuth();
  const { notifications } = useTownshipData();
  const [expanded, setExpanded] = useState(true);

  const unread =
    notifications.data?.filter((n) => !n.read && n.scope !== 'township').length ?? 0;
  const sections = user ? navForRole(user.role) : [];

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-ink-100 px-4 dark:border-white/10">
        <Logo compact={collapsed} to="/app" />
        <button
          type="button"
          onClick={onCloseMobile}
          className="ml-auto rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 lg:hidden dark:hover:bg-white/10"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-ink-100 px-4 py-3 dark:border-white/10">
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 dark:bg-primary-500/10',
            collapsed && 'justify-center px-0',
          )}
        >
          <MapPin className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-300" />
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-primary-800 dark:text-primary-200">
                {TOWNSHIP.name}
              </p>
              <p className="truncate text-[10px] font-medium text-primary-600/80 dark:text-primary-300/70">
                {TOWNSHIP.state}, {TOWNSHIP.country} · prototype
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3" aria-label="Main navigation">
        {sections.map(({ section, items }) => (
          <div key={section.id} className="mb-4">
            {!collapsed ? (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="mb-1 flex w-full items-center gap-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400 hover:text-ink-600 dark:text-ink-500"
              >
                {section.label}
                <ChevronLeft
                  className={cn('h-3 w-3 transition-transform', expanded ? '-rotate-90' : 'rotate-90')}
                />
              </button>
            ) : null}
            <AnimatePresence initial={false}>
              {(collapsed || expanded) && (
                <motion.ul
                  initial={collapsed ? false : { height: 0, opacity: 0 }}
                  animate={collapsed ? undefined : { height: 'auto', opacity: 1 }}
                  exit={collapsed ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-0.5 overflow-hidden"
                >
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isNotifications = item.to === '/app/notifications';
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          onClick={onCloseMobile}
                          className={({ isActive }) =>
                            cn(
                              'nav-link',
                              isActive && 'nav-link-active',
                              collapsed && 'justify-center px-0',
                            )
                          }
                          title={collapsed ? item.label : undefined}
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0" />
                          {!collapsed ? <span className="truncate">{item.label}</span> : null}
                          {isNotifications && unread > 0 ? (
                            <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-coral-500 px-1.5 text-[10px] font-bold text-white">
                              {unread}
                            </span>
                          ) : null}
                        </NavLink>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      <div className="border-t border-ink-100 p-3 dark:border-white/10">
        {!collapsed ? (
          <p className="px-1 text-[10px] leading-relaxed text-ink-400">
            Prototype build · simulated township data for demonstration only.
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-ink-200 bg-white transition-all duration-300 lg:block dark:border-white/10 dark:bg-ink-900',
          collapsed ? 'w-[76px]' : 'w-[264px]',
        )}
      >
        {content}
        <button
          type="button"
          onClick={onToggle}
          className="absolute -right-3 top-20 z-50 grid h-6 w-6 place-items-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-sm transition hover:border-primary-400 hover:text-primary-600 dark:border-white/15 dark:bg-ink-800 dark:text-ink-300"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm lg:hidden"
              onClick={onCloseMobile}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 w-[270px] bg-white lg:hidden dark:bg-ink-900"
              key="drawer"
            >
              {content}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
