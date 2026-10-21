import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  render: (row: T) => ReactNode;
  className?: string;
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty,
  pageSize = 8,
  onRowClick,
  rowClassName,
  initialSort,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: ReactNode;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(
    initialSort ?? null,
  );
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const cols = columns
        .map((c) => {
          const v = c.sortValue ? c.sortValue(r) : '';
          return `${v}`;
        })
        .join(' ')
        .toLowerCase();
      const extra = Object.values(r as Record<string, unknown>)
        .filter((v) => typeof v === 'string' || typeof v === 'number')
        .join(' ')
        .toLowerCase();
      return `${cols} ${extra}`.includes(q);
    });
  }, [rows, columns, query]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return filtered;
    const value = col.sortValue;
    return [...filtered].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  const hideClass = (hideBelow?: 'sm' | 'md' | 'lg' | 'xl') => {
    if (!hideBelow) return '';
    return {
      sm: 'hidden sm:table-cell',
      md: 'hidden md:table-cell',
      lg: 'hidden lg:table-cell',
      xl: 'hidden xl:table-cell',
    }[hideBelow];
  };

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search records…"
          aria-label="Search records"
          className="input pl-9 pr-9"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="py-10 text-center text-sm text-ink-500 dark:text-ink-400">
          {empty ?? 'No records match your search.'}
        </div>
      ) : (
        <div className="scrollbar-thin -mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={cn(
                      'border-b border-ink-200 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-ink-500 dark:border-white/10 dark:text-ink-400',
                      hideClass(c.hideBelow),
                      c.sortable && 'cursor-pointer select-none hover:text-primary-600',
                    )}
                    onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                    aria-sort={
                      sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.header}
                      {c.sortable ? (
                        sort?.key === c.key ? (
                          sort.dir === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ChevronDown className="h-3 w-3 opacity-30" />
                        )
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'group transition hover:bg-ink-50/80 dark:hover:bg-white/5',
                    onRowClick && 'cursor-pointer',
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'border-b border-ink-100 px-3 py-3 align-middle dark:border-white/5',
                        hideClass(c.hideBelow),
                        c.className,
                      )}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-ink-500 dark:text-ink-400">
            Showing {safePage * pageSize + 1}–{Math.min(sorted.length, (safePage + 1) * pageSize)} of{' '}
            {sorted.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <span className="px-2 text-xs font-semibold text-ink-600 dark:text-ink-300">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
