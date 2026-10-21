import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: ReactNode }[];
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-ink-50 p-1 dark:border-white/10 dark:bg-white/5',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg font-semibold transition',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
              active
                ? 'bg-white text-primary-700 shadow-sm dark:bg-white/10 dark:text-primary-200'
                : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
