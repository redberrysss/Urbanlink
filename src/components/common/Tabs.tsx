import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

const TabsContext = createContext<{ value: string; setValue: (v: string) => void } | null>(null);

export function Tabs({
  items,
  defaultValue,
  value: controlled,
  onChange,
  className,
  children,
}: {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  className?: string;
  children?: ReactNode;
}) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id ?? '');
  const value = controlled ?? internal;
  const setValue = useCallback(
    (v: string) => {
      setInternal(v);
      onChange?.(v);
    },
    [onChange],
  );
  const ctx = useMemo(() => ({ value, setValue }), [value, setValue]);

  return (
    <TabsContext.Provider value={ctx}>
      <div className={className}>
        <div
          className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-ink-200 dark:border-white/10"
          role="tablist"
        >
          {items.map((item) => {
            const active = item.id === value;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setValue(item.id)}
                className={cn(
                  'relative flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-semibold transition',
                  active
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100',
                )}
              >
                {item.icon}
                {item.label}
                {typeof item.count === 'number' ? (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      active
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/25 dark:text-primary-200'
                        : 'bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-400',
                    )}
                  >
                    {item.count}
                  </span>
                ) : null}
                {active ? (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary-600"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabPanel({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx || ctx.value !== id) return null;
  return (
    <div role="tabpanel" className={cn('animate-fade-in', className)}>
      {children}
    </div>
  );
}
