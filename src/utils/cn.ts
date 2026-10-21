type ClassValue = string | number | null | undefined | false | ClassValue[] | Record<string, boolean | undefined | null>;

/** Minimal classnames joiner — avoids an extra runtime dependency. */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (!v && v !== 0) return;
    if (typeof v === 'string' || typeof v === 'number') {
      out.push(String(v));
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    if (typeof v === 'object') {
      Object.entries(v).forEach(([key, on]) => {
        if (on) out.push(key);
      });
    }
  };
  inputs.forEach(walk);
  return out.join(' ');
}
