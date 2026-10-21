import { cn } from '@/utils/cn';

export function ProgressBar({
  value,
  max = 100,
  color = '#176B5B',
  className,
  label,
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-white/10', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function Meter({
  label,
  value,
  suffix = '',
  color = '#176B5B',
  className,
}: {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-ink-500 dark:text-ink-400">{label}</span>
        <span className="text-sm font-bold text-ink-900 dark:text-white">
          {Math.round(value)}
          {suffix}
        </span>
      </div>
      <ProgressBar value={value} color={color} label={label} />
    </div>
  );
}
