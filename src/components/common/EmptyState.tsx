import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-500 dark:bg-primary-500/15 dark:text-primary-300">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-bold text-ink-800 dark:text-white">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm text-ink-500 dark:text-ink-400">{description}</p>
      ) : null}
      {action ??
        (actionLabel && onAction ? (
          <Button className="mt-5" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null)}
    </div>
  );
}
