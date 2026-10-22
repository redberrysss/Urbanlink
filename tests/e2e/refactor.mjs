/**
 * Refactor regression suite for the SIME DARBY feedback round.
 *
 * Verifies the consolidated information architecture: one notification feed,
 * a single hazard map in Smart Navigation, a merged route-profile card,
 * privacy-safe personal recycling activity and a broadcast composer for
 * township-wide notices. Also checks key pages for mobile overflow.
 */
import { CLICK_TEXT, Harness, SELECT_BY_LABEL, SET_VALUE, STORE, createReporter } from './harness.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:5174';
const SCROLL = `Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth`;

const rootText = `document.getElementById('root').innerText`;

async function openTab(harness, label) {
  const result = await harness.evaluate(CLICK_TEXT('button', label));
  if (result !== 'ok') throw new Error(`could not click tab "${label}"`);
  await harness.wait(700);
}

async function main() {
  const harness = new Harness({ baseUrl: BASE, port: 9336, name: 'refactor' });
  await harness.start();

  const reporter = createReporter();

  try {
    // Use a desktop viewport so the persistent sidebar (lg breakpoint) is laid out.
    await harness.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: 1280,
      screenHeight: 900,
    });

    // Start from a clean demo dataset so seeded weights and notices are stable.
    await harness.goto('/');
    await harness.evaluate(`localStorage.removeItem('townsync.demo.v1')`);

    await harness.setRole('resident', 'u_resident');

    /* ---------------- Resident Home ---------------- */
    await harness.goto('/app');
    await harness.waitFor(`document.body.innerText.includes('My reports')`);
    let text = await harness.evaluate(rootText);
    reporter.check('home greets the resident by name', /Hello, Nur/i.test(text));
    reporter.check('home offers the four quick actions', /Plan a route/.test(text) && /Report an issue/.test(text) && /Check nearby hazards/.test(text) && /Recycle/.test(text));
    reporter.check('home lists my reports', /My reports/i.test(text));
    reporter.check('home shows important local alerts', /Important local alerts/i.test(text));
    reporter.check('home summarises recycling', /Awaiting verification/i.test(text));

    /* ---------------- Overview (legacy) ---------------- */
    await harness.goto('/app/overview');
    await harness.waitFor(`document.body.innerText.includes('Town updates')`);
    text = await harness.evaluate(rootText);
    reporter.check('overview shows town updates', /Town updates/i.test(text));
    reporter.check('overview has no duplicate recent-activity feed', !/Recent activity/i.test(text));
    reporter.check(
      'overview explains how the figures are calculated',
      /How these figures are calculated/i.test(text),
    );

    /* ---------------- Navigation ---------------- */
    const nav = await harness.evaluate(`(() => {
      const el = document.querySelector('aside nav[aria-label="Main navigation"]');
      return el ? el.innerText : '';
    })()`);
    reporter.check('sidebar shows Notifications', /Notifications/.test(nav));
    reporter.check('sidebar no longer shows Overview', !/^\s*Overview\s*$/m.test(nav));
    reporter.check('sidebar no longer shows My Activities', !/My Activities/i.test(nav));
    reporter.check('sidebar no longer shows Safety Map', !/Safety Map/i.test(nav));
    reporter.check('sidebar shows the five resident destinations', /Home/.test(nav) && /Navigate/.test(nav) && /Reports/.test(nav) && /Safety/.test(nav) && /Recycling/.test(nav));
    reporter.check('resident sidebar hides Profile and Settings', !/\bSettings\b/.test(nav));
    reporter.check(
      'sidebar logo targets the overview',
      (await harness.evaluate(
        `document.querySelector('aside a[aria-label*="go to overview"]')?.getAttribute('href') ?? ''`,
      )) === '/app',
    );

    /* ---------------- Reports ---------------- */
    await harness.goto('/app/reports');
    await harness.waitFor(`document.body.innerText.includes('My reports')`);
    text = await harness.evaluate(rootText);
    reporter.check('reports defaults to my reports', /My reports by default/i.test(text));
    const minePressed = await harness.evaluate(`(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'My reports' && b.className.includes('btn-'));
      return btn?.className.includes('btn-primary') ? 'primary' : 'secondary';
    })()`);
    reporter.check('my reports toggle is the default selection', minePressed === 'primary', minePressed);
    const nearbyClick = await harness.evaluate(CLICK_TEXT('button', 'Nearby reports'));
    await harness.wait(500);
    reporter.check('nearby reports toggle works', nearbyClick === 'ok');
    reporter.check(
      'nearby reports updates the url scope',
      (await harness.evaluate(`location.search`)).includes('scope=all') ||
        !(await harness.evaluate(`location.search`)).includes('scope=mine'),
    );

    /* ---------------- New report form ---------------- */
    await harness.goto('/app/reports/new');
    await harness.waitFor(`!!document.getElementById('report-title')`);
    const suggested = await harness.evaluate(`(() => {
      const el = document.getElementById('report-title');
      return el ? el.placeholder : '';
    })()`);
    reporter.check('report form suggests a title', suggested.length > 0, suggested);
    const yesButtons = await harness.evaluate(`[...document.querySelectorAll('button')].filter((b) => b.innerText.trim() === 'Yes').length`);
    reporter.check('report form asks the two impact questions', yesButtons === 2, `${yesButtons} yes buttons`);
    reporter.check('report form does not ask for affected residents', !/Affected residents/i.test(await harness.evaluate(rootText)));

    // Draft persistence: fill the description and confirm it survives a reload.
    await harness.evaluate(SET_VALUE('#report-description', 'A test draft describing a broken handrail beside the steps.'));
    await harness.wait(700);
    await harness.goto('/app/reports/new');
    await harness.waitFor(`!!document.getElementById('report-description')`);
    const draftValue = await harness.evaluate(`document.getElementById('report-description').value`);
    reporter.check('report draft is restored after reload', draftValue.includes('broken handrail'), draftValue.slice(0, 40));
    await harness.evaluate(`localStorage.removeItem('townsync.report.draft.v1')`);

    /* ---------------- Notifications ---------------- */
    await harness.goto('/app/notifications');
    await harness.waitFor(`document.body.innerText.includes('Town updates')`);
    text = await harness.evaluate(rootText);
    reporter.check('notifications page separates town updates', /Town updates/i.test(text));
    reporter.check(
      'seeded township notice is visible',
      text.includes('Boardwalk resurfacing works until Sunday'),
    );

    const marked = await harness.evaluate(CLICK_TEXT('button', 'Mark all read'));
    reporter.check('mark all read control is available', marked === 'ok');
    await harness.wait(600);
    const state = await harness.evaluate(STORE);
    const notices = state?.notifications ?? [];
    const personal = notices.filter((n) => n.userId === 'u_resident' && n.scope !== 'township');
    const township = notices.filter((n) => n.scope === 'township');
    reporter.check(
      'mark all read clears personal unread',
      personal.length > 0 && personal.every((n) => n.read),
      `${personal.filter((n) => !n.read).length} unread left`,
    );
    reporter.check(
      'mark all read leaves township notices untouched',
      township.length > 0 && township.some((n) => !n.read),
    );
    const bellLabel = await harness.evaluate(
      `document.querySelector('header button[aria-label^="Notifications"]')?.getAttribute('aria-label') ?? ''`,
    );
    reporter.check('township notices do not inflate the unread badge', bellLabel === 'Notifications', bellLabel);

    /* ---------------- Recycling hub ---------------- */
    await harness.goto('/app/recycling');
    await harness.waitFor(`document.body.innerText.includes('Community impact')`);
    const stationTab = await harness.evaluate(`(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').trim() === 'Stations');
      return btn?.getAttribute('aria-pressed') ?? '';
    })()`);
    reporter.check('recycling opens on the stations tab', stationTab === 'true');
    text = await harness.evaluate(rootText);
    reporter.check('community impact counts verified waste', /Waste diverted from disposal/.test(text));
    reporter.check('community impact explains its period and exclusions', /What these figures count/.test(text));
    reporter.check('community impact keeps residents private', /Individual resident figures stay private/i.test(text));
    reporter.check('station map is present', (await harness.evaluate(`!!document.querySelector('.leaflet-container')`)) === true);
    reporter.check('collected-by-material breakdown is gone', !/Collected by material/i.test(text));
    reporter.check('top recyclers leaderboard is gone from the resident hub', !/Top recyclers/i.test(text));

    await openTab(harness, 'My submissions & rewards');
    text = await harness.evaluate(rootText);
    reporter.check('activity tab shows my submissions', /My submissions/i.test(text));
    reporter.check('activity tab shows the resident own verified weights', text.includes('4.5 kg') && text.includes('6.2 kg'));
    reporter.check(
      'activity tab hides other residents weights',
      !text.includes('12.1 kg') && !text.includes('9.4 kg') && !text.includes('7.8 kg'),
    );
    await openTab(harness, 'Rewards');
    text = await harness.evaluate(rootText);
    reporter.check('rewards tab explains how points work', /How points work/i.test(text));
    reporter.check('rewards tab shows the transaction history', /Transaction history/i.test(text));
    await openTab(harness, 'Achievements');
    text = await harness.evaluate(rootText);
    reporter.check('activity tab keeps achievements', /Achievements/i.test(text));

    await harness.goto('/app/activities');
    await harness.waitFor(`document.body.innerText.includes('My submissions')`);
    const redirected = await harness.evaluate(`location.pathname + location.search`);
    reporter.check(
      'legacy activities route redirects into the hub',
      redirected === '/app/recycling?tab=activity',
      redirected,
    );

    // A different resident sees a different, equally private slice.
    await harness.setRole('resident', 'u_r3');
    await harness.goto('/app/recycling?tab=activity');
    await harness.waitFor(`document.body.innerText.includes('My submissions')`);
    text = await harness.evaluate(rootText);
    reporter.check('second resident sees own weights', text.includes('12.1 kg') && text.includes('2.2 kg'));
    reporter.check(
      'second resident cannot see the first resident weights',
      !text.includes('4.5 kg') && !text.includes('6.2 kg'),
    );

    /* ---------------- Safety + navigation ---------------- */
    await harness.setRole('resident', 'u_resident');
    await harness.goto('/app/safety');
    text = await harness.evaluate(rootText);
    reporter.check('safety page no longer embeds a map', (await harness.evaluate(`!!document.querySelector('.leaflet-container')`)) === false);
    reporter.check('safety page points at Smart Navigation', /hazard map now lives in Smart Navigation/i.test(text));

    await harness.goto('/app/navigation?hazards=1');
    await harness.waitFor(`document.body.innerText.includes('Route profile')`);
    text = await harness.evaluate(rootText);
    reporter.check('navigation merges route profile and segment details', /Route profile & segment details/i.test(text));
    reporter.check('navigation shows the safety hazards layer', /Safety hazards/i.test(text));
    reporter.check('navigation map is present', (await harness.evaluate(`!!document.querySelector('.leaflet-container')`)) === true);

    /* ---------------- Logo behaviour ---------------- */
    await harness.goto('/app/recycling');
    const clickedLogo = await harness.evaluate(`(() => {
      const link = [...document.querySelectorAll('aside a[aria-label*="go to overview"]')]
        .find((a) => a.getBoundingClientRect().width > 0);
      if (!link) return 'missing';
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return 'ok';
    })()`);
    await harness.wait(600);
    reporter.check('sidebar logo navigates to the overview', clickedLogo === 'ok' && (await harness.evaluate(`location.pathname`)) === '/app');

    /* ---------------- Responsive ---------------- */
    await harness.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      screenWidth: 390,
      screenHeight: 844,
    });
    const mobileRoutes = ['/app', '/app/overview', '/app/navigation', '/app/reports', '/app/reports/new', '/app/safety', '/app/recycling', '/app/notifications', '/app/profile'];
    for (const route of mobileRoutes) {
      await harness.goto(route, 1400);
      const overflow = await harness.evaluate(SCROLL);
      reporter.check(`no horizontal overflow at 390px on ${route}`, overflow <= 1, `overflow=${overflow}px`);
    }

    // The resident bottom navigation exposes all five destinations on mobile.
    await harness.goto('/app', 1400);
    const bottomNav = await harness.evaluate(`(() => {
      const nav = document.querySelector('nav[aria-label="Primary"]');
      if (!nav || nav.getBoundingClientRect().width === 0) return '';
      return [...nav.querySelectorAll('a')].map((a) => a.innerText.trim()).join('|');
    })()`);
    reporter.check(
      'resident bottom nav shows the five destinations',
      ['home', 'navigate', 'reports', 'safety', 'recycling'].every((l) => bottomNav.toLowerCase().includes(l)),
      bottomNav,
    );
    const bottomNavHref = await harness.evaluate(`(() => {
      const link = [...document.querySelectorAll('nav[aria-label="Primary"] a')].find((a) => a.innerText.trim() === 'Reports');
      return link?.getAttribute('href') ?? '';
    })()`);
    reporter.check('bottom nav links to the reports hub', bottomNavHref === '/app/reports', bottomNavHref);

    // Staff roles must not see the resident bottom navigation.
    await harness.setRole('admin', 'u_admin');
    await harness.goto('/app/admin', 1400);
    const adminBottomNav = await harness.evaluate(`!!document.querySelector('nav[aria-label="Primary"]')`);
    reporter.check('admins do not get the resident bottom nav', adminBottomNav === false);
    await harness.setRole('resident', 'u_resident');
    await harness.goto('/app', 1400);

    await harness.goto('/app/recycling', 1400);
    const mobileLogo = await harness.evaluate(`(() => {
      const link = [...document.querySelectorAll('header a[aria-label*="go to overview"]')]
        .find((a) => a.getBoundingClientRect().width > 0);
      if (!link) return 'missing';
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return 'ok';
    })()`);
    await harness.wait(600);
    reporter.check('mobile topbar logo navigates to the overview', mobileLogo === 'ok' && (await harness.evaluate(`location.pathname`)) === '/app');
    await harness.send('Emulation.clearDeviceMetricsOverride');

    /* ---------------- Admin surfaces + broadcast ---------------- */
    await harness.setRole('admin', 'u_admin');
    await harness.goto('/app/admin/recycling');
    text = await harness.evaluate(rootText);
    reporter.check('admin recycling keeps the material mix', /Material mix/i.test(text));
    reporter.check('admin recycling keeps the leaderboard', /Leading recyclers/i.test(text));

    await harness.goto('/app/admin/safety');
    reporter.check('admin safety keeps the monitoring map', (await harness.evaluate(`!!document.querySelector('.leaflet-container')`)) === true);

    await harness.goto('/app/notifications');
    await harness.waitFor(`document.body.innerText.includes('Broadcast town update')`);
    const opened = await harness.evaluate(CLICK_TEXT('button', 'Broadcast town update'));
    reporter.check('admin can open the broadcast composer', opened === 'ok');
    await harness.waitFor(`!!document.getElementById('update-title')`);
    reporter.check('composer title field set', (await harness.evaluate(SET_VALUE('#update-title', 'E2E bridge inspection'))) === 'ok');
    reporter.check(
      'composer message field set',
      (await harness.evaluate(SET_VALUE('#update-body', 'The pedestrian bridge will be inspected on Friday morning. Use the Perdana Heights path while crews are on site.'))) === 'ok',
    );
    reporter.check('composer type select set', (await harness.evaluate(SELECT_BY_LABEL('Update type', 'warning'))) === 'ok');
    reporter.check('composer link select set', (await harness.evaluate(SELECT_BY_LABEL('Link (optional)', '/app/safety'))) === 'ok');
    const published = await harness.evaluate(CLICK_TEXT('button', 'Publish update'));
    reporter.check('admin can publish the town notice', published === 'ok');
    await harness.waitFor(`!document.getElementById('update-title')`);

    const afterPublish = await harness.evaluate(STORE);
    const broadcast = (afterPublish?.notifications ?? []).filter((n) => n.title === 'E2E bridge inspection');
    reporter.check('broadcast stored exactly once', broadcast.length === 1, `${broadcast.length} stored`);
    reporter.check(
      'broadcast is a township-scoped notice',
      broadcast[0]?.userId === 'township' && broadcast[0]?.scope === 'township' && broadcast[0]?.type === 'warning' && broadcast[0]?.link === '/app/safety',
      JSON.stringify(broadcast[0] ?? null),
    );

    /* ---------------- Broadcast reaches residents ---------------- */
    await harness.setRole('resident', 'u_resident');
    await harness.goto('/app/notifications');
    await harness.waitFor(`document.body.innerText.includes('E2E bridge inspection')`);
    reporter.check('resident sees the broadcast in notifications', (await harness.evaluate(rootText)).includes('E2E bridge inspection'));

    await harness.goto('/app');
    await harness.waitFor(`document.body.innerText.includes('Neighbourhood updates')`);
    reporter.check('resident sees the broadcast on the home page', (await harness.evaluate(rootText)).includes('E2E bridge inspection'));

    await harness.goto('/app/admin');
    text = await harness.evaluate(rootText);
    reporter.check('residents cannot open the admin workspace', /Restricted workspace/i.test(text));

    reporter.check('no uncaught exceptions during the run', harness.errors.length === 0, harness.errors.slice(0, 3).join(' | '));
  } catch (error) {
    console.error(error);
    reporter.check('suite completed without throwing', false, String(error));
  } finally {
    const failures = reporter.report();
    harness.stop();
    process.exit(failures === 0 ? 0 : 1);
  }
}

main();
