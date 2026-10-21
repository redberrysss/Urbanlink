/**
 * Cross-module workflow test for TownSync.
 *
 * resident submits a report -> admin triages it into a maintenance task ->
 * maintenance completes the task -> admin resolves the report so the linked
 * obstacle clears and the resident is notified -> operator verifies a
 * recycling submission so the resident earns points.
 */
import {
  CLICK_TEXT,
  CLICK_MAP,
  Harness,
  SELECT_BY_LABEL,
  SET_VALUE,
  STORE,
  createReporter,
} from './harness.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:5174';

async function main() {
  const harness = new Harness({ baseUrl: BASE, port: 9335, name: 'workflow' });
  await harness.start();

  const reporter = createReporter();
  const reportTitle = `E2E broken slab ${Date.now()}`;

  try {
    /* ------------------------------------------- 1. resident submits a report */
    await harness.goto('/');
    await harness.setRole('resident', 'u_resident');
    await harness.goto('/app/reports/new');

    await harness.evaluate(SET_VALUE('#report-title', reportTitle));
    await harness.evaluate(
      SET_VALUE(
        '#report-description',
        'Automated end-to-end test description for a damaged paving slab outside the block.',
      ),
    );
    await harness.evaluate(
      SET_VALUE('#report-address', 'Jalan Melati 3, near the playground'),
    );
    await harness.evaluate(CLICK_MAP);
    await harness.wait(800);
    // Mark it as affecting accessibility so an obstacle is created with it.
    await harness.evaluate(CLICK_TEXT('button', 'blocks accessibility'));
    await harness.evaluate(
      `document.querySelector('button[type="submit"]').click()`,
    );
    // The report is persisted by a mutation, so wait for the detail route
    // instead of reloading the page mid-request.
    await harness.waitFor(`location.pathname.startsWith('/app/reports/r_')`);

    const detail = await harness.bodyText();
    reporter.check('report detail renders after submit', detail.includes(reportTitle));

    const reportId = await harness.evaluate(`(() => {
      const s = ${STORE};
      const r = (s?.reports ?? []).find((x) => x.title === ${JSON.stringify(reportTitle)});
      return r?.id ?? null;
    })()`);
    reporter.check('report persisted with an id', Boolean(reportId), `id=${reportId}`);

    const obstacleId = await harness.evaluate(`(() => {
      const s = ${STORE};
      const r = (s?.reports ?? []).find((x) => x.title === ${JSON.stringify(reportTitle)});
      return r?.obstacleId ?? null;
    })()`);
    reporter.check(
      'accessibility obstacle linked to the report',
      Boolean(obstacleId),
      `obstacleId=${obstacleId}`,
    );

    /* ------------------------------------------------- 2. admin triages it */
    await harness.setRole('admin', 'u_admin');
    await harness.goto('/app/admin/issues');
    await harness.evaluate(
      SET_VALUE('input[aria-label="Search reports"]', reportTitle),
    );
    await harness.wait(900);
    const triageClick = await harness.evaluate(CLICK_TEXT('button', 'triage'));
    await harness.wait(900);
    const dialogs = await harness.evaluate(
      `document.querySelectorAll('[role="dialog"]').length`,
    );
    reporter.check(
      'triage modal opened',
      triageClick === 'ok' && dialogs === 1,
      `click=${triageClick} dialogs=${dialogs}`,
    );

    const statusPick = await harness.evaluate(
      SELECT_BY_LABEL('Status', 'assigned'),
    );
    const teamPick = await harness.evaluate(
      SELECT_BY_LABEL('Assign to team', 'team_a'),
    );
    const applyClick = await harness.evaluate(CLICK_TEXT('button', 'apply'));
    await harness.wait(2500);
    reporter.check(
      'triage controls set',
      statusPick === 'ok' && teamPick === 'ok' && applyClick === 'ok',
      `status=${statusPick} team=${teamPick} apply=${applyClick}`,
    );

    const afterTriage = await harness.evaluate(`(() => {
      const s = ${STORE};
      const r = (s?.reports ?? []).find((x) => x.title === ${JSON.stringify(reportTitle)});
      return { status: r?.status, teamId: r?.assignedTeamId ?? null };
    })()`);
    reporter.check(
      'report status advanced to assigned',
      afterTriage?.status === 'assigned',
      `status=${afterTriage?.status}`,
    );
    reporter.check(
      'report assigned to a team',
      Boolean(afterTriage?.teamId),
      `team=${afterTriage?.teamId}`,
    );

    /* -------------------------------- 3. maintenance completes the task */
    await harness.setRole('maintenance', 'u_maintenance');
    await harness.goto('/app/tasks');
    const tasksBody = await harness.bodyText();
    reporter.check('maintenance queue renders', tasksBody.length > 200);

    const openTask = await harness.evaluate(`(() => {
      const s = ${STORE};
      const t = (s?.tasks ?? []).find((x) => x.reportId === ${JSON.stringify(reportId)});
      return t?.id ?? null;
    })()`);
    reporter.check(
      'maintenance task created for the report',
      Boolean(openTask),
      `taskId=${openTask}`,
    );

    const updateClick = await harness.evaluate(`(() => {
      const link = document.querySelector('a[href="/app/reports/${reportId}"]');
      if (!link) return 'missing-link';
      let card = link;
      while (card && !card.querySelector('button')) card = card.parentElement;
      const btn = [...card.querySelectorAll('button')].find((b) => (b.innerText || '').toLowerCase().includes('add update'));
      if (!btn) return 'missing-button';
      const r = btn.getBoundingClientRect();
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window,
        clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
      return 'ok';
    })()`);
    await harness.wait(900);
    reporter.check('task update modal opened', updateClick === 'ok', `click=${updateClick}`);

    await harness.evaluate(CLICK_TEXT('button', 'work completed'));
    await harness.evaluate(
      SET_VALUE('#task-note', 'Paving slab replaced and inspected by the crew.'),
    );
    const saveClick = await harness.evaluate(CLICK_TEXT('button', 'save evidence'));
    await harness.wait(2500);

    const taskStatus = await harness.evaluate(`(() => {
      const s = ${STORE};
      const t = (s?.tasks ?? []).find((x) => x.id === ${JSON.stringify(openTask)});
      return t?.status ?? null;
    })()`);
    reporter.check(
      'task moved to awaiting verification',
      taskStatus === 'awaiting_verification',
      `status=${taskStatus} (save=${saveClick})`,
    );

    /* -------------------------- 4. admin verifies the repair and resolves it */
    await harness.setRole('admin', 'u_admin');
    await harness.goto('/app/admin/issues');
    await harness.evaluate(
      SET_VALUE('input[aria-label="Search reports"]', reportTitle),
    );
    await harness.wait(900);
    await harness.evaluate(CLICK_TEXT('button', 'triage'));
    await harness.wait(900);
    await harness.evaluate(SELECT_BY_LABEL('Status', 'resolved'));
    await harness.evaluate(CLICK_TEXT('button', 'apply'));
    await harness.wait(2500);

    const afterResolve = await harness.evaluate(`(() => {
      const s = ${STORE};
      const r = (s?.reports ?? []).find((x) => x.title === ${JSON.stringify(reportTitle)});
      const o = (s?.obstacles ?? []).find((x) => x.id === ${JSON.stringify(obstacleId)});
      const t = (s?.tasks ?? []).find((x) => x.reportId === ${JSON.stringify(reportId)});
      const n = (s?.notifications ?? []).filter((x) => x.reportId === ${JSON.stringify(reportId)});
      return {
        status: r?.status ?? null,
        obstacleStatus: o?.status ?? null,
        taskStatus: t?.status ?? null,
        notifications: n.length,
      };
    })()`);
    reporter.check(
      'report resolved',
      afterResolve?.status === 'resolved',
      `status=${afterResolve?.status}`,
    );
    reporter.check(
      'linked accessibility obstacle cleared',
      afterResolve?.obstacleStatus === 'resolved',
      `obstacle=${afterResolve?.obstacleStatus}`,
    );
    reporter.check(
      'maintenance task closed',
      afterResolve?.taskStatus === 'completed',
      `task=${afterResolve?.taskStatus}`,
    );
    reporter.check(
      'resident notified through the timeline',
      afterResolve?.notifications >= 2,
      `notifications=${afterResolve?.notifications}`,
    );

    /* ------------------------------------ 5. operator verifies recycling */
    await harness.setRole('operator', 'u_operator');
    await harness.goto('/app/verification');
    const pointsBefore = await harness.evaluate(`(() => {
      const s = ${STORE};
      return (s?.users ?? []).find((x) => x.id === 'u_resident')?.points ?? 0;
    })()`);
    const pendingBefore = await harness.evaluate(`(() => {
      const s = ${STORE};
      return (s?.activities ?? []).filter((a) => a.status === 'pending').length;
    })()`);

    const reviewClick = await harness.evaluate(CLICK_TEXT('button', 'review'));
    await harness.wait(900);
    const verifyClick = await harness.evaluate(
      CLICK_TEXT('button', 'verify & award points'),
    );
    await harness.wait(2500);

    const pointsAfter = await harness.evaluate(`(() => {
      const s = ${STORE};
      return (s?.users ?? []).find((x) => x.id === 'u_resident')?.points ?? 0;
    })()`);
    const pendingAfter = await harness.evaluate(`(() => {
      const s = ${STORE};
      return (s?.activities ?? []).filter((a) => a.status === 'pending').length;
    })()`);
    const ledger = await harness.evaluate(`(() => {
      const s = ${STORE};
      return (s?.transactions ?? []).length;
    })()`);

    reporter.check(
      'verification action executed',
      verifyClick === 'ok',
      `review=${reviewClick} verify=${verifyClick}`,
    );
    reporter.check(
      'pending queue shrank',
      pendingAfter < pendingBefore,
      `pending ${pendingBefore} -> ${pendingAfter}`,
    );
    reporter.check(
      'points were awarded to the resident',
      pointsAfter > pointsBefore,
      `points ${pointsBefore} -> ${pointsAfter}`,
    );
    reporter.check('reward ledger grew', ledger > 0, `transactions=${ledger}`);

    reporter.check(
      'no uncaught exceptions during the run',
      harness.errors.length === 0,
      harness.errors.slice(0, 2).join(' | '),
    );
  } finally {
    harness.stop();
  }

  const failures = reporter.report();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('workflow test crashed:', err);
  process.exit(1);
});
