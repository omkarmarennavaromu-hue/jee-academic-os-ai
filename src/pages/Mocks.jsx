import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { Card, Modal, Empty, Stat, Field, PBar } from '../components/ui.jsx';
import { CHAPTERS, chapterById, todayStr, prettyDate, MOCK_DAY_LIST, dayToDate, shortDate } from '../plan.js';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

const BUCKETS = [
  ['b1', 'Bucket 1', 'Knew it + got it right', 'var(--green)'],
  ['b2', 'Bucket 2', 'Knew it + got it wrong', 'var(--red)'],
  ['b3', 'Bucket 3', "Didn't know + guessed right", 'var(--yellow)'],
  ['b4', 'Bucket 4', "Didn't know", 'var(--muted)'],
];

export default function Mocks() {
  const { state, A, D, setRoute, start, now } = useStore();
  const [modal, setModal] = useState(false);
  const [sel, setSel] = useState(null);
  const mocks = state.mocks;
  const selected = mocks.find((m) => m.id === sel) || mocks[mocks.length - 1];
  const upcoming = MOCK_DAY_LIST.map((d) => ({ d, date: dayToDate(start, d) })).filter((x) => x.date >= now).slice(0, 4);

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row spread wrap">
        <div>
          <div className="h1">Mocks</div>
          <div className="small muted">{mocks.length} recorded · planned slots: {MOCK_DAY_LIST.map((d) => `D${d}`).join(', ')}</div>
        </div>
        <button className="btn primary" onClick={() => setModal(true)}><Plus size={14} /> Record mock</button>
      </div>

      {mocks.length === 0 ? (
        <Card>
          <Empty title="No mocks recorded." sub="Record a mock after taking it — score, buckets, and pacing. No fake data." />
          {upcoming.length > 0 && (
            <div className="row wrap" style={{ justifyContent: 'center', marginTop: 4 }}>
              {upcoming.map((x) => <span key={x.d} className="tag">Mock slot · Day {x.d} — {shortDate(x.date)}</span>)}
            </div>
          )}
        </Card>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(200px, 260px) 1fr', alignItems: 'start' }}>
          <Card className="tight">
            <div className="col" style={{ gap: 4 }}>
              {[...mocks].reverse().map((m) => (
                <button key={m.id} className="row spread" style={{ padding: '8px 10px', borderRadius: 7, background: selected?.id === m.id ? 'var(--accent-soft)' : 'transparent', textAlign: 'left' }} onClick={() => setSel(m.id)}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</div>
                    <div className="small faint">{prettyDate(m.date)}</div>
                  </div>
                  <span className="mono" style={{ fontWeight: 700 }}>{m.total}</span>
                </button>
              ))}
            </div>
          </Card>
          {selected && <MockAnalysis mock={selected} />}
        </div>
      )}

      {modal && <Modal title="Record mock" onClose={() => setModal(false)} wide><MockForm onDone={() => setModal(false)} nextNum={mocks.length + 1} /></Modal>}
    </div>
  );
}

function MockAnalysis({ mock: m }) {
  const { A, setRoute } = useStore();
  const acc = m.attempted ? Math.round(m.correct / m.attempted * 1000) / 10 : 0;
  const unatt = Math.max(0, 75 - m.attempted);
  const scores = [['Physics', m.phy], ['Chemistry', m.chem], ['Maths', m.math]];
  const weakest = scores.reduce((a, b) => b[1] < a[1] ? b : a);
  const flags = [];
  if (m.over4 >= 5) flags.push(`${m.over4} questions over 4 minutes → selection / pacing problem`);
  if (m.b2 >= 8) flags.push(`Bucket 2 is ${m.b2} — you knew these. Fix execution: rework each in the error notebook`);
  if (m.b4 >= 20) flags.push(`Bucket 4 is ${m.b4} — coverage gap. Feed these chapters into revision`);
  if (m.b3 >= 6) flags.push(`Bucket 3 is ${m.b3} — lucky guesses inflate the score. Treat them as unknown`);

  return (
    <div className="col" style={{ gap: 14 }}>
      <Card>
        <div className="row spread wrap">
          <div>
            <div className="h2">{m.name}</div>
            <div className="small muted">{prettyDate(m.date)}</div>
          </div>
          <div className="mono" style={{ fontSize: 32, fontWeight: 700 }}>{m.total}<span className="muted" style={{ fontSize: 15 }}> / 300</span></div>
        </div>
        <div className="row" style={{ gap: 26, marginTop: 14, flexWrap: 'wrap' }}>
          {scores.map(([k, v]) => <Stat key={k} v={v} k={k} color={k === weakest[0] ? 'var(--red)' : undefined} />)}
          <Stat v={m.attempted} k="Attempted" />
          <Stat v={m.correct} k="Correct" />
          <Stat v={m.attempted - m.correct} k="Incorrect" />
          <Stat v={unatt} k="Unattempted" />
          <Stat v={`${acc}%`} k="Accuracy" />
        </div>
      </Card>

      <Card title="FOUR-BUCKET ANALYSIS">
        <div className="grid g4">
          {BUCKETS.map(([key, name, desc, color]) => (
            <div key={key} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
              <div className="mono" style={{ fontSize: 22, fontWeight: 700, color }}>{m[key] ?? 0}</div>
              <div className="small" style={{ fontWeight: 700 }}>{name}</div>
              <div className="small faint">{desc}</div>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12, gap: 10, flexWrap: 'wrap' }}>
          <span className={`tag ${m.over4 >= 5 ? 'red' : ''}`}>{m.over4 ?? 0} questions over 4 minutes</span>
          {m.timeIssues && <span className="small muted">Time notes: {m.timeIssues}</span>}
        </div>
      </Card>

      <Card title="WHAT TO FIX">
        {flags.length === 0 && (!m.problemChapters || m.problemChapters.length === 0)
          ? <Empty title="No red flags detected in this mock." sub="Weakest subject and problem chapters still feed the weakness engine." />
          : <div className="col" style={{ gap: 8 }}>
              <div className="row small"><span className="tag red">Weakest subject</span><b>{weakest[0]} — {weakest[1]} marks</b></div>
              {flags.map((f, i) => (
                <div key={i} className="row small" style={{ gap: 8 }}>
                  <AlertTriangle size={13} color="var(--yellow)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{f}</span>
                </div>
              ))}
              {m.problemChapters?.length > 0 && (
                <div className="row wrap small" style={{ gap: 6 }}>
                  <span className="faint">Problem chapters:</span>
                  {m.problemChapters.map((cid) => chapterById[cid] && (
                    <button key={cid} className="tag yellow" onClick={() => setRoute({ page: 'chapter', id: cid })}>{chapterById[cid].name}</button>
                  ))}
                </div>
              )}
            </div>}
      </Card>

      <button className="btn ghost sm" style={{ alignSelf: 'flex-end', color: 'var(--red)' }} onClick={() => { if (confirm(`Delete ${m.name}?`)) A.deleteMock(m.id); }}>
        <Trash2 size={12} /> Delete mock
      </button>
    </div>
  );
}

function MockForm({ onDone, nextNum }) {
  const { A } = useStore();
  const [f, setF] = useState({
    name: `Mock ${String(nextNum).padStart(2, '0')}`, date: todayStr(),
    phy: '', chem: '', math: '', attempted: '', correct: '',
    b1: '', b2: '', b3: '', b4: '', over4: '', timeIssues: '', problemChapters: [],
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const num = (v) => +v || 0;
  const total = num(f.phy) + num(f.chem) + num(f.math);
  const toggleCh = (cid) => setF({ ...f, problemChapters: f.problemChapters.includes(cid) ? f.problemChapters.filter((x) => x !== cid) : [...f.problemChapters, cid] });
  const valid = f.name && num(f.attempted) > 0 && num(f.correct) <= num(f.attempted) && num(f.attempted) <= 75;
  const submit = () => {
    if (!valid) return;
    A.addMock({
      name: f.name, date: f.date, total, phy: num(f.phy), chem: num(f.chem), math: num(f.math),
      attempted: num(f.attempted), correct: num(f.correct),
      b1: num(f.b1), b2: num(f.b2), b3: num(f.b3), b4: num(f.b4), over4: num(f.over4),
      timeIssues: f.timeIssues, problemChapters: f.problemChapters,
    });
    onDone();
  };
  return (
    <div>
      <div className="grid g3">
        <Field label="Name"><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="Date"><input type="date" className="input" value={f.date} onChange={set('date')} /></Field>
        <Field label="Total (auto)"><input className="input" value={`${total} / 300`} disabled /></Field>
        <Field label="Physics /100"><input type="number" className="input" value={f.phy} onChange={set('phy')} /></Field>
        <Field label="Chemistry /100"><input type="number" className="input" value={f.chem} onChange={set('chem')} /></Field>
        <Field label="Maths /100"><input type="number" className="input" value={f.math} onChange={set('math')} /></Field>
        <Field label="Attempted /75"><input type="number" className="input" value={f.attempted} onChange={set('attempted')} /></Field>
        <Field label="Correct"><input type="number" className="input" value={f.correct} onChange={set('correct')} /></Field>
        <Field label="Over 4 minutes"><input type="number" className="input" value={f.over4} onChange={set('over4')} /></Field>
      </div>
      <div className="label" style={{ marginTop: 4 }}>FOUR BUCKETS (question counts)</div>
      <div className="grid g4">
        {BUCKETS.map(([key, name, desc]) => (
          <Field key={key} label={`${name} — ${desc}`}><input type="number" className="input" value={f[key]} onChange={set(key)} /></Field>
        ))}
      </div>
      <Field label="Time issues (notes)"><input className="input" value={f.timeIssues} onChange={set('timeIssues')} placeholder="e.g. spent 22 min on 3 maths questions" /></Field>
      <Field label="Problem chapters (tap to flag — feeds the weakness engine)">
        <div className="row wrap" style={{ gap: 5, maxHeight: 150, overflowY: 'auto' }}>
          {CHAPTERS.map((c) => (
            <button key={c.id} className={`tag ${f.problemChapters.includes(c.id) ? 'red' : ''}`} onClick={() => toggleCh(c.id)}>{c.name}</button>
          ))}
        </div>
      </Field>
      <button className="btn primary" onClick={submit} disabled={!valid}>Save mock</button>
      {!valid && num(f.attempted) > 0 && <span className="small faint" style={{ marginLeft: 10 }}>Check: correct ≤ attempted ≤ 75</span>}
    </div>
  );
}
