# Deployment

TownSync builds to a static SPA in `dist/`. It needs no server runtime, only a host that can
serve static files and rewrite unknown paths to `index.html`.

---

## 1. Build

```bash
npm ci
npm run build      # runs the type-check and emits dist/
npm run preview    # optional: verify the bundle locally on :4173
```

The build output:

```
dist/index.html
dist/assets/index-*.js
dist/assets/index-*.css
dist/assets/{react,maps,charts,motion}-*.js
```

---

## 2. Firebase Hosting

`firebase.json` is already configured with the catch-all rewrite, immutable caching for
hashed assets and `no-cache` for the HTML entry point.

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only hosting
```

To also publish the backend rules:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage,hosting
```

---

## 3. Netlify

`netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Or configure it in the Netlify UI: build command `npm run build`, publish directory `dist`,
and add the redirect above.

---

## 4. Vercel

`vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 5. Nginx

```nginx
server {
  listen 80;
  server_name townsync.example.com;
  root /var/www/townsync/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(js|css|woff2?|png|jpg|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location = /index.html {
    add_header Cache-Control "no-cache";
  }
}
```

---

## 6. Environment configuration at build time

Vite inlines `VITE_*` variables into the bundle at build time, so the environment must be
set on the machine that runs `npm run build`.

| Variable | When to set |
| --- | --- |
| `VITE_FORCE_DEMO_MODE` | `true` for a demo deployment, unset for a Firebase deployment. |
| `VITE_FIREBASE_*` | Always set for a Firebase deployment. |

Example for a demo build:

```bash
VITE_FORCE_DEMO_MODE=true npm run build
```

---

## 7. Pre-deployment checklist

- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` reports no warnings.
- [ ] `npm run build` completes.
- [ ] `.env.local` is **not** committed and no credentials appear in `dist/assets/*.js`.
- [ ] The catch-all rewrite to `index.html` is configured, so deep links such as
      `/app/reports` resolve on a hard refresh.
- [ ] Firebase rules are deployed if the Firebase backend is in use.
- [ ] The seeded `users` documents carry a valid `role`.

---

## 8. Post-deployment smoke test

1. Load the root URL — the public home page renders.
2. Open `/app` directly — the app redirects to sign-in.
3. Sign in with a demo account, then hard-refresh on `/app/reports` — the page still loads.
4. Toggle dark mode and reload — the theme persists.
5. Open the map — tiles load from OpenStreetMap.
