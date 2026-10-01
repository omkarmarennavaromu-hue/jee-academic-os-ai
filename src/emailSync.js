/* Daily-email sync — pushes a compact snapshot of revision/progress data
   to the user's own Google Apps Script endpoint. No credentials involved:
   the endpoint only accepts a data snapshot or a test-email request, and
   all mail is sent server-side from the user's own Google account. */
import { PLAN } from './plan.js';

export function buildSnapshot(state) {
  const days = {};
  for (const [n, ds] of Object.entries(state.dayState || {})) {
    const plan = PLAN[Number(n) - 1];
    if (!plan) continue;
    const resolved = plan.tasks.filter((t) => {
      const st = (ds.tasks || {})[t.id];
      return st === 'done' || st === 'skipped' || st === 'moved';
    }).length;
    days[n] = { resolved, total: plan.tasks.length };
  }
  return {
    email: state.settings.emailAddress,
    enabled: !!state.settings.emailEnabled,
    revisions: (state.revisions || []).map((r) => ({ c: r.chapterId, t: r.type, due: r.due, done: !!r.done })),
    days,
  };
}

async function post(endpoint, body) {
  // text/plain keeps it a "simple request" (no CORS preflight — required for Apps Script)
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function pushSync(endpoint, state) {
  return post(endpoint, { action: 'sync', ...buildSnapshot(state) });
}

export function sendTestEmail(endpoint, state) {
  return post(endpoint, { action: 'test', ...buildSnapshot(state) });
}

export async function fetchStatus(endpoint) {
  const res = await fetch(endpoint);
  return res.json();
}
