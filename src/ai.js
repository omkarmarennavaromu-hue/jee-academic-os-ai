/* AI Coach — OpenRouter client + progress-context builder.
   The API key lives ONLY in localStorage (entered by the user in the app).
   It is never bundled, never exported, never sent anywhere except openrouter.ai. */
import { CHAPTERS, chapterById, PLAN, TOTAL_DAYS, phaseOf, chaptersOf, SUBJECTS, REVISION_LABELS, prettyDate, dayToDate } from './plan.js';

export const DEFAULT_MODELS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
];

/* ---------- compact progress context (keeps tokens low) ---------- */
export function buildContext({ state, D, currentDay, now, start }) {
  const L = [];
  const s = state.settings;
  const dayN = Math.min(Math.max(currentDay, 1), TOTAL_DAYS);
  const phase = phaseOf(dayN);
  L.push(`STUDENT: ${s.name}. Exam: JEE Main 2027 (January). Targets: ${s.targetMarks || '?'} marks / ${s.targetPercentile || '?'} percentile.`);
  L.push(`TODAY: ${prettyDate(now)}. ${currentDay < 1 ? `Plan starts ${prettyDate(start)} (in ${1 - currentDay} days).` : `Day ${dayN}/${TOTAL_DAYS}, Phase ${phase.n} (${phase.name}). ${TOTAL_DAYS - dayN} days remain.`}`);

  const plan = PLAN[dayN - 1];
  const tline = plan.tasks.map((t) => {
    const st = D.dayTaskStatus(dayN, t.id);
    return `${t.subject === 'General' ? t.kind : t.subject + ': ' + t.title} [${st || 'pending'}]`;
  }).join('; ');
  L.push(`TODAY'S TASKS: ${tline}`);

  const due = D.dueRevisions(now);
  L.push(due.length
    ? `REVISIONS DUE: ${due.slice(0, 8).map((r) => `${chapterById[r.chapterId]?.name} (${REVISION_LABELS[r.type]}${r.due < now ? ', OVERDUE since ' + r.due : ''})`).join('; ')}${due.length > 8 ? ` …and ${due.length - 8} more` : ''}`
    : 'REVISIONS DUE: none');

  const missed = D.missedDays().filter((d) => d !== dayN);
  if (missed.length) L.push(`MISSED/INCOMPLETE DAYS (calendar never shifts): ${missed.slice(-6).map((d) => 'D' + d).join(', ')}${missed.length > 6 ? ` (+${missed.length - 6})` : ''}`);

  L.push(`OVERALL: syllabus progress ${D.overallProgress()}%, chapters completed ${CHAPTERS.filter((c) => D.chState(c.id).completedOn).length}/46.`);

  SUBJECTS.forEach((sub) => {
    const chs = chaptersOf(sub);
    const done = chs.filter((c) => D.chState(c.id).completedOn).length;
    const att = chs.reduce((a, c) => a + (D.chState(c.id).pyqAttempted || 0), 0);
    const cor = chs.reduce((a, c) => a + (D.chState(c.id).pyqCorrect || 0), 0);
    L.push(`${sub.toUpperCase()}: ${done}/${chs.length} chapters done, PYQs ${att} attempted ${att ? Math.round(cor / att * 100) + '% acc' : ''}.`);
  });

  const weak = D.weaknesses();
  if (weak.length) L.push(`WEAKNESSES (computed from Bucket 4, low PYQ accuracy, unresolved errors): ${weak.slice(0, 5).map((w) => `${w.chapter.subject}-${w.chapter.name} (${w.reasons.join(', ')})`).join('; ')}`);

  const mocks = state.mocks.slice(-3);
  if (mocks.length) {
    L.push(`RECENT MOCKS: ${mocks.map((m) => `${m.name} ${m.total}/300 (P${m.phy}/C${m.chem}/M${m.math}; buckets B1:${m.b1} B2:${m.b2} B3:${m.b3} B4:${m.b4}; over4min:${m.over4}; acc ${m.attempted ? Math.round(m.correct / m.attempted * 100) : 0}%)`).join(' | ')}`);
  } else L.push('RECENT MOCKS: none taken yet.');

  const openErr = state.errors.filter((e) => !e.resolved);
  if (openErr.length) {
    const byType = {};
    openErr.forEach((e) => { byType[e.type] = (byType[e.type] || 0) + 1; });
    L.push(`UNRESOLVED ERRORS: ${openErr.length} (${Object.entries(byType).map(([k, v]) => `${k}:${v}`).join(', ')}).`);
  }

  let mins7 = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    mins7 += D.minutesOn(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  L.push(`STUDY TIME last 7 days: ${Math.round(mins7 / 60 * 10) / 10}h (daily target ${Math.round(s.dailyFullMin / 60 * 10) / 10}h).`);
  return L.join('\n');
}

export function systemPrompt(context) {
  return `You are the AI coach built into "JEE Academic OS", a 111-day JEE Main 2027 preparation system (Phase 1 Tier-1 chapters D1-36, Phase 2 Tier-2 D37-70, Phase 3 full revision D71-94, Phase 4 sprint+taper D95-111; spaced recall at +2/+10/+30 days; four-bucket mock analysis).
Rules:
- Base every claim about the student's progress ONLY on the data below. Never invent scores, chapters, or history.
- Be concise, specific and factual. No motivational fluff, no emojis unless asked.
- When asked to teach: you are a JEE Main level tutor for Physics, Chemistry, Mathematics. Use step-by-step reasoning, standard results, and common traps. Prefer exam-relevant shortcuts.
- When advising: prioritise Tier 1 chapters, overdue revisions, Bucket 2 fixes, and the computed weaknesses. Respect the fixed calendar (missed days are recovered, never shifted).
- If data is insufficient to judge something, say so plainly.

STUDENT DATA (live, auto-generated):
${context}`;
}

/* ---------- OpenRouter calls ----------
   Two modes:
   - DIRECT: user pasted their own key (sk-or-…) → browser calls openrouter.ai, key in localStorage only.
   - SERVER: app is hosted on Vercel, key lives in server env vars → browser calls /api/* with no key.
     aiKey = 'server' or 'server:<access-code>' selects this mode. */
const OR_URL = 'https://openrouter.ai/api/v1';
export const isServerMode = (key) => key === 'server' || (key || '').startsWith('server:');
const serverCode = (key) => key.includes(':') ? key.slice(key.indexOf(':') + 1) : '';
const HEADERS = (key) => isServerMode(key)
  ? { 'Content-Type': 'application/json', ...(serverCode(key) ? { 'x-app-code': serverCode(key) } : {}) }
  : {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://jee-academic-os.local',
      'X-Title': 'JEE Academic OS',
    };

export async function* streamChat({ key, model, messages, signal }) {
  const url = isServerMode(key) ? 'api/chat' : `${OR_URL}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: HEADERS(key),
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j.error?.message || msg; } catch {}
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      const data = t.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const j = JSON.parse(data);
        const delta = j.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch { /* partial line */ }
    }
  }
}

export async function fetchFreeModels(key) {
  const res = await fetch(
    isServerMode(key) ? 'api/models' : `${OR_URL}/models`,
    { headers: isServerMode(key) ? HEADERS(key) : (key ? { Authorization: `Bearer ${key}` } : {}) }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return (j.data || [])
    .filter((m) => m.id.endsWith(':free'))
    .map((m) => m.id)
    .sort();
}
