/**
 * Route smoke test for TownSync.
 *
 * Signs in with each demo role, visits every route in the application and
 * fails if a route renders nothing or logs an error to the console.
 */
import { Harness, createReporter } from './harness.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:5174';

const ROUTES = {
  resident: [
    '/app',
    '/app/navigation',
    '/app/reports',
    '/app/reports/new',
    '/app/safety',
    '/app/recycling',
    '/app/activities',
    '/app/notifications',
    '/app/profile',
    '/app/settings',
  ],
  maintenance: ['/app', '/app/tasks', '/app/reports', '/app/profile'],
  operator: ['/app', '/app/verification', '/app/recycling', '/app/activities'],
  admin: [
    '/app/admin',
    '/app/admin/issues',
    '/app/admin/teams',
    '/app/admin/accessibility',
    '/app/admin/safety',
    '/app/admin/recycling',
    '/app/admin/users',
    '/app/admin/analytics',
  ],
};

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/features',
  '/how-it-works',
  '/signin',
  '/register',
  '/missing-page',
];

const ROLE_SESSION = {
  resident: 'u_resident',
  maintenance: 'u_maintenance',
  operator: 'u_operator',
  admin: 'u_admin',
};

async function main() {
  const harness = new Harness({ baseUrl: BASE, port: 9333, name: 'routes' });
  await harness.start();

  const reporter = createReporter();

  try {
    await harness.goto('/');

    for (const [role, routes] of Object.entries(ROUTES)) {
      await harness.setRole(role, ROLE_SESSION[role]);
      for (const route of routes) {
        harness.errors.length = 0;
        await harness.goto(route, 1600);
        const info = await harness.evaluate(`(() => {
          const root = document.getElementById('root');
          return {
            nodes: root ? root.querySelectorAll('*').length : 0,
            text: (root?.innerText ?? '').trim().length,
          };
        })()`);
        const ok =
          info.nodes > 40 && info.text > 20 && harness.errors.length === 0;
        reporter.check(
          `${role.padEnd(11)} ${route}`,
          ok,
          `nodes=${info.nodes}${harness.errors.length ? ` | ${harness.errors.slice(0, 2).join(' ; ')}` : ''}`,
        );
      }
    }

    for (const route of PUBLIC_ROUTES) {
      harness.errors.length = 0;
      await harness.goto(route, 1600);
      const info = await harness.evaluate(`(() => {
        const root = document.getElementById('root');
        return {
          nodes: root ? root.querySelectorAll('*').length : 0,
          text: (root?.innerText ?? '').trim().length,
        };
      })()`);
      const ok = info.nodes > 40 && harness.errors.length === 0;
      reporter.check(
        `public      ${route}`,
        ok,
        `nodes=${info.nodes}${harness.errors.length ? ` | ${harness.errors.slice(0, 2).join(' ; ')}` : ''}`,
      );
    }
  } finally {
    harness.stop();
  }

  const failures = reporter.report();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('route smoke test crashed:', err);
  process.exit(1);
});
