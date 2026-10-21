import L from 'leaflet';

export interface MarkerOptions {
  color: string;
  glyph: string;
  size?: number;
  shape?: 'pin' | 'dot' | 'square';
  active?: boolean;
  zIndexOffset?: number;
}

const escape = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string,
  );

/**
 * Builds a Leaflet divIcon. Everything is rendered with inline SVG so the map
 * markers are crisp at any zoom level and inherit no external assets.
 */
export function createMarkerIcon(options: MarkerOptions): L.DivIcon {
  const size = options.size ?? 30;
  const glyph = escape(options.glyph);
  const color = options.color;
  const shape = options.shape ?? 'pin';

  const body =
    shape === 'dot'
      ? `<span class="ts-dot" style="--c:${color};--s:${size}px"></span>`
      : shape === 'square'
        ? `<span class="ts-square" style="--c:${color};--s:${size}px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg></span>`
        : `<span class="ts-pin" style="--c:${color};--s:${size}px"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg></span>`;

  return L.divIcon({
    ...({ zIndexOffset: options.zIndexOffset ?? 0 } as L.DivIconOptions),
    className: 'ts-marker',
    html: body,
    iconSize: [size, size],
    iconAnchor: shape === 'dot' ? [size / 2, size / 2] : [size / 2, size],
    popupAnchor: [0, shape === 'dot' ? -size / 2 : -size + 6],
  });
}

export const ICONS = {
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  dot: '<circle cx="12" cy="12" r="8"/>',
  warning: '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z"/>',
  wave: '<path d="M2 8c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0"/><path d="M2 14c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0"/><path d="M2 20c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0"/>',
  road: '<path d="M4 21 8 3"/><path d="M20 21 16 3"/><path d="M12 4v3"/><path d="M12 11v3"/><path d="M12 18v3"/>',
  accessibility: '<circle cx="12" cy="4" r="2"/><path d="M6 9h12"/><path d="M12 7v6"/><path d="M8 21l4-8 4 8"/>',
  recycle: '<path d="m7 19-2 1v-4"/><path d="M9 15 4.5 8.5 7 5"/><path d="M5.5 12.5 12 12l2.5 4.5"/><path d="M12 16.5 9.5 21"/><path d="M17 12.5 14.5 8 17 4"/><path d="M14.5 8H21"/>',
  crosswalk: '<path d="M4 20h16"/><path d="M6 20V9"/><path d="M10 20V9"/><path d="M14 20V9"/><path d="M18 20V9"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.8 2.8 0 0 1-4-4Z"/><path d="M14.7 6.3 17 4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flag: '<path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/>',
  radio: '<circle cx="12" cy="12" r="2.5"/><path d="M8.5 8.5a5 5 0 0 0 0 7"/><path d="M15.5 15.5a5 5 0 0 0 0-7"/><path d="M5.6 5.6a9 9 0 0 0 0 12.8"/><path d="M18.4 18.4a9 9 0 0 0 0-12.8"/>',
  stairs: '<path d="M3 21h5v-4h4v-4h4V9h4"/>',
} as const;

/** Repairs Leaflet's default marker asset paths (bundler-safe). */
export function fixLeafletIconPaths() {
  const proto = L.Icon.Default.prototype as unknown as {
    _getIconUrl?: (leaflet?: string, sub?: string) => string;
  };
  delete proto._getIconUrl;
}
