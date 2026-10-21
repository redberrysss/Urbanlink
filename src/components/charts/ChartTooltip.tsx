import type { TooltipProps } from 'recharts';

export function ChartTooltip({
  active,
  payload,
  label,
  suffix = '',
  prefix = '',
}: TooltipProps<number, string> & { suffix?: string; prefix?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-ink-200 bg-white/95 px-3 py-2 shadow-card-hover backdrop-blur dark:border-white/10 dark:bg-ink-800/95">
      {label ? (
        <p className="mb-1 text-xs font-bold text-ink-900 dark:text-white">{label}</p>
      ) : null}
      <ul className="space-y-0.5">
        {payload.map((entry, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color ?? entry.payload?.fill ?? '#176B5B' }}
            />
            <span className="text-ink-500 dark:text-ink-300">{entry.name}</span>
            <span className="ml-auto font-bold text-ink-900 dark:text-white">
              {prefix}
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              {suffix}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
