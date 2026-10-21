import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export function Badge({
  children,
  color = '#176B5B',
  bg = '#EAF6F3',
  className,
  icon,
}: {
  children: ReactNode;
  color?: string;
  bg?: string;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn('badge', className)}
      style={{ color, backgroundColor: bg }}
    >
      {icon}
      {children}
    </span>
  );
}

export function StatusDot({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {pulse ? (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
          style={{ backgroundColor: color }}
        />
      ) : null}
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}
