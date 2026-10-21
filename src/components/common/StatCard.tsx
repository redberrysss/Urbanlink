import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export function StatCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  icon,
  accent = '#176B5B',
  spark,
  onClick,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  icon?: ReactNode;
  accent?: string;
  spark?: number[];
  onClick?: () => void;
  className?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      whileHover={onClick ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      onClick={onClick}
      className={cn(
        'surface card-hover relative overflow-hidden p-5',
        onClick && 'cursor-pointer',
        className,
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-80"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}33)` }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
              {value}
            </span>
            {unit ? (
              <span className="text-sm font-semibold text-ink-400">{unit}</span>
            ) : null}
          </div>
        </div>
        {icon ? (
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
            style={{ backgroundColor: `${accent}14`, color: accent }}
          >
            {icon}
          </span>
        ) : null}
      </div>

      {spark && spark.length > 1 ? (
        <div className="mt-3 flex h-8 items-end gap-1" aria-hidden>
          {spark.map((v, i) => {
            const max = Math.max(...spark);
            return (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{
                  height: `${Math.max(12, (v / max) * 100)}%`,
                  backgroundColor: `${accent}${i === spark.length - 1 ? '' : '40'}`,
                }}
              />
            );
          })}
        </div>
      ) : null}

      {typeof delta === 'number' ? (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold',
              positive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta)}%
          </span>
          {deltaLabel ? (
            <span className="text-ink-400 dark:text-ink-500">{deltaLabel}</span>
          ) : null}
        </div>
      ) : null}
    </motion.div>
  );
}
