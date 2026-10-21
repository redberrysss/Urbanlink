import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Accessibility,
  ClipboardList,
  CornerDownLeft,
  Recycle,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { cn } from '@/utils/cn';

import { EMPTY_LIST } from '@/utils/empty';
interface Entry {
  id: string;
  title: string;
  subtitle: string;
  group: string;
  to: string;
  icon: typeof Search;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { reports, hazards, stations, obstacles } = useTownshipData();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [];
    (reports.data ?? EMPTY_LIST).forEach((r) =>
      list.push({
        id: r.id,
        title: r.title,
        subtitle: `${r.reference} · ${r.address}`,
        group: 'Reports',
        to: `/app/reports/${r.id}`,
        icon: ClipboardList,
      }),
    );
    (hazards.data ?? EMPTY_LIST).forEach((h) =>
      list.push({
        id: h.id,
        title: h.title,
        subtitle: h.address,
        group: 'Safety hazards',
        to: `/app/safety/${h.id}`,
        icon: ShieldCheck,
      }),
    );
    (stations.data ?? EMPTY_LIST).forEach((s) =>
      list.push({
        id: s.id,
        title: s.name,
        subtitle: s.address,
        group: 'Recycling stations',
        to: `/app/recycling?station=${s.id}`,
        icon: Recycle,
      }),
    );
    (obstacles.data ?? EMPTY_LIST).forEach((o) =>
      list.push({
        id: o.id,
        title: o.title,
        subtitle: o.description,
        group: 'Accessibility obstacles',
        to: '/app/navigation',
        icon: Accessibility,
      }),
    );
    return list;
  }, [reports.data, hazards.data, stations.data, obstacles.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 8);
    return entries
      .filter((e) => `${e.title} ${e.subtitle} ${e.group}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [entries, query]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      }
      if (e.key === 'Enter') {
        const entry = filtered[active];
        if (entry) {
          navigate(entry.to);
          onClose();
        }
      }
    },
    [filtered, active, navigate, onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => {
      document.getElementById('command-palette-input')?.focus();
    }, 50);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open, onKey]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1150] flex items-start justify-center p-4 pt-[12vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card-hover dark:border-white/10 dark:bg-ink-900"
          role="dialog"
          aria-label="Global search"
        >
          <div className="flex items-center gap-3 border-b border-ink-100 px-4 dark:border-white/10">
            <Search className="h-4 w-4 shrink-0 text-ink-400" />
            <input
              id="command-palette-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports, hazards, stations, obstacles…"
              className="h-14 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400 dark:text-ink-100"
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="scrollbar-thin max-h-[52vh] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-ink-400">
                No results for “{query}”.
              </p>
            ) : (
              filtered.map((entry, i) => {
                const Icon = entry.icon;
                return (
                  <button
                    key={`${entry.group}-${entry.id}`}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => {
                      navigate(entry.to);
                      onClose();
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                      i === active ? 'bg-primary-50 dark:bg-primary-500/10' : 'hover:bg-ink-50 dark:hover:bg-white/5',
                    )}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-800 dark:text-ink-100">
                        {entry.title}
                      </span>
                      <span className="block truncate text-xs text-ink-500 dark:text-ink-400">
                        {entry.group} · {entry.subtitle}
                      </span>
                    </span>
                    {i === active ? (
                      <CornerDownLeft className="h-4 w-4 shrink-0 text-ink-400" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
