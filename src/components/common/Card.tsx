import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('surface', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4 dark:border-white/10',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-ink-900 dark:text-white">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('border-t border-ink-100 px-5 py-3 dark:border-white/10', className)}>
      {children}
    </div>
  );
}
