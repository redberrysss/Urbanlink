/** Generates lightweight inline SVG placeholder "photos" for the demo dataset. */
const cache = new Map<string, string>();

export function demoPhoto(label: string, hue = 190): string {
  const key = `${label}|${hue}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},45%,62%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 45) % 360},50%,38%)"/>
    </linearGradient>
  </defs>
  <rect width="480" height="320" fill="url(#g)"/>
  <circle cx="392" cy="62" r="86" fill="rgba(255,255,255,0.12)"/>
  <circle cx="72" cy="268" r="120" fill="rgba(0,0,0,0.10)"/>
  <path d="M0 236 L120 176 L232 232 L352 158 L480 214 L480 320 L0 320 Z" fill="rgba(255,255,255,0.10)"/>
  <g fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="5" stroke-linecap="round">
    <path d="M52 92 h84"/><path d="M52 116 h56"/>
  </g>
  <text x="24" y="292" font-family="Inter, system-ui, sans-serif" font-size="19" font-weight="700" fill="rgba(255,255,255,0.95)">${escapeXml(label)}</text>
</svg>`;

  const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  cache.set(key, url);
  return url;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string,
  );
}
