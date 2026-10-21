import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('border-b border-ink-200 bg-white dark:border-white/10 dark:bg-ink-900', className)}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-[28px]">
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </div>
  );
}

export function PageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}
