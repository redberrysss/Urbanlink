/**
 * Shared helpers for the TownSync end-to-end tests.
 *
 * The tests drive a real Chrome instance over the DevTools Protocol so the
 * application is exercised exactly as a user would exercise it.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

export function findChrome() {
  return CHROME_CANDIDATES.find((candidate) => existsSync(candidate)) ?? null;
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class Harness {
  constructor({ baseUrl, port, name }) {
    this.baseUrl = baseUrl;
    this.port = port;
    this.name = name;
    this.profile = mkdtempSync(join(tmpdir(), `townsync-${name}-`));
    this.chrome = null;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
    this.errors = [];
  }

  async start() {
    const binary = findChrome();
    if (!binary) {
      throw new Error(
        'No Chrome/Chromium binary found. Set CHROME_PATH to run the end-to-end tests.',
      );
    }
    this.chrome = spawn(
      binary,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--remote-debugging-port=${this.port}`,
        `--user-data-dir=${this.profile}`,
        'about:blank',
      ],
      { stdio: 'ignore' },
    );

    const wsUrl = await this.waitForTarget();
    this.ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        this.errors.push(
          msg.params.exceptionDetails.exception?.description ??
            msg.params.exceptionDetails.text,
        );
      } else if (
        msg.method === 'Runtime.consoleAPICalled' &&
        msg.params.type === 'error'
      ) {
        this.errors.push(
          `console.error: ${(msg.params.args ?? [])
            .map((a) => a.value ?? a.description ?? a.type)
            .join(' ')}`,
        );
      }
    });

    await this.send('Runtime.enable');
    await this.send('Page.enable');
    return this;
  }

  async waitForTarget() {
    for (let i = 0; i < 80; i += 1) {
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const list = await res.json();
        const page = list.find((t) => t.type === 'page');
        if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      } catch {
        /* retry */
      }
      await sleep(250);
    }
    throw new Error('Chrome DevTools endpoint never became available');
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`timeout: ${method}`));
        }
      }, 30000);
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(
        res.exceptionDetails.exception?.description ?? res.exceptionDetails.text,
      );
    }
    return res.result?.value;
  }

  async goto(path, settle = 1800) {
    await this.send('Page.navigate', { url: `${this.baseUrl}${path}` });
    await sleep(settle);
  }

  /** Waits inside the page so pending React updates are flushed. */
  async wait(ms = 800) {
    await this.evaluate(`new Promise((resolve) => setTimeout(resolve, ${ms}))`);
  }

  /** Polls an in-page expression until it returns a truthy value. */
  async waitFor(expression, { timeout = 15000, interval = 250 } = {}) {
    const deadline = Date.now() + timeout;
    for (;;) {
      const value = await this.evaluate(expression);
      if (value) return value;
      if (Date.now() > deadline) {
        throw new Error(`waitFor timed out: ${expression}`);
      }
      await sleep(interval);
    }
  }

  async setRole(role, userId) {
    await this.evaluate(
      `localStorage.setItem('townsync.session', JSON.stringify({ role: '${role}', userId: '${userId}' }))`,
    );
  }

  bodyText() {
    return this.evaluate(`document.getElementById('root').innerText`);
  }

  stop() {
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.chrome?.kill();
  }
}

/* ------------------------------------------------------------------ *
 * Script fragments evaluated inside the page
 * ------------------------------------------------------------------ */

/** Sets the value of a React-controlled input and fires the events it listens for. */
export const SET_VALUE = (selector, value) => `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return 'missing';
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return 'ok';
})()`;

/**
 * Clicks the first element whose text matches exactly, falling back to a
 * substring match. A real MouseEvent is dispatched so React's delegated
 * listeners receive it exactly as they would from a user.
 */
export const CLICK_TEXT = (tag, text) => `(() => {
  const nodes = [...document.querySelectorAll(${JSON.stringify(tag)})];
  const target = ${JSON.stringify(text.toLowerCase())};
  const el =
    nodes.find((n) => (n.innerText || '').trim().toLowerCase() === target) ??
    nodes.find((n) => (n.innerText || '').trim().toLowerCase().includes(target));
  if (!el) return 'missing';
  const r = el.getBoundingClientRect();
  el.dispatchEvent(new MouseEvent('click', {
    bubbles: true, cancelable: true, view: window,
    clientX: r.left + r.width / 2, clientY: r.top + r.height / 2,
  }));
  return 'ok';
})()`;

/** Sets a native <select> value located by its associated label text. */
export const SELECT_BY_LABEL = (labelText, value) => `(() => {
  const labels = [...document.querySelectorAll('label')];
  const lab = labels.find((l) => (l.innerText || '').trim().toLowerCase() === ${JSON.stringify(labelText.toLowerCase())});
  if (!lab) return 'missing-label';
  const el = document.getElementById(lab.htmlFor);
  if (!el) return 'missing-select';
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return 'ok';
})()`;

/** Dispatches a click on the centre of the map to place a report pin. */
export const CLICK_MAP = `(() => {
  const el = document.querySelector('.leaflet-container');
  if (!el) return 'missing';
  const r = el.getBoundingClientRect();
  el.dispatchEvent(new MouseEvent('click', {
    bubbles: true, cancelable: true, view: window,
    clientX: r.left + r.width / 2, clientY: r.top + r.height / 2,
  }));
  return 'ok';
})()`;

/** Reads the persisted demo dataset. */
export const STORE = `(() => {
  const raw = localStorage.getItem('townsync.demo.v1');
  return raw ? JSON.parse(raw) : null;
})()`;

export function createReporter() {
  const results = [];
  let failures = 0;
  return {
    results,
    check(name, ok, detail = '') {
      if (!ok) failures += 1;
      results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
    },
    get failures() {
      return failures;
    },
    report() {
      console.log(results.join('\n'));
      console.log(
        failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`,
      );
      return failures;
    },
  };
}
