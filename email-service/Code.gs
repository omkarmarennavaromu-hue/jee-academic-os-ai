/**
 * JEE ACADEMIC OS — Daily Plan Email Service (Google Apps Script)
 * ----------------------------------------------------------------
 * Runs in YOUR Google account. Sends the daily plan email at midnight IST.
 * No SMTP passwords, no API keys — MailApp sends from your own Gmail.
 *
 * SETUP (one time, ~5 minutes):
 *   1. Go to script.google.com → New project
 *   2. Paste this entire file into Code.gs (replace default content)
 *   3. Project Settings → check "Show appsscript.json", set timeZone to "Asia/Kolkata"
 *      (or paste the provided appsscript.json)
 *   4. Run the function `setup` once (▶ button) → authorize when asked
 *   5. Deploy → New deployment → type "Web app" →
 *        Execute as: Me   ·   Who has access: Anyone
 *      → copy the Web app URL
 *   6. Paste that URL into JEE Academic OS → Settings → Daily Email → Endpoint
 *      and turn the toggle ON. Use SEND TEST EMAIL to verify.
 */

/* ================= CONFIG ================= */
var CONFIG = {
  RECIPIENT: 'omkarmarennavaromu@gmail.com', // overridden by app Settings sync if changed there
  START_DATE: '2026-10-06',
  TOTAL_DAYS: 111,
  APP_URL: 'http://localhost:5173', // change to wherever you open the app (or leave as-is)
  ACCENT: '#4f7cff',
};

/* ================= PLAN ENGINE (mirrors src/plan.js — do not edit independently) ================= */
var SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'];
function C(id, subject, name, tier, pyqTarget) { return { id: id, subject: subject, name: name, tier: tier, pyqTarget: pyqTarget }; }
var CHAPTERS = [
  C('p-modern','Physics','Modern Physics',1,35), C('p-current','Physics','Current Electricity',1,30),
  C('p-electro','Physics','Electrostatics + Capacitance',1,35), C('p-mag','Physics','Magnetism + EMI + AC',1,35),
  C('p-optics','Physics','Ray + Wave Optics',1,35),
  C('c-coord','Chemistry','Coordination Compounds',1,30), C('c-bond','Chemistry','Chemical Bonding',1,35),
  C('c-pblock','Chemistry','p-Block',1,35), C('c-goc','Chemistry','GOC + Isomerism',1,30),
  C('c-carbonyl','Chemistry','Aldehydes, Ketones, Acids',1,30),
  C('m-integ','Mathematics','Definite + Indefinite Integration',1,40), C('m-aod','Mathematics','Application of Derivatives',1,30),
  C('m-matrices','Mathematics','Matrices + Determinants',1,35), C('m-prob','Mathematics','Probability',1,25),
  C('m-conics','Mathematics','Conic Sections',1,35), C('m-3dvec','Mathematics','3D Geometry + Vectors',1,40),
  C('p-rot','Physics','Rotational Motion',2,25), C('p-thermo','Physics','Thermodynamics + KTG',2,25),
  C('p-shm','Physics','SHM + Waves',2,25), C('p-semi','Physics','Semiconductors',2,20),
  C('p-kin','Physics','Kinematics + Laws of Motion',2,25), C('p-wep','Physics','Work, Energy, Power + COM',2,25),
  C('p-units','Physics','Units, Dimensions, Errors',2,15), C('p-grav','Physics','Gravitation',2,15),
  C('p-exp','Physics','Experimental Skills',2,15),
  C('c-dfblock','Chemistry','d- and f-Block',2,20), C('c-equil','Chemistry','Equilibrium + Ionic',2,25),
  C('c-amines','Chemistry','Amines',2,20), C('c-halo','Chemistry','Haloalkanes, Alcohols, Phenols',2,25),
  C('c-mole','Chemistry','Mole Concept + Stoichiometry',2,20), C('c-electrochem','Chemistry','Electrochemistry',2,20),
  C('c-kinetics','Chemistry','Chemical Kinetics',2,20), C('c-thermo','Chemistry','Thermodynamics + Thermochem',2,20),
  C('c-solutions','Chemistry','Solutions',2,20), C('c-periodic','Chemistry','Periodic Table + Atomic Structure',2,25),
  C('c-bio','Chemistry','Biomolecules + Practical Chemistry',2,20),
  C('m-lcd','Mathematics','Limits, Continuity, Differentiability',2,25), C('m-lines','Mathematics','Straight Lines + Circles',2,25),
  C('m-seq','Mathematics','Sequences + Series',2,20), C('m-complex','Mathematics','Complex Numbers',2,20),
  C('m-quad','Mathematics','Quadratic Equations',2,20), C('m-pnc','Mathematics','Permutations + Combinations',2,20),
  C('m-binom','Mathematics','Binomial Theorem',2,15), C('m-de','Mathematics','Differential Equations',2,20),
  C('m-stats','Mathematics','Statistics',2,15), C('m-trig','Mathematics','Trigonometry + Inverse Trigonometry',2,25),
];
var chapterById = {};
CHAPTERS.forEach(function (c) { chapterById[c.id] = c; });
function chaptersOf(sub, tier) { return CHAPTERS.filter(function (c) { return c.subject === sub && (!tier || c.tier === tier); }); }

function parseD(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function fmtD(dt) { return Utilities.formatDate(dt, 'Asia/Kolkata', 'yyyy-MM-dd'); }
function addDaysStr(s, n) { var d = parseD(s); d.setDate(d.getDate() + n); return fmtD(d); }
function diffDays(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }
function dayToDate(n) { return addDaysStr(CONFIG.START_DATE, n - 1); }
function dateToDay(s) { return diffDays(CONFIG.START_DATE, s) + 1; }
function todayIST() { return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd'); }
function prettyDate(s) { return Utilities.formatDate(parseD(s), 'Asia/Kolkata', 'd MMMM yyyy'); }
function weekdayName(s) { return Utilities.formatDate(parseD(s), 'Asia/Kolkata', 'EEEE').toUpperCase(); }

var PHASES = [
  { n: 1, from: 1, to: 36, name: 'Build the Core' }, { n: 2, from: 37, to: 70, name: 'Sweep the Rest' },
  { n: 3, from: 71, to: 94, name: 'Full Revision' }, { n: 4, from: 95, to: 111, name: 'Final Sprint + Taper' },
];
function phaseOf(n) { for (var i = 0; i < PHASES.length; i++) if (n >= PHASES[i].from && n <= PHASES[i].to) return PHASES[i]; return PHASES[3]; }

var MOCK_DAYS = { 42: { part: 1 }, 56: { part: 1 }, 70: { part: 1 }, 77: {}, 84: {}, 91: {}, 96: {}, 99: {}, 102: {}, 105: {}, 108: {} };
var MOCK_DAY_LIST = Object.keys(MOCK_DAYS).map(Number).sort(function (a, b) { return a - b; });
var CHECKPOINT_DAY = 36;

function alloc(total, n) { var base = Math.floor(total / n), rem = total - base * n, r = []; for (var i = 0; i < n; i++) r.push(base + (i < rem ? 1 : 0)); return r; }
function range(a, b) { var r = []; for (var i = a; i <= b; i++) r.push(i); return r; }

var T1 = { Physics: chaptersOf('Physics', 1), Chemistry: chaptersOf('Chemistry', 1), Mathematics: chaptersOf('Mathematics', 1) };
var T2 = { Physics: chaptersOf('Physics', 2), Chemistry: chaptersOf('Chemistry', 2), Mathematics: chaptersOf('Mathematics', 2) };

function buildLearnSchedule() {
  var sched = { Physics: {}, Chemistry: {}, Mathematics: {} };
  var p1Days = range(1, 35);
  var p2Days = range(37, 70).filter(function (d) { return !MOCK_DAYS[d]; });
  SUBJECTS.forEach(function (sub) {
    [[p1Days, T1[sub]], [p2Days, T2[sub]]].forEach(function (pair) {
      var days = pair[0], chs = pair[1], lens = alloc(days.length, chs.length), i = 0;
      chs.forEach(function (ch, ci) { for (var k = 0; k < lens[ci]; k++) { sched[sub][days[i]] = { cid: ch.id, pos: k, len: lens[ci] }; i++; } });
    });
  });
  return sched;
}
function buildRevSchedule() {
  var revDays = range(71, 94).filter(function (d) { return !MOCK_DAYS[d]; });
  var sched = { Physics: {}, Chemistry: {}, Mathematics: {} };
  SUBJECTS.forEach(function (sub) {
    var chs = T1[sub].concat(T2[sub]), lens = alloc(revDays.length, chs.length), i = 0;
    chs.forEach(function (ch, ci) { for (var k = 0; k < lens[ci]; k++) { sched[sub][revDays[i]] = { cid: ch.id, pos: k, len: lens[ci] }; i++; } });
  });
  return sched;
}
var LEARN = buildLearnSchedule();
var REV = buildRevSchedule();

function learnKind(pos, len) {
  if (len === 1) return ['Theory + Timed PYQs + Summary', 150];
  if (pos === 0) return ['Concept Learning', 120];
  if (pos === len - 1) return ['Timed PYQs + One-page Summary', 120];
  if (pos < (len - 1) / 2) return ['Concepts + Solved Examples', 120];
  return ['Theory + PYQs', 120];
}
function mockNumberFor(day) { return MOCK_DAY_LIST.indexOf(day) + 1; }

function plannedTasks(n) {
  var tasks = [];
  function push(subject, title, kind, est, chapterId) { tasks.push({ subject: subject, title: title, kind: kind, est: est, chapterId: chapterId || null }); }
  if (MOCK_DAYS[n]) {
    var num = mockNumberFor(n), part = MOCK_DAYS[n].part;
    push('General', 'Mock ' + ('0' + num).slice(-2) + ' — ' + (part ? 'part-syllabus' : 'full syllabus') + ' (3h, exam timing)', 'Mock', 180);
    push('General', 'Four-bucket analysis + over-4-minute review', 'Mock Analysis', 90);
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
  var ph = phaseOf(n).n;
  if (ph <= 2) {
    SUBJECTS.forEach(function (sub) {
      var s = LEARN[sub][n]; if (!s) return;
      var ch = chapterById[s.cid], kk = learnKind(s.pos, s.len);
      push(sub, ch.name, kk[0], kk[1], ch.id);
    });
    return tasks;
  }
  if (ph === 3) {
    SUBJECTS.forEach(function (sub) {
      var s = REV[sub][n]; if (!s) return;
      var ch = chapterById[s.cid];
      push(sub, ch.name, s.len > 1 && s.pos === 0 ? 'Summary + Formulas + Traps' : 'Phase 3 Revision + PYQ set', 90, ch.id);
    });
    push('General', 'Mixed timed PYQ set (20–30 Q across subjects)', 'Timed PYQs', 60);
    return tasks;
  }
  if (n >= 109) {
    var taper = {
      109: [['Formula sheets — all three subjects', 'Revision', 90], ['Error notebook — final skim (resolved lessons)', 'Error Analysis', 60], ['Tier 1 light recall — traps and standard results', 'Revision', 60]],
      110: [['Light mixed recall — no new question types', 'Revision', 90], ['Exam-day rehearsal — timing, question selection, order', 'Strategy', 45], ['Align sleep schedule to exam slot', 'Rest', 0]],
      111: [['Exam eve — formula glance only, nothing new', 'Revision', 60], ['Logistics — admit card, centre route, kit', 'Strategy', 30], ['Rest early. You are ready.', 'Rest', 0]],
    };
    taper[n].forEach(function (t) { push('General', t[0], t[1], t[2]); });
    return tasks;
  }
  var sprintDays = range(95, 108).filter(function (d) { return !MOCK_DAYS[d]; });
  var idx = sprintDays.indexOf(n);
  var pT1 = T1.Physics[idx % T1.Physics.length], cT1 = T1.Chemistry[idx % T1.Chemistry.length], mT1 = T1.Mathematics[idx % T1.Mathematics.length];
  push('Physics', pT1.name, 'Tier 1 Rapid Recall', 60, pT1.id);
  push('Chemistry', cT1.name, 'Tier 1 Rapid Recall', 60, cT1.id);
  push('Mathematics', mT1.name, 'Tier 1 Rapid Recall', 60, mT1.id);
  var rot = [['Error notebook — reattempt unresolved questions', 'Error Analysis', 60], ['NCERT inorganic + biomolecules recall', 'Revision', 60], ['Weak-chapter drill (from Weakness engine)', 'Revision', 75]][idx % 3];
  push('General', rot[0], rot[1], rot[2]);
  return tasks;
}

var REVISION_LABELS = { d2: '+2 Day Recall', d10: '+10 Day Recall', d30: '+30 Day Recall', p3: 'Phase 3 Revision' };

/* ================= STORAGE HELPERS ================= */
function props() { return PropertiesService.getScriptProperties(); }
function getSnapshot() { try { return JSON.parse(props().getProperty('snapshot') || '{}'); } catch (e) { return {}; } }
function getLog() { try { return JSON.parse(props().getProperty('emailLog') || '[]'); } catch (e) { return []; } }
function pushLog(entry) {
  var log = getLog(); log.unshift(entry);
  props().setProperty('emailLog', JSON.stringify(log.slice(0, 14)));
}

/* ================= EMAIL BUILDER (fully dynamic — never hard-coded) ================= */
var EMOJI = { Physics: '⚡', Chemistry: '🧪', Mathematics: '📐', General: '📌' };

function dueRevisionsFor(dateStr, snapshot) {
  var revs = (snapshot && snapshot.revisions) || [];
  return revs.filter(function (r) { return !r.done && r.due <= dateStr; })
    .sort(function (a, b) { return a.due < b.due ? -1 : 1; })
    .map(function (r) {
      var ch = chapterById[r.c];
      return { name: ch ? ch.name : r.c, subject: ch ? ch.subject : '', label: REVISION_LABELS[r.t] || r.t };
    });
}

function yesterdayInfo(day, snapshot) {
  if (day <= 1 || !snapshot || !snapshot.days) return null;
  var y = snapshot.days[String(day - 1)];
  if (!y) return null;
  var pending = (y.total || 0) - (y.resolved || 0);
  return pending > 0 ? pending : null;
}

function buildEmailHtml(day, isTest) {
  var snapshot = getSnapshot();
  var dateStr = dayToDate(day);
  var tasks = plannedTasks(day);
  var phase = phaseOf(day);
  var due = dueRevisionsFor(todayIST() <= dateStr ? dateStr : todayIST(), snapshot);
  var yPending = yesterdayInfo(day, snapshot);
  var remaining = CONFIG.TOTAL_DAYS - day;
  var A = CONFIG.ACCENT;

  function sect(title) { return '<div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#8a93a3;margin:22px 0 10px;">' + title + '</div>'; }

  var h = '<div style="background:#f2f4f7;padding:24px 12px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">';
  h += '<div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e3e7ee;border-radius:14px;padding:28px 30px;">';
  if (isTest) h += '<div style="background:#fff7e0;border:1px solid #e8b93e;color:#8a6a10;font-size:12px;font-weight:700;padding:7px 12px;border-radius:8px;margin-bottom:16px;">TEST — JEE Academic OS (this is not the scheduled daily email)</div>';
  h += '<div style="font-size:11px;font-weight:700;letter-spacing:2px;color:' + A + ';">JEE MAIN 2027 · PHASE ' + phase.n + ' — ' + phase.name.toUpperCase() + '</div>';
  h += '<div style="font-size:26px;font-weight:800;color:#171b21;margin-top:4px;">DAY ' + day + ' <span style="color:#9aa3b0;font-weight:400;">/ ' + CONFIG.TOTAL_DAYS + '</span></div>';
  h += '<div style="font-size:14px;color:#5b6472;">' + weekdayName(dateStr) + ', ' + prettyDate(dateStr) + '</div>';

  h += sect("TODAY'S PLAN");
  tasks.forEach(function (t) {
    h += '<div style="border:1px solid #e8ebf0;border-radius:10px;padding:10px 14px;margin-bottom:7px;">'
      + '<div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#5b6472;">' + (EMOJI[t.subject] || '📌') + ' ' + t.subject.toUpperCase() + '</div>'
      + '<div style="font-size:15px;font-weight:650;color:#171b21;">' + t.title + '</div>'
      + '<div style="font-size:12px;color:#8a93a3;">' + t.kind + (t.est ? ' · ' + Math.floor(t.est / 60) + 'h' + (t.est % 60 ? ' ' + (t.est % 60) + 'm' : '') : '') + '</div></div>';
  });

  h += sect('🔁 REVISION DUE' + (due.length ? ' — ' + due.length : ''));
  if (due.length === 0) h += '<div style="font-size:13px;color:#8a93a3;">No scheduled revisions today.</div>';
  else due.slice(0, 8).forEach(function (r, i) {
    h += '<div style="font-size:14px;color:#171b21;padding:3px 0;">' + (i + 1) + '. <b>' + r.name + '</b> — ' + r.label + '</div>';
  });

  var targets = [];
  tasks.forEach(function (t) {
    if (t.chapterId && chapterById[t.chapterId] && phaseOf(day).n <= 2 && t.kind.indexOf('PYQ') !== -1)
      targets.push(t.subject + ' PYQs (' + chapterById[t.chapterId].name + '): work toward ' + chapterById[t.chapterId].pyqTarget + ' total');
  });
  if (due.length > 0) targets.push('Spaced recall: ~30 minutes');
  if (targets.length) {
    h += sect("🎯 TODAY'S TARGETS");
    targets.forEach(function (t) { h += '<div style="font-size:13.5px;color:#171b21;padding:2px 0;">• ' + t + '</div>'; });
  }

  h += sect('📝 TEST');
  if (MOCK_DAYS[day]) {
    var num = mockNumberFor(day);
    h += '<div style="font-size:14px;color:#171b21;"><b>Mock ' + ('0' + num).slice(-2) + '</b> — ' + (MOCK_DAYS[day].part ? 'part syllabus' : 'full syllabus') + ' · 3 hours, exam timing. Analyse with the four buckets after.</div>';
  } else if (day === CHECKPOINT_DAY) {
    h += '<div style="font-size:14px;color:#171b21;"><b>Tier 1 checkpoint</b> — sectional test across all 16 Tier 1 chapters.</div>';
  } else h += '<div style="font-size:13px;color:#8a93a3;">No test scheduled today.</div>';

  if (yPending) h += '<div style="font-size:12px;color:#b0862a;margin-top:16px;">Yesterday: ' + yPending + ' task' + (yPending > 1 ? 's' : '') + ' incomplete — recover them in the app, the calendar does not shift.</div>';

  h += sect('⏳ PROGRESS');
  var pct = Math.round(day / CONFIG.TOTAL_DAYS * 100);
  h += '<div style="background:#eef0f4;border-radius:99px;height:8px;overflow:hidden;"><div style="background:' + A + ';height:8px;width:' + pct + '%;"></div></div>';
  h += '<div style="font-size:13px;color:#5b6472;margin-top:6px;">Day ' + day + ' of ' + CONFIG.TOTAL_DAYS + ' · ' + remaining + ' day' + (remaining === 1 ? '' : 's') + ' remaining to Day 111</div>';

  h += '<div style="text-align:center;margin-top:26px;"><a href="' + CONFIG.APP_URL + '" style="display:inline-block;background:' + A + ';color:#ffffff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:9px;text-decoration:none;">OPEN JEE ACADEMIC OS</a></div>';
  h += '<div style="text-align:center;font-size:11px;color:#b3bac4;margin-top:18px;">JEE Academic OS · 111 days · 46 chapters · one execution system</div>';
  h += '</div></div>';
  return h;
}

function recipient() {
  var snap = getSnapshot();
  return (snap && snap.email) || CONFIG.RECIPIENT;
}

/* ================= DAILY SEND (trigger target) ================= */
function dailyEmail() {
  var today = todayIST();
  var day = dateToDay(today);
  var p = props();

  if (day < 1 || day > CONFIG.TOTAL_DAYS) return; // outside 6 Oct 2026 → 24 Jan 2027

  var snap = getSnapshot();
  if (snap && snap.enabled === false) { pushLog({ date: today, status: 'skipped', note: 'disabled in app settings' }); return; }

  // duplicate protection
  if (p.getProperty('lastDailyEmailDate') === today) return;

  try {
    MailApp.sendEmail({
      to: recipient(),
      subject: 'JEE OS — Day ' + day + '/' + CONFIG.TOTAL_DAYS + " | Today's Plan",
      htmlBody: buildEmailHtml(day, false),
      name: 'JEE Academic OS',
    });
    p.setProperty('lastDailyEmailDate', today);
    pushLog({ date: today, status: 'sent', day: day });
  } catch (err) {
    pushLog({ date: today, status: 'failed', day: day, error: String(err) });
  }
}

/* ================= TEST EMAIL ================= */
function sendTestEmail() {
  var today = todayIST();
  var day = dateToDay(today);
  var previewDay = Math.min(Math.max(day, 1), CONFIG.TOTAL_DAYS); // before 6 Oct → previews Day 1
  MailApp.sendEmail({
    to: recipient(),
    subject: 'TEST — JEE Academic OS | Day ' + previewDay + '/' + CONFIG.TOTAL_DAYS,
    htmlBody: buildEmailHtml(previewDay, true),
    name: 'JEE Academic OS',
  });
  pushLog({ date: today, status: 'test sent', day: previewDay });
}

/* ================= ONE-TIME SETUP ================= */
function setup() {
  // remove old triggers for dailyEmail, then create the midnight trigger
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailyEmail') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyEmail').timeBased().everyDays(1).atHour(0).nearMinute(1).create();
  Logger.log('Daily trigger created: every day 00:00–01:00 IST (project timezone must be Asia/Kolkata).');
  Logger.log('Now deploy as Web App (Execute as: Me · Access: Anyone) and paste the URL into the app Settings.');
}

/* ================= WEB APP (sync + test, called by the frontend) ================= */
function statusPayload() {
  return {
    ok: true,
    lastDailyEmailDate: props().getProperty('lastDailyEmailDate') || null,
    log: getLog(),
    hasSnapshot: !!props().getProperty('snapshot'),
    snapshotSavedAt: (getSnapshot() || {}).savedAt || null,
    recipient: recipient(),
  };
}
function jsonOut(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

function doGet() { return jsonOut(statusPayload()); }

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return jsonOut({ ok: false, error: 'bad json' }); }
  try {
    if (body.action === 'sync') {
      var snap = {
        email: body.email || CONFIG.RECIPIENT,
        enabled: body.enabled !== false,
        revisions: (body.revisions || []).slice(0, 400),
        days: body.days || {},
        savedAt: new Date().toISOString(),
      };
      props().setProperty('snapshot', JSON.stringify(snap));
      return jsonOut(statusPayload());
    }
    if (body.action === 'test') { sendTestEmail(); return jsonOut(statusPayload()); }
    if (body.action === 'status') return jsonOut(statusPayload());
    return jsonOut({ ok: false, error: 'unknown action' });
  } catch (err) {
    pushLog({ date: todayIST(), status: 'failed', error: String(err) });
    return jsonOut({ ok: false, error: String(err) });
  }
}
