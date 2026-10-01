import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store.jsx';
import { Card, Modal, Dot, PBar, fmtMin, Field, Empty } from '../components/ui.jsx';
import { TaskRow, ExtraRow } from '../components/TaskRow.jsx';
import { PLAN, TOTAL_DAYS, PHASES, phaseOf, dayToDate, prettyDate, shortDate, weekdayName, chapterById } from '../plan.js';
import { MissedDay } from './Today.jsx';

export default function Plan() {
  const { state, D, setRoute, start, currentDay, route } = useStore();
  const [tab, setTab] = useState('timeline');
  const [openDay, setOpenDay] = useState(route.day || null);
  const todayRef = useRef(null);
  useEffect(() => { if (tab === 'timeline') todayRef.current?.scrollIntoView({ block: 'center' }); }, [tab]);

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row spread wrap">
        <div>
          <div className="h1">111-Day Plan</div>
          <div className="small muted">{prettyDate(start)} → {prettyDate(dayToDate(start, TOTAL_DAYS))} · fixed calendar, no auto-shifting</div>
        </div>
        <div className="seg">
          <button className={tab === 'timeline' ? 'on' : ''} onClick={() => setTab('timeline')}>Timeline</button>
          <button className={tab === 'weeks' ? 'on' : ''} onClick={() => setTab('weeks')}>Weeks</button>
        </div>
      </div>

      {tab === 'timeline' ? (
        <div className="col" style={{ gap: 20 }}>
          {PHASES.map((p) => (
            <div key={p.n}>
              <div className="row" style={{ marginBottom: 10 }}>
                <span className="tag accent">PHASE {p.n}</span>
                <b>{p.name}</b>
                <span className="small muted">Days {p.from}–{p.to} · {p.desc}</span>
              </div>
              <div className="col" style={{ gap: 6 }}>
                {PLAN.slice(p.from - 1, p.to).map((d) => {
                  const status = D.dayStatus(d.n);
                  const isToday = d.n === currentDay;
                  return (
                    <div key={d.n} ref={isToday ? todayRef : null}
                      className={`day-row ${isToday ? 'today' : ''}`}
                      onClick={() => setOpenDay(d.n)}>
                      <div className="day-num">
                        <div className="dn">DAY {String(d.n).padStart(2, '0')}</div>
                        <div className="dd">{shortDate(dayToDate(start, d.n))}</div>
                      </div>
                      <Dot status={isToday ? 'today' : status === 'past' ? 'miss' : status === 'done' ? 'done' : status === 'part' ? 'part' : status === 'miss' ? 'miss' : 'none'} />
                      <div style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
                        {d.tasks.map((t) => (
                          <span key={t.id} style={{ marginRight: 14, whiteSpace: 'nowrap', display: 'inline-block' }}>
                            <span className={`t-sub sub-${t.subject}`} style={{ fontSize: 9.5 }}>{t.subject === 'General' ? t.kind : t.subject.slice(0, 4)}</span>
                            <span className="muted"> {t.title.length > 42 ? t.title.slice(0, 40) + '…' : t.title}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : <Weeks />}

      {openDay && <DayModal day={openDay} onClose={() => setOpenDay(null)} />}
    </div>
  );
}

function DayModal({ day, onClose }) {
  const { state, A, D, setRoute, start, currentDay, now } = useStore();
  const plan = PLAN[day - 1];
  const dateStr = dayToDate(start, day);
  const extras = state.extras[dateStr] || [];
  const prog = D.dayProgress(day);
  const ds = state.dayState[day];
  const isPast = day < currentDay;
  const pendingPast = isPast && prog.resolved < prog.total;
  return (
    <Modal title={`Day ${day} — ${weekdayName(dateStr)}, ${prettyDate(dateStr)}`} onClose={onClose} wide>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="tag accent">Phase {plan.phase} — {phaseOf(day).name}</span>
        <span className="tag">Week {plan.week}</span>
        {ds?.missed && <span className="tag red">Marked missed</span>}
        <span className="small muted" style={{ marginLeft: 'auto' }}>{prog.done}/{prog.total} done</span>
      </div>
      <div className="col" style={{ gap: 8 }}>
        {plan.tasks.map((t) => <TaskRow key={t.id} task={t} day={day} onOpenChapter={(id) => { onClose(); setRoute({ page: 'chapter', id }); }} />)}
        {extras.map((t) => <ExtraRow key={t.id} task={t} dateStr={dateStr} />)}
      </div>
      {pendingPast && (
        <div style={{ marginTop: 14 }}>
          <div className="divider" />
          <div className="small muted" style={{ marginBottom: 8 }}>This day is in the past with unfinished tasks. The calendar does not shift — recover or skip:</div>
          <MissedDay day={day} />
        </div>
      )}
    </Modal>
  );
}

function Weeks() {
  const { state, A, D, start, currentDay } = useStore();
  const weeks = [];
  for (let w = 1; w <= Math.ceil(TOTAL_DAYS / 7); w++) {
    weeks.push({ w, days: PLAN.filter((d) => d.week === w).map((d) => d.n) });
  }
  const curWeek = Math.ceil(Math.min(Math.max(currentDay, 1), TOTAL_DAYS) / 7);
  const [sel, setSel] = useState(curWeek);
  const wk = weeks[sel - 1];
  const rv = state.weekReviews[sel] || {};

  // aggregates
  let mins = 0, pyqs = 0, chaptersDone = 0, mocksDone = 0;
  wk.days.forEach((n) => {
    const ds = dayToDate(start, n);
    mins += D.minutesOn(ds);
  });
  const wkDates = wk.days.map((n) => dayToDate(start, n));
  state.mocks.forEach((m) => { if (wkDates.includes(m.date)) mocksDone++; });
  Object.entries(state.chapters).forEach(([cid, cs]) => { if (cs.completedOn && wkDates.includes(cs.completedOn)) chaptersDone++; });

  const WD = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row wrap">
        {weeks.map((x) => (
          <button key={x.w} className={`btn sm ${x.w === sel ? 'primary' : ''}`} onClick={() => setSel(x.w)}>W{x.w}</button>
        ))}
      </div>
      <Card title={`WEEK ${sel} · DAYS ${wk.days[0]}–${wk.days[wk.days.length - 1]}`}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${wk.days.length}, 1fr)`, gap: 8 }}>
          {wk.days.map((n, i) => {
            const ds = dayToDate(start, n);
            const p = D.dayProgress(n);
            const m = D.minutesOn(ds);
            const isMock = PLAN[n - 1].tasks.some((t) => t.kind === 'Mock');
            return (
              <div key={n} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '8px 9px', background: n === currentDay ? 'var(--accent-soft)' : 'var(--card2)' }}>
                <div className="small faint" style={{ fontWeight: 700 }}>{weekdayName(ds).slice(0, 3)}</div>
                <div className="mono small" style={{ fontWeight: 700 }}>D{n}</div>
                <PBar pct={p.pct} green={p.pct === 100} style={{ margin: '6px 0' }} />
                <div className="small faint">{p.pct}% · {fmtMin(m)}</div>
                {isMock && <span className="tag yellow" style={{ marginTop: 4 }}>Mock</span>}
              </div>
            );
          })}
        </div>
      </Card>
      <Card title="WEEK REVIEW">
        <div className="grid g4" style={{ marginBottom: 14 }}>
          <div className="stat"><div className="v">{fmtMin(mins)}</div><div className="k">Hours</div></div>
          <div className="stat"><div className="v">{chaptersDone}</div><div className="k">Chapters done</div></div>
          <div className="stat"><div className="v">{mocksDone}</div><div className="k">Mocks</div></div>
          <div className="stat"><div className="v">{wk.days.filter((n) => D.dayStatus(n) === 'done').length}/{wk.days.length}</div><div className="k">Days complete</div></div>
        </div>
        <div className="grid g3">
          <Field label="Weakest subject"><input className="input" value={rv.weakest || ''} onChange={(e) => A.saveWeekReview(sel, { weakest: e.target.value })} placeholder="e.g. Maths" /></Field>
          <Field label="Biggest leak"><input className="input" value={rv.leak || ''} onChange={(e) => A.saveWeekReview(sel, { leak: e.target.value })} placeholder="e.g. silly calc errors" /></Field>
          <Field label="Next week's priority"><input className="input" value={rv.priority || ''} onChange={(e) => A.saveWeekReview(sel, { priority: e.target.value })} placeholder="e.g. finish Conics PYQs" /></Field>
        </div>
      </Card>
    </div>
  );
}
