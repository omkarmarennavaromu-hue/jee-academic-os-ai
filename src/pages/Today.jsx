import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { Card, PBar, Empty, fmtMin, Modal } from '../components/ui.jsx';
import { TaskRow, RevisionRow, ExtraRow } from '../components/TaskRow.jsx';
import { PLAN, TOTAL_DAYS, phaseOf, dayToDate, prettyDate, weekdayName, chapterById, MOCK_DAY_LIST } from '../plan.js';
import { ExtraTaskForm, SessionForm } from '../components/forms.jsx';
import { Plus, AlertTriangle, Clock } from 'lucide-react';

export default function Today() {
  const { state, A, D, setRoute, now, start, currentDay, route } = useStore();
  const [modal, setModal] = useState(route.tab === 'missed' ? null : null);
  const [showMissed, setShowMissed] = useState(route.tab === 'missed');
  const dayN = Math.min(Math.max(currentDay, 1), TOTAL_DAYS);
  const beforeStart = currentDay < 1;
  const plan = PLAN[dayN - 1];
  const phase = phaseOf(dayN);
  const prog = D.dayProgress(dayN);
  const due = D.dueRevisions(now);
  const missedDays = D.missedDays().filter((d) => d !== dayN);
  const extras = state.extras[now] || [];
  const minsToday = D.minutesOn(now);
  const sessions = D.sessionsOn(now);
  const openChapter = (id) => setRoute({ page: 'chapter', id });

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row spread wrap">
        <div>
          <div className="small muted" style={{ fontWeight: 700, letterSpacing: '.1em' }}>{weekdayName(now)}</div>
          <div className="h1">{prettyDate(now)}</div>
          <div className="small muted">
            {beforeStart ? `Plan starts ${prettyDate(start)} — showing Day 1 preview` : `Day ${dayN} / ${TOTAL_DAYS} · Phase ${phase.n} — ${phase.name}`}
          </div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setModal('extra')}><Plus size={14} /> Add task</button>
          <button className="btn" onClick={() => setModal('session')}><Clock size={14} /> Log time</button>
        </div>
      </div>

      <Card title="TODAY'S PLAN">
        <div className="col" style={{ gap: 8 }}>
          {plan.tasks.map((t) => <TaskRow key={t.id} task={t} day={dayN} onOpenChapter={openChapter} />)}
          {due.length > 0 && due.slice(0, 6).map((r) => <RevisionRow key={r.id} rev={r} onOpenChapter={openChapter} />)}
          {extras.map((t) => <ExtraRow key={t.id} task={t} dateStr={now} />)}
        </div>
        <div className="row" style={{ marginTop: 14, gap: 16 }}>
          <div style={{ flex: 1 }}><PBar pct={prog.pct} green={prog.pct === 100} /></div>
          <span className="small mono muted">{prog.done}/{prog.total}</span>
        </div>
      </Card>

      <div className="grid g2">
        <Card title="STUDY TIME TODAY" right={<span className="mono small muted">{fmtMin(minsToday)} / {fmtMin(state.settings.dailyFullMin)}</span>}>
          <PBar pct={minsToday / state.settings.dailyFullMin * 100} green={minsToday >= state.settings.dailyFullMin} />
          {sessions.length === 0
            ? <div className="small faint" style={{ marginTop: 10 }}>No sessions logged yet. Use the timer or log time manually.</div>
            : <div className="col" style={{ gap: 4, marginTop: 12 }}>
                {sessions.map((x) => (
                  <div key={x.id} className="row spread small">
                    <span><b>{x.subject}</b> · {x.type}{x.note ? ` · ${x.note}` : ''}</span>
                    <span className="row" style={{ gap: 6 }}>
                      <span className="mono muted">{fmtMin(x.minutes)}</span>
                      <button className="btn ghost sm" onClick={() => A.deleteSession(x.id)} aria-label="Delete session">✕</button>
                    </span>
                  </div>
                ))}
              </div>}
        </Card>

        <Card title={<span className="row" style={{ gap: 6 }}><AlertTriangle size={13} /> MISSED TASKS</span>}>
          {missedDays.length === 0
            ? <Empty title="No missed days." sub="If a day slips, the calendar stays fixed — you recover tasks here." />
            : <div className="col" style={{ gap: 6 }}>
                <div className="small muted">The schedule never shifts. Recover important tasks, skip the rest.</div>
                {missedDays.slice(-7).reverse().map((d) => <MissedDay key={d} day={d} />)}
              </div>}
        </Card>
      </div>

      {modal === 'extra' && <Modal title="Add task for today" onClose={() => setModal(null)}><ExtraTaskForm dateStr={now} onDone={() => setModal(null)} /></Modal>}
      {modal === 'session' && <Modal title="Log study time" onClose={() => setModal(null)}><SessionForm onDone={() => setModal(null)} /></Modal>}
    </div>
  );
}

export function MissedDay({ day }) {
  const { state, A, D, now, start } = useStore();
  const [open, setOpen] = useState(false);
  const plan = PLAN[day - 1];
  const pending = plan.tasks.filter((t) => !D.dayTaskStatus(day, t.id));
  const ds = state.dayState[day];
  const nextLight = MOCK_DAY_LIST.find((d) => d > day && dayToDate(start, d) >= now);

  const recover = (t, mode) => {
    if (mode === 'today') {
      A.addExtra(now, { subject: t.subject, title: t.title, kind: t.kind, est: t.est, fromDay: day });
      A.setTask(day, t.id, 'moved');
    } else if (mode === 'light') {
      const target = nextLight ? dayToDate(start, nextLight) : now;
      A.addExtra(target, { subject: t.subject, title: t.title, kind: t.kind, est: t.est, fromDay: day });
      A.setTask(day, t.id, 'moved');
    } else {
      A.setTask(day, t.id, 'skipped');
    }
  };

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px' }}>
      <button className="row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setOpen(!open)}>
        <span className="dot miss" />
        <b className="small">Day {day} · {prettyDate(dayToDate(start, day))}</b>
        <span className="small faint" style={{ marginLeft: 'auto' }}>{pending.length} pending {open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="col" style={{ gap: 6, marginTop: 8 }}>
          {!ds?.missed && <button className="btn sm" onClick={() => A.markDayMissed(day)}>Mark day as missed</button>}
          {pending.map((t) => (
            <div key={t.id} className="row wrap" style={{ gap: 6, padding: '6px 8px', background: 'var(--card2)', borderRadius: 6 }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div className={`t-sub sub-${t.subject}`}>{t.subject}</div>
                <div className="small" style={{ fontWeight: 600 }}>{t.title}</div>
              </div>
              <button className="btn sm" onClick={() => recover(t, 'today')}>Do today</button>
              <button className="btn sm" onClick={() => recover(t, 'light')} title={nextLight ? `Adds to Day ${nextLight} (mock day — lighter load)` : 'Adds to today'}>Light slot</button>
              <button className="btn ghost sm" onClick={() => recover(t, 'skip')}>Skip</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
