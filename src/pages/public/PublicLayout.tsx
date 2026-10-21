import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { FOOTER_LINKS, PUBLIC_NAV } from '@/config/navigation';
import { cn } from '@/utils/cn';

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen bg-white dark:bg-ink-950">
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-ink-200/80 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-ink-950/85'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="TownSync home">
            <Logo />
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Public navigation">
            {PUBLIC_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="btn-ghost h-10 w-10 p-0"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            {user ? (
              <Link to="/app" className="btn-primary">
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/signin" className="btn-secondary hidden sm:inline-flex">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Get started
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="btn-ghost h-10 w-10 p-0 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-ink-200 bg-white md:hidden dark:border-white/10 dark:bg-ink-950"
            >
              <nav className="space-y-1 px-4 py-4" aria-label="Mobile navigation">
                {PUBLIC_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-white/10"
                  >
                    {item.label}
                  </NavLink>
                ))}
                <Link
                  to="/signin"
                  className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-white/10"
                >
                  Sign in
                </Link>
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <main className="pt-16">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-ink-50 dark:border-white/10 dark:bg-ink-900">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500 dark:text-ink-400">
              One connected platform for accessible mobility, community maintenance, neighbourhood
              safety and sustainable living.
            </p>
            <p className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              Demonstration build — uses simulated township data
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {Object.entries(FOOTER_LINKS).map(([group, links]) => (
              <div key={group}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-white">
                  {group}
                </h3>
                <ul className="mt-3 space-y-2">
                  {links.map((link) => (
                    <li key={link.to + link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-ink-500 transition hover:text-primary-600 dark:text-ink-400 dark:hover:text-primary-300"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-ink-200 pt-6 text-xs text-ink-400 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TownSync. Prototype for smart township demonstration.</p>
          <p>
            Maps © OpenStreetMap contributors · Accessibility attributes are simulated prototype data
          </p>
        </div>
      </div>
    </footer>
  );
}
