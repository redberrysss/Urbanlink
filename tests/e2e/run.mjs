/**
 * Runs the TownSync end-to-end suites.
 *
 * A production preview server is started from `dist/` (run `npm run build`
 * first), both suites are executed against it and the server is shut down
 * again. Set BASE_URL to run against an already running dev server.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const PORT = Number(process.env.E2E_PORT ?? 4319);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, attempts = 80) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await sleep(250);
  }
  return false;
}

function run(script, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(here, script)], {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: 'inherit',
    });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

async function main() {
  let server = null;
  let baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    if (!existsSync(join(root, 'dist', 'index.html'))) {
      console.error('dist/ is missing — run `npm run build` first.');
      process.exit(1);
    }
    baseUrl = `http://localhost:${PORT}`;
    server = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['vite', 'preview', '--port', String(PORT), '--strictPort'],
      { cwd: root, stdio: 'ignore' },
    );
    if (!(await waitForServer(baseUrl))) {
      server.kill();
      console.error(`preview server never started on ${baseUrl}`);
      process.exit(1);
    }
  }

  console.log(`Running end-to-end suites against ${baseUrl}\n`);

  const routesCode = await run('routes.mjs', { BASE_URL: baseUrl });
  console.log('');
  const workflowCode = await run('workflow.mjs', { BASE_URL: baseUrl });
  console.log('');
  const refactorCode = await run('refactor.mjs', { BASE_URL: baseUrl });

  server?.kill();
  const failed = routesCode !== 0 || workflowCode !== 0 || refactorCode !== 0;
  console.log(
    failed
      ? '\nEnd-to-end suite failed.'
      : '\nEnd-to-end suite passed.',
  );
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('end-to-end runner crashed:', err);
  process.exit(1);
});
