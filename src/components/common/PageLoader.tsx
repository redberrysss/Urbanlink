export function PageLoader({ label = 'Loading TownSync…' }: { label?: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-primary-200 border-t-primary-600" />
        <p className="text-sm font-semibold text-ink-500 dark:text-ink-400">{label}</p>
      </div>
    </div>
  );
}

export default PageLoader;
