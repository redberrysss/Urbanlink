import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  label,
  hint,
  error,
  className,
  id,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const groups = options.reduce<Record<string, SelectOption[]>>((acc, o) => {
    const key = o.group ?? '';
    (acc[key] ||= []).push(o);
    return acc;
  }, {});

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={selectId} className="label">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'input cursor-pointer appearance-none pr-9',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-200',
          )}
          aria-invalid={error ? true : undefined}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {Object.entries(groups).map(([group, opts]) =>
            group ? (
              <optgroup key={group} label={group}>
                {opts.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              opts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))
            ),
          )}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      </div>
      {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}
      {hint && !error ? <p className="hint">{hint}</p> : null}
    </div>
  );
}
