import { NavLink } from 'react-router-dom';
import { ClipboardList, Home, Map, Recycle, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/AuthContext';

const ITEMS = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/navigation', label: 'Navigate', icon: Map },
  { to: '/app/reports', label: 'Reports', icon: ClipboardList },
  { to: '/app/safety', label: 'Safety', icon: ShieldCheck },
  { to: '/app/recycling', label: 'Recycling', icon: Recycle },
];

export function BottomNav() {
  const { user } = useAuth();
  if (user?.role !== 'resident') return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-ink-900/95"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 px-1 py-1.5 text-[10px] font-semibold text-ink-500 transition',
                    isActive && 'text-primary-700 dark:text-primary-300',
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
