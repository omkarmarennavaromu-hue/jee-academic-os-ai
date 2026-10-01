import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  DEFAULT_START, TOTAL_DAYS, PLAN, CHAPTERS, chapterById, phaseOf,
  addDays, todayStr, dayToDate, dateToDay, CHAPTER_P3_DAY,
} from './plan.js';

const KEY = 'jeeos-v1';

const initialState = {
  settings: {
    onboarded: false,
    name: 'Omkar',
    targetMarks: '',
    targetPercentile: '',
    dailySchoolMin: 285,   // 4h 45m — source school-day template
    dailyFullMin: 540,     // 9h — source full-day template
    theme: 'dark',
    accent: '#4f7cff',
    startDate: DEFAULT_START,
    examDate: '2027-01-24',
    emailEnabled: false,
    emailAddress: 'omkarmarennavaromu@gmail.com',
    emailEndpoint: '',
    emailStatus: null, // last status payload from the endpoint
    aiKey: '',        // OpenRouter key — localStorage only, stripped from exports
    aiModel: 'deepseek/deepseek-chat-v3-0324:free',
  },
  dayState: {},     // { [dayNumber]: { tasks: {taskId:'done'|'skipped'}, missed:true } }
  chapters: {},     // { [cid]: { theoryDone, notesDone, pyqAttempted, pyqCorrect, pyqTimeMin, notes, completedOn, statusOverride } }
  revisions: [],    // { id, chapterId, type:'d2'|'d10'|'d30'|'p3', due, done, doneOn }
  errors: [],       // { id, question, subject, chapterId, date, type, bucket, solution, lesson, reattempt, resolved }
  mocks: [],        // { id, num, name, date, total, phy, chem, math, attempted, correct, incorrect, b1..b4, over4, timeIssues, problemChapters:[] }
  sessions: [],     // { id, date, subject, type, minutes, note }
  resources: [],    // { id, name, subject, chapterId, type, link, notes }
  extras: {},       // { [dateStr]: [ { id, subject, title, kind, est, fromDay } ] }
  weekReviews: {},  // { [weekNo]: { weakest, leak, priority } }
  timer: null,      // { startTs, durationMin, paused, pausedRemaining }
  aiChat: [],       // coach conversation (capped)
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return { ...initialState, ...parsed, settings: { ...initialState.settings, ...parsed.settings } };
  } catch { return initialState; }
}

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

let idc = Date.now() % 100000;
export const uid = () => `${Date.now().toString(36)}${(idc++).toString(36)}`;

export function StoreProvider({ children }) {
  const [state, setState] = useState(load);
  const [route, setRoute] = useState({ page: 'dashboard' });
  const [now, setNow] = useState(todayStr());

  // persist
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }, [state]);
  // theme + accent
  useEffect(() => {
    document.documentElement.dataset.theme = state.settings.theme;
    document.documentElement.style.setProperty('--accent', state.settings.accent);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(state.settings.accent.slice(i, i + 2), 16));
    document.documentElement.style.setProperty('--accent-soft', `rgba(${r},${g},${b},0.14)`);
  }, [state.settings.theme, state.settings.accent]);
  // midnight refresh
  useEffect(() => { const t = setInterval(() => setNow(todayStr()), 60000); return () => clearInterval(t); }, []);

  // daily-email sync: push a snapshot to the user's Apps Script endpoint when
  // revision/progress data changes (debounced). Failures are silent — the OS never depends on it.
  const syncSig = JSON.stringify([
    state.settings.emailEnabled, state.settings.emailEndpoint, state.settings.emailAddress,
    state.revisions, Object.keys(state.dayState).map((k) => [k, Object.keys(state.dayState[k]?.tasks || {}).length]),
  ]);
  useEffect(() => {
    const { emailEnabled, emailEndpoint } = state.settings;
    if (!emailEnabled || !emailEndpoint) return;
    const t = setTimeout(() => {
      import('./emailSync.js')
        .then((m) => m.pushSync(emailEndpoint, state))
        .then((status) => setState((s) => ({ ...s, settings: { ...s.settings, emailStatus: status } })))
        .catch(() => {});
    }, 4000);
    return () => clearTimeout(t);
  }, [syncSig]); // eslint-disable-line

  const up = useCallback((fn) => setState((s) => fn(s)), []);

  /* ---------- derived: current day ---------- */
  const start = state.settings.startDate;
  const currentDay = Math.min(dateToDay(start, now), TOTAL_DAYS + 1); // <1 = before start
  const daysRemaining = Math.max(0, dateToDay(start, dayToDate(start, TOTAL_DAYS)) - dateToDay(start, now));

  /* ---------- actions ---------- */
  const A = useMemo(() => ({
    saveSettings: (patch) => up((s) => ({ ...s, settings: { ...s.settings, ...patch } })),

    setTask: (day, taskId, status) => up((s) => {
      const ds = s.dayState[day] || { tasks: {} };
      const tasks = { ...ds.tasks };
      if (status) tasks[taskId] = status; else delete tasks[taskId];
      return { ...s, dayState: { ...s.dayState, [day]: { ...ds, tasks } } };
    }),

    markDayMissed: (day, missed = true) => up((s) => {
      const ds = s.dayState[day] || { tasks: {} };
      return { ...s, dayState: { ...s.dayState, [day]: { ...ds, missed } } };
    }),

    patchChapter: (cid, patch) => up((s) => ({
      ...s, chapters: { ...s.chapters, [cid]: { ...(s.chapters[cid] || {}), ...patch } },
    })),

    completeChapter: (cid, dateStr) => up((s) => {
      const cs = s.chapters[cid] || {};
      if (cs.completedOn) return s; // already done → revisions exist
      const d = dateStr || todayStr();
      const p3Day = CHAPTER_P3_DAY[cid];
      const p3Due = dayToDate(s.settings.startDate, p3Day);
      const mk = (type, due) => ({ id: uid(), chapterId: cid, type, due, done: false, doneOn: null });
      const revs = [mk('d2', addDays(d, 2)), mk('d10', addDays(d, 10)), mk('d30', addDays(d, 30)), mk('p3', p3Due)];
      return {
        ...s,
        chapters: { ...s.chapters, [cid]: { ...cs, completedOn: d } },
        revisions: [...s.revisions, ...revs],
      };
    }),

    uncompleteChapter: (cid) => up((s) => ({
      ...s,
      chapters: { ...s.chapters, [cid]: { ...(s.chapters[cid] || {}), completedOn: null } },
      revisions: s.revisions.filter((r) => r.chapterId !== cid || r.done),
    })),

    setRevisionDone: (rid, done) => up((s) => ({
      ...s,
      revisions: s.revisions.map((r) => r.id === rid ? { ...r, done, doneOn: done ? todayStr() : null } : r),
    })),

    logPyq: (cid, attempted, correct, timeMin) => up((s) => {
      const cs = s.chapters[cid] || {};
      return {
        ...s, chapters: {
          ...s.chapters, [cid]: {
            ...cs,
            pyqAttempted: (cs.pyqAttempted || 0) + attempted,
            pyqCorrect: (cs.pyqCorrect || 0) + correct,
            pyqTimeMin: (cs.pyqTimeMin || 0) + (timeMin || 0),
          },
        },
      };
    }),

    addError: (e) => up((s) => ({ ...s, errors: [{ id: uid(), date: todayStr(), resolved: false, ...e }, ...s.errors] })),
    patchError: (id, patch) => up((s) => ({ ...s, errors: s.errors.map((e) => e.id === id ? { ...e, ...patch } : e) })),
    deleteError: (id) => up((s) => ({ ...s, errors: s.errors.filter((e) => e.id !== id) })),

    addMock: (m) => up((s) => ({ ...s, mocks: [...s.mocks, { id: uid(), ...m }].sort((a, b) => a.date < b.date ? -1 : 1) })),
    patchMock: (id, patch) => up((s) => ({ ...s, mocks: s.mocks.map((m) => m.id === id ? { ...m, ...patch } : m) })),
    deleteMock: (id) => up((s) => ({ ...s, mocks: s.mocks.filter((m) => m.id !== id) })),

    addSession: (x) => up((s) => ({ ...s, sessions: [{ id: uid(), date: todayStr(), ...x }, ...s.sessions] })),
    patchSession: (id, patch) => up((s) => ({ ...s, sessions: s.sessions.map((x) => x.id === id ? { ...x, ...patch } : x) })),
    deleteSession: (id) => up((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) })),

    addResource: (r) => up((s) => ({ ...s, resources: [{ id: uid(), ...r }, ...s.resources] })),
    deleteResource: (id) => up((s) => ({ ...s, resources: s.resources.filter((r) => r.id !== id) })),

    addExtra: (dateStr, task) => up((s) => ({
      ...s, extras: { ...s.extras, [dateStr]: [...(s.extras[dateStr] || []), { id: uid(), ...task }] },
    })),
    setExtraDone: (dateStr, id, done) => up((s) => ({
      ...s, extras: { ...s.extras, [dateStr]: (s.extras[dateStr] || []).map((t) => t.id === id ? { ...t, done } : t) },
    })),
    removeExtra: (dateStr, id) => up((s) => ({
      ...s, extras: { ...s.extras, [dateStr]: (s.extras[dateStr] || []).filter((t) => t.id !== id) },
    })),

    saveWeekReview: (week, patch) => up((s) => ({
      ...s, weekReviews: { ...s.weekReviews, [week]: { ...(s.weekReviews[week] || {}), ...patch } },
    })),

    setTimer: (timer) => up((s) => ({ ...s, timer })),

    setAiChat: (aiChat) => up((s) => ({ ...s, aiChat: aiChat.slice(-40) })),

    importData: (obj) => setState({ ...initialState, ...obj, settings: { ...initialState.settings, ...obj.settings } }),
    resetData: () => { localStorage.removeItem(KEY); setState({ ...initialState }); },
  }), [up]);

  /* ---------- derived helpers ---------- */
  const D = useMemo(() => {
    const chState = (cid) => state.chapters[cid] || {};
    const dayTaskStatus = (day, taskId) => (state.dayState[day]?.tasks || {})[taskId];

    const dayProgress = (day) => {
      const plan = PLAN[day - 1];
      if (!plan) return { done: 0, total: 0, pct: 0 };
      const tasks = plan.tasks;
      const done = tasks.filter((t) => {
        const st = dayTaskStatus(day, t.id);
        return st === 'done' || st === 'skipped' || st === 'moved';
      }).length;
      return { done: tasks.filter((t) => dayTaskStatus(day, t.id) === 'done').length, resolved: done, total: tasks.length, pct: tasks.length ? Math.round(done / tasks.length * 100) : 0 };
    };

    const dayStatus = (day) => {
      const p = dayProgress(day);
      const ds = state.dayState[day];
      if (p.resolved >= p.total && p.total > 0) return 'done';
      if (ds?.missed) return 'miss';
      if (p.resolved > 0) return 'part';
      if (day < currentDay) return 'past';
      return 'none';
    };

    // chapter progress % — theory, notes, pyq vs target, completion
    const chapterProgress = (cid) => {
      const cs = chState(cid);
      const ch = chapterById[cid];
      const pyqFrac = Math.min(1, (cs.pyqAttempted || 0) / ch.pyqTarget);
      const revs = state.revisions.filter((r) => r.chapterId === cid);
      const revFrac = revs.length ? revs.filter((r) => r.done).length / revs.length : 0;
      let pct = (cs.theoryDone ? 0.3 : 0) + (cs.notesDone ? 0.1 : 0) + pyqFrac * 0.35 + (cs.completedOn ? 0.05 : 0) + revFrac * 0.2;
      return Math.round(pct * 100);
    };

    const chapterStatus = (cid) => {
      const cs = chState(cid);
      if (cs.statusOverride) return cs.statusOverride;
      const revs = state.revisions.filter((r) => r.chapterId === cid);
      if (cs.completedOn && revs.length && revs.every((r) => r.done)) return 'MASTERED';
      if (cs.completedOn) return 'REVISION';
      if ((cs.pyqAttempted || 0) > 0) return 'PYQs';
      if (cs.theoryDone || cs.notesDone) return 'LEARNING';
      // any planned task done?
      return 'NOT STARTED';
    };

    const dueRevisions = (dateStr) => state.revisions
      .filter((r) => !r.done && r.due <= dateStr)
      .sort((a, b) => a.due < b.due ? -1 : 1);

    const missedDays = () => {
      const out = [];
      for (let d = 1; d < Math.min(currentDay, TOTAL_DAYS + 1); d++) {
        const p = dayProgress(d);
        if (p.resolved < p.total) out.push(d);
      }
      return out;
    };

    const chapterErrors = (cid) => state.errors.filter((e) => e.chapterId === cid);

    // weakness engine
    const weaknesses = () => {
      const score = {};
      const why = {};
      const bump = (cid, pts, reason) => {
        if (!cid || !chapterById[cid]) return;
        score[cid] = (score[cid] || 0) + pts;
        (why[cid] = why[cid] || new Set()).add(reason);
      };
      state.errors.filter((e) => !e.resolved).forEach((e) => bump(e.chapterId, 2, 'unresolved errors'));
      CHAPTERS.forEach((c) => {
        const cs = chState(c.id);
        const att = cs.pyqAttempted || 0;
        if (att >= 5) {
          const acc = (cs.pyqCorrect || 0) / att;
          if (acc < 0.6) bump(c.id, Math.round((0.6 - acc) * 20), 'low PYQ accuracy');
        }
      });
      state.mocks.forEach((m) => (m.problemChapters || []).forEach((cid) => bump(cid, 3, 'flagged in mock analysis')));
      state.mocks.slice(-3).forEach((m) => (m.problemChapters || []).forEach((cid) => bump(cid, 1, 'recent mock')));
      return Object.entries(score)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([cid, pts]) => ({ chapter: chapterById[cid], pts, reasons: [...(why[cid] || [])] }));
    };

    const overallProgress = () => {
      const total = CHAPTERS.reduce((a, c) => a + chapterProgress(c.id), 0);
      return Math.round(total / CHAPTERS.length);
    };

    const sessionsOn = (dateStr) => state.sessions.filter((s) => s.date === dateStr);
    const minutesOn = (dateStr) => sessionsOn(dateStr).reduce((a, s) => a + s.minutes, 0);

    return { chState, dayTaskStatus, dayProgress, dayStatus, chapterProgress, chapterStatus, dueRevisions, missedDays, weaknesses, overallProgress, chapterErrors, sessionsOn, minutesOn };
  }, [state, currentDay]);

  const value = { state, A, D, route, setRoute, now, start, currentDay, daysRemaining };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
