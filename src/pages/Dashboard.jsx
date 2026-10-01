import React from 'react';
import { useStore } from '../store.jsx';
import { Card, PBar, Stat, Empty, fmtMin } from '../components/ui.jsx';
import { TaskRow, RevisionRow, ExtraRow } from '../components/TaskRow.jsx';
import { PLAN, TOTAL_DAYS, PHASES, phaseOf, dayToDate, prettyDate, weekdayName, chapterById } from '../plan.js';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { state, D, setRoute, now, start, currentDay, daysRemaining } = useStore();
  const s = state.settings;
  const beforeStart = currentDay < 1;
  const afterEnd = currentDay > TOTAL_DAYS;
  const dayN = Math.min(Math.max(currentDay, 1), TOTAL_DAYS);
  const plan = PLAN[dayN - 1];
  const phase = phaseOf(dayN);
  const prog = D.dayProgress(dayN);
  const due = D.dueRevisions(now);
  const missed = D.missedDays().filter((d) => d !== dayN);
  const weak = D.weaknesses();
  const lastMock = state.mocks[state.mocks.length - 1];
  const minsToday = D.minutesOn(now);
  const target = s.dailyFullMin;
  const extras = (state.extras[now] || []);
  const openChapter = (id) => setRoute({ page: 'chapter', id });

  return (
    <div className="col" style={{ gap: 16 }}>
      {/* HEADER */}
      <div className="row spread wrap">
        <div>
          <div className="small muted" style={{ letterSpacing: '.14em', fontWeight: 700 }}>JEE MAIN 2027 — JANUARY ATTEMPT</div>
          <div className="h1" style={{ marginTop: 2 }}>
            {beforeStart ? `Plan starts in ${1 - currentDay} day${1 - currentDay === 1 ? '' : 's'}`
              : afterEnd ? 'Plan complete'
              : <>Day {dayN} <span className="muted" style={{ fontWeight: 400 }}>/ {TOTAL_DAYS}</span></>}
          </div>
          <div className="small muted">{prettyDate(dayToDate(start, dayN))}{!beforeStart && !afterEnd && ` · ${daysRemaining} days remaining`}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="small muted" style={{ fontWeight: 600 }}>OVERALL PROGRESS</div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 700 }}>{D.overallProgress()}%</div>
        </div>
      </div>

      {/* PHASE STRIP */}
      <div className="phase-strip hide-m">
        {PHASES.map((p) => (
          <div key={p.n} className={`p ${p.n === phase.n && !beforeStart && !afterEnd ? 'on' : ''}`}>
            <div className="pn">PHASE {p.n} · D{p.from}–{p.to}</div>
            <div className="pt">{p.name}</div>
          </div>
        ))}
      </div>
      <div className="hide-d">
        <span className="tag accent">Phase {phase.n} — {phase.name}</span>
      </div>

      {missed.length > 0 && (
        <button className="card tight row" style={{ borderColor: 'var(--red)', textAlign: 'left', width: '100%' }} onClick={() => setRoute({ page: 'today', tab: 'missed' })}>
          <AlertTriangle size={16} color="var(--red)" />
          <div style={{ flex: 1 }}>
            <b>{missed.length} day{missed.length > 1 ? 's' : ''} with unfinished tasks.</b>
            <span className="muted"> The calendar does not shift — recover what matters, skip the rest.</span>
          </div>
          <ArrowRight size={15} className="muted" />
        </button>
      )}

      {/* TODAY */}
      <Card
        title={beforeStart ? `PREVIEW — DAY 1 · ${weekdayName(dayToDate(start, 1))} ${prettyDate(dayToDate(start, 1))}` : `TODAY — ${weekdayName(now)}, ${prettyDate(now)}`}
        right={<button className="btn ghost sm" onClick={() => setRoute({ page: 'today' })}>Open Today →</button>}
      >
        <div className="col" style={{ gap: 8 }}>
          {plan.tasks.map((t) => <TaskRow key={t.id} task={t} day={dayN} onOpenChapter={openChapter} />)}
          {extras.map((t) => <ExtraRow key={t.id} task={t} dateStr={now} />)}
        </div>
        {/* today's progress */}
        <div className="row" style={{ marginTop: 14, gap: 16 }}>
          <div style={{ flex: 1 }}><PBar pct={prog.pct} green={prog.pct === 100} /></div>
          <span className="small mono muted">{prog.done} / {prog.total} tasks</span>
          <span className="small mono muted hide-m">{fmtMin(minsToday)} / {fmtMin(target)} studied</span>
        </div>
      </Card>

      {/* DUE REVISIONS */}
      <Card title="SPACED RECALL — DUE" right={due.length > 0 && <button className="btn ghost sm" onClick={() => setRoute({ page: 'revision' })}>All revision →</button>}>
        {due.length === 0
          ? <Empty title="Nothing due today." sub="Revisions appear +2, +10 and +30 days after you complete a chapter." />
          : <div className="col" style={{ gap: 8 }}>{due.slice(0, 5).map((r) => <RevisionRow key={r.id} rev={r} onOpenChapter={openChapter} />)}
              {due.length > 5 && <button className="btn ghost sm" onClick={() => setRoute({ page: 'revision' })}>+{due.length - 5} more due</button>}
            </div>}
      </Card>

      <div className="grid g2">
        {/* WEAKNESSES */}
        <Card title="CURRENT WEAKNESSES">
          {weak.length === 0
            ? <Empty title="No weak areas detected yet." sub="Built from mock Bucket 4, PYQ accuracy and unresolved errors." />
            : <div className="col" style={{ gap: 6 }}>
                {weak.slice(0, 5).map((w, i) => (
                  <button key={w.chapter.id} className="row" style={{ textAlign: 'left', padding: '6px 4px', borderRadius: 6 }} onClick={() => openChapter(w.chapter.id)}>
                    <span className="mono faint small">{i + 1}.</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{w.chapter.subject} — {w.chapter.name}</div>
                      <div className="small faint">{w.reasons.join(' · ')}</div>
                    </div>
                  </button>
                ))}
              </div>}
        </Card>

        {/* RECENT MOCK */}
        <Card title="RECENT MOCK" right={<button className="btn ghost sm" onClick={() => setRoute({ page: 'mocks' })}>Mocks →</button>}>
          {!lastMock
            ? <Empty title="No mocks yet." sub={`First mock lands on Day 42 (${shortP(start, 42)}).`} />
            : <div>
                <div className="row spread">
                  <div><div style={{ fontWeight: 700 }}>{lastMock.name}</div><div className="small muted">{prettyDate(lastMock.date)}</div></div>
                  <div className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{lastMock.total}<span className="muted small"> / 300</span></div>
                </div>
                <div className="row" style={{ gap: 18, marginTop: 10 }}>
                  <Stat v={lastMock.phy} k="Physics" /><Stat v={lastMock.chem} k="Chemistry" /><Stat v={lastMock.math} k="Maths" />
                  {lastMock.over4 > 0 && <Stat v={lastMock.over4} k="Over 4 min" color="var(--yellow)" />}
                </div>
              </div>}
        </Card>
      </div>
    </div>
  );
}

function shortP(start, day) { return prettyDate(dayToDate(start, day)); }
