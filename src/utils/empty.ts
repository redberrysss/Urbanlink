/**
 * A single, stable empty array reference.
 *
 * Using `data ?? []` inline creates a brand new array on every render, which
 * invalidates any `useMemo` that depends on it. Falling back to this constant
 * keeps the identity stable while the query has no data yet.
 */
export const EMPTY_LIST: never[] = [];
