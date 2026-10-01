/* ============ Plan engine: 46 chapters → 111 days ============ */

export const DEFAULT_START = '2026-10-06';
export const TOTAL_DAYS = 111;
export const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'];

/* ---------- date utils (local, string-based, TZ-safe) ---------- */
export function parseD(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
export function fmtD(dt) {
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}
export function addDays(s, n) { const d = parseD(s); d.setDate(d.getDate() + n); return d ? fmtD(d) : s; }
export function todayStr() { return fmtD(new Date()); }
export function diffDays(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }
export function dayToDate(start, n) { return addDays(start, n - 1); }
export function dateToDay(start, s) { return diffDays(start, s) + 1; }
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const WDAYS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
export function prettyDate(s) { const d = parseD(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
export function shortDate(s) { const d = parseD(s); return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`; }
export function weekdayName(s) { return WDAYS[parseD(s).getDay()]; }

/* ---------- phases ---------- */
export const PHASES = [
  { n: 1, from: 1, to: 36, name: 'Build the Core', desc: 'Tier 1 chapters — highest-yield topics first.' },
  { n: 2, from: 37, to: 70, name: 'Sweep the Rest', desc: 'All remaining Tier 2 chapters.' },
  { n: 3, from: 71, to: 94, name: 'Full Revision', desc: 'Second pass over all 46 chapters. No new chapters.' },
  { n: 4, from: 95, to: 111, name: 'Final Sprint + Taper', desc: 'Tier 1 recall, weak spots, mocks, taper.' },
];
export function phaseOf(n) { return PHASES.find((p) => n >= p.from && n <= p.to) || PHASES[3]; }

/* ---------- chapter database (source: JEE NERDS plan hierarchy) ---------- */
const C = (id, subject, name, tier, pyqTarget) => ({ id, subject, name, tier, pyqTarget });
export const CHAPTERS = [
  // Physics — Tier 1
  C('p-modern', 'Physics', 'Modern Physics', 1, 35),
  C('p-current', 'Physics', 'Current Electricity', 1, 30),
  C('p-electro', 'Physics', 'Electrostatics + Capacitance', 1, 35),
  C('p-mag', 'Physics', 'Magnetism + EMI + AC', 1, 35),
  C('p-optics', 'Physics', 'Ray + Wave Optics', 1, 35),
  // Chemistry — Tier 1
  C('c-coord', 'Chemistry', 'Coordination Compounds', 1, 30),
  C('c-bond', 'Chemistry', 'Chemical Bonding', 1, 35),
  C('c-pblock', 'Chemistry', 'p-Block', 1, 35),
  C('c-goc', 'Chemistry', 'GOC + Isomerism', 1, 30),
  C('c-carbonyl', 'Chemistry', 'Aldehydes, Ketones, Acids', 1, 30),
  // Mathematics — Tier 1
  C('m-integ', 'Mathematics', 'Definite + Indefinite Integration', 1, 40),
  C('m-aod', 'Mathematics', 'Application of Derivatives', 1, 30),
  C('m-matrices', 'Mathematics', 'Matrices + Determinants', 1, 35),
  C('m-prob', 'Mathematics', 'Probability', 1, 25),
  C('m-conics', 'Mathematics', 'Conic Sections', 1, 35),
  C('m-3dvec', 'Mathematics', '3D Geometry + Vectors', 1, 40),
  // Physics — Tier 2
  C('p-rot', 'Physics', 'Rotational Motion', 2, 25),
  C('p-thermo', 'Physics', 'Thermodynamics + KTG', 2, 25),
  C('p-shm', 'Physics', 'SHM + Waves', 2, 25),
  C('p-semi', 'Physics', 'Semiconductors', 2, 20),
  C('p-kin', 'Physics', 'Kinematics + Laws of Motion', 2, 25),
  C('p-wep', 'Physics', 'Work, Energy, Power + COM', 2, 25),
  C('p-units', 'Physics', 'Units, Dimensions, Errors', 2, 15),
  C('p-grav', 'Physics', 'Gravitation', 2, 15),
  C('p-exp', 'Physics', 'Experimental Skills', 2, 15),
  // Chemistry — Tier 2
  C('c-dfblock', 'Chemistry', 'd- and f-Block', 2, 20),
  C('c-equil', 'Chemistry', 'Equilibrium + Ionic', 2, 25),
  C('c-amines', 'Chemistry', 'Amines', 2, 20),
  C('c-halo', 'Chemistry', 'Haloalkanes, Alcohols, Phenols', 2, 25),
  C('c-mole', 'Chemistry', 'Mole Concept + Stoichiometry', 2, 20),
  C('c-electrochem', 'Chemistry', 'Electrochemistry', 2, 20),
  C('c-kinetics', 'Chemistry', 'Chemical Kinetics', 2, 20),
  C('c-thermo', 'Chemistry', 'Thermodynamics + Thermochem', 2, 20),
  C('c-solutions', 'Chemistry', 'Solutions', 2, 20),
  C('c-periodic', 'Chemistry', 'Periodic Table + Atomic Structure', 2, 25),
  C('c-bio', 'Chemistry', 'Biomolecules + Practical Chemistry', 2, 20),
  // Mathematics — Tier 2
  C('m-lcd', 'Mathematics', 'Limits, Continuity, Differentiability', 2, 25),
  C('m-lines', 'Mathematics', 'Straight Lines + Circles', 2, 25),
  C('m-seq', 'Mathematics', 'Sequences + Series', 2, 20),
  C('m-complex', 'Mathematics', 'Complex Numbers', 2, 20),
  C('m-quad', 'Mathematics', 'Quadratic Equations', 2, 20),
  C('m-pnc', 'Mathematics', 'Permutations + Combinations', 2, 20),
  C('m-binom', 'Mathematics', 'Binomial Theorem', 2, 15),
  C('m-de', 'Mathematics', 'Differential Equations', 2, 20),
  C('m-stats', 'Mathematics', 'Statistics', 2, 15),
  C('m-trig', 'Mathematics', 'Trigonometry + Inverse Trigonometry', 2, 25),
];
export const chapterById = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));
export const chaptersOf = (sub, tier) => CHAPTERS.filter((c) => c.subject === sub && (!tier || c.tier === tier));

/* ---------- schedule construction ---------- */
// distribute `total` slots over n items, extras go to the front
function alloc(total, n) {
  const base = Math.floor(total / n), rem = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

export const MOCK_DAYS = {
  42: { part: true }, 56: { part: true }, 70: { part: true },  // Phase 2 (part syllabus)
  77: {}, 84: {}, 91: {},                                       // Phase 3 (full)
  96: {}, 99: {}, 102: {}, 105: {}, 108: {},                    // Phase 4 (full)
};
export const MOCK_DAY_LIST = Object.keys(MOCK_DAYS).map(Number).sort((a, b) => a - b);
export const CHECKPOINT_DAY = 36;

const T1 = { Physics: chaptersOf('Physics', 1), Chemistry: chaptersOf('Chemistry', 1), Mathematics: chaptersOf('Mathematics', 1) };
const T2 = { Physics: chaptersOf('Physics', 2), Chemistry: chaptersOf('Chemistry', 2), Mathematics: chaptersOf('Mathematics', 2) };

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }

// per-subject learning schedule: day -> {cid, pos, len}
function buildLearnSchedule() {
  const sched = { Physics: {}, Chemistry: {}, Mathematics: {} };
  const p1Days = range(1, 35); // day 36 = Tier 1 checkpoint test
  const p2Days = range(37, 70).filter((d) => !MOCK_DAYS[d]);
  for (const sub of SUBJECTS) {
    for (const [days, chs] of [[p1Days, T1[sub]], [p2Days, T2[sub]]]) {
      const lens = alloc(days.length, chs.length);
      let i = 0;
      chs.forEach((ch, ci) => {
        for (let k = 0; k < lens[ci]; k++) { sched[sub][days[i]] = { cid: ch.id, pos: k, len: lens[ci] }; i++; }
      });
    }
  }
  return sched;
}

// phase 3 revision schedule (second pass over ALL chapters; Tier 1 gets 2 days)
function buildRevSchedule() {
  const revDays = range(71, 94).filter((d) => !MOCK_DAYS[d]); // 21 days
  const sched = { Physics: {}, Chemistry: {}, Mathematics: {} };
  const chapterP3Day = {};
  for (const sub of SUBJECTS) {
    const chs = [...T1[sub], ...T2[sub]];
    const lens = alloc(revDays.length, chs.length); // extras land on Tier 1 (front)
    let i = 0;
    chs.forEach((ch, ci) => {
      for (let k = 0; k < lens[ci]; k++) {
        sched[sub][revDays[i]] = { cid: ch.id, pos: k, len: lens[ci] };
        if (k === lens[ci] - 1) chapterP3Day[ch.id] = revDays[i];
        i++;
      }
    });
  }
  return { sched, chapterP3Day };
}

const LEARN = buildLearnSchedule();
const { sched: REV, chapterP3Day } = buildRevSchedule();
export const CHAPTER_P3_DAY = chapterP3Day;

function learnKind(pos, len) {
  if (len === 1) return ['Theory + Timed PYQs + Summary', 150];
  if (pos === 0) return ['Concept Learning', 120];
  if (pos === len - 1) return ['Timed PYQs + One-page Summary', 120];
  if (pos < (len - 1) / 2) return ['Concepts + Solved Examples', 120];
  return ['Theory + PYQs', 120];
}

let mockCounter = null;
function mockNumberFor(day) {
  if (!mockCounter) { mockCounter = {}; MOCK_DAY_LIST.forEach((d, i) => { mockCounter[d] = i + 1; }); }
  return mockCounter[day];
}

/* ---------- daily task generation (deterministic) ---------- */
export function plannedTasks(n) {
  const tasks = [];
  const push = (subject, title, kind, est, extra = {}) =>
    tasks.push({ id: `d${n}-${tasks.length}`, day: n, subject, title, kind, est, ...extra });

  if (MOCK_DAYS[n]) {
    const num = mockNumberFor(n);
    const part = MOCK_DAYS[n].part;
    push('General', `Mock ${String(num).padStart(2, '0')} — ${part ? 'part-syllabus' : 'full syllabus'} (3h, exam timing)`, 'Mock', 180, { mock: num });
    push('General', 'Four-bucket analysis + over-4-minute review', 'Mock Analysis', 90, { mock: num });
    push('General', 'Log every mistake in the error notebook', 'Error Analysis', 30);
    if (phaseOf(n).n >= 3) push('General', 'Light revision — formulas of weakest chapters', 'Revision', 45);
    return tasks;
  }
  if (n === CHECKPOINT_DAY) {
    push('General', 'Tier 1 checkpoint — sectional test across all 16 Tier 1 chapters', 'Sectional Test', 150);
    push('General', 'Checkpoint analysis + error notebook update', 'Error Analysis', 60);
    push('General', 'Patch the two weakest Tier 1 chapters found today', 'Revision', 90);
    return tasks;
  }
  const ph = phaseOf(n).n;
  if (ph <= 2) {
    for (const sub of SUBJECTS) {
      const s = LEARN[sub][n];
      if (!s) continue;
      const ch = chapterById[s.cid];
      const [kind, est] = learnKind(s.pos, s.len);
      push(sub, ch.name, kind, est, { chapterId: ch.id, completesChapter: s.pos === s.len - 1 });
    }
    return tasks;
  }
  if (ph === 3) {
    for (const sub of SUBJECTS) {
      const s = REV[sub][n];
      if (!s) continue;
      const ch = chapterById[s.cid];
      const kind = s.len > 1 && s.pos === 0 ? 'Summary + Formulas + Traps' : 'Phase 3 Revision + PYQ set';
      push(sub, ch.name, kind, 90, { chapterId: ch.id, phase3: s.pos === s.len - 1 });
    }
    push('General', 'Mixed timed PYQ set (20–30 Q across subjects)', 'Timed PYQs', 60);
    return tasks;
  }
  // Phase 4
  if (n >= 109) {
    const taper = {
      109: [['Formula sheets — all three subjects', 'Revision', 90], ['Error notebook — final skim (resolved lessons)', 'Error Analysis', 60], ['Tier 1 light recall — traps and standard results', 'Revision', 60]],
      110: [['Light mixed recall — no new question types', 'Revision', 90], ['Exam-day rehearsal — timing, question selection, order', 'Strategy', 45], ['Align sleep schedule to exam slot', 'Rest', 0]],
      111: [['Exam eve — formula glance only, nothing new', 'Revision', 60], ['Logistics — admit card, centre route, kit', 'Strategy', 30], ['Rest early. You are ready.', 'Rest', 0]],
    };
    taper[n].forEach(([t, k, e]) => push('General', t, k, e));
    return tasks;
  }
  const sprintDays = range(95, 108).filter((d) => !MOCK_DAYS[d]);
  const idx = sprintDays.indexOf(n);
  const pT1 = T1.Physics[idx % T1.Physics.length];
  const cT1 = T1.Chemistry[idx % T1.Chemistry.length];
  const mT1 = T1.Mathematics[idx % T1.Mathematics.length];
  push('Physics', pT1.name, 'Tier 1 Rapid Recall', 60, { chapterId: pT1.id });
  push('Chemistry', cT1.name, 'Tier 1 Rapid Recall', 60, { chapterId: cT1.id });
  push('Mathematics', mT1.name, 'Tier 1 Rapid Recall', 60, { chapterId: mT1.id });
  const rot = [
    ['Error notebook — reattempt unresolved questions', 'Error Analysis', 60],
    ['NCERT inorganic + biomolecules recall', 'Revision', 60],
    ['Weak-chapter drill (from Weakness engine)', 'Revision', 75],
  ][idx % 3];
  push('General', rot[0], rot[1], rot[2]);
  return tasks;
}

// Precomputed full plan (dayNumber only; dates come from settings.startDate)
export const PLAN = range(1, TOTAL_DAYS).map((n) => ({
  n,
  phase: phaseOf(n).n,
  week: Math.ceil(n / 7),
  tasks: plannedTasks(n),
}));

export function chapterPlanInfo(cid) {
  // first/last learn day for a chapter
  let first = null, last = null;
  for (const sub of SUBJECTS) {
    for (const [d, s] of Object.entries(LEARN[sub])) {
      if (s.cid === cid) { const dn = Number(d); if (first === null || dn < first) first = dn; if (last === null || dn > last) last = dn; }
    }
  }
  return { firstDay: first, lastDay: last, p3Day: CHAPTER_P3_DAY[cid] };
}

export const REVISION_LABELS = { d2: '+2 day cold recall', d10: '+10 day retrieval set (20 Q)', d30: '+30 day mixed retrieval', p3: 'Phase 3 full revision' };
export const MISTAKE_TYPES = ['Concept', 'Formula', 'Calculation', 'Misread', 'Silly mistake', 'Guess', 'Time management'];
export const CHAPTER_STATUSES = ['NOT STARTED', 'LEARNING', 'PYQs', 'REVISION', 'MASTERED'];
export const RESOURCE_TYPES = ['Lecture', 'PDF', 'Notes', 'PYQ', 'Mock', 'Other'];
