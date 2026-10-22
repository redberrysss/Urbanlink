import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export function Logo({
  className,
  compact = false,
  inverted = false,
  to,
  label = 'TownSync',
}: {
  className?: string;
  compact?: boolean;
  inverted?: boolean;
  /** When provided the wordmark becomes a link to this route. */
  to?: string;
  label?: string;
}) {
  const mark = (
    <>
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-600 shadow-glow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3c-3.3 0-6 2.7-6 6 0 4.5 6 14 6 14s6-9.5 6-14c0-3.3-2.7-6-6-6Z"
            fill="#fff"
            fillOpacity="0.95"
          />
          <circle cx="12" cy="9" r="2.1" fill="#FB5A36" />
        </svg>
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span
            className={cn(
              'block font-display text-[17px] font-extrabold leading-tight tracking-tight',
              inverted ? 'text-white' : 'text-ink-900 dark:text-white',
            )}
          >
            Town<span className="text-primary-600 dark:text-primary-300">Sync</span>
          </span>
          <span
            className={cn(
              'block text-[10px] font-semibold uppercase tracking-[0.14em]',
              inverted ? 'text-white/60' : 'text-ink-400',
            )}
          >
            Smart Township
          </span>
        </span>
      ) : null}
    </>
  );

  if (!to) {
    return <div className={cn('flex items-center gap-2.5', className)}>{mark}</div>;
  }

  return (
    <Link
      to={to}
      aria-label={`${label} — go to ${to === '/app' ? 'overview' : 'home'}`}
      className={cn(
        'flex items-center gap-2.5 rounded-xl transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500',
        className,
      )}
    >
      {mark}
    </Link>
  );
}
