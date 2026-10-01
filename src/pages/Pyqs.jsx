import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { Card, PBar, Modal, Stat } from '../components/ui.jsx';
import { CHAPTERS, SUBJECTS } from '../plan.js';
import { PyqForm } from '../components/forms.jsx';
import { Plus } from 'lucide-react';

export default function Pyqs() {
  const { D, setRoute } = useStore();
  const [modal, setModal] = useState(false);
  const [sub, setSub] = useState('All');
  const list = CHAPTERS.filter((c) => sub === 'All' || c.subject === sub);

  const totals = { target: 0, att: 0, cor: 0, time: 0 };
  CHAPTERS.forEach((c) => {
    const cs = D.chState(c.id);
    totals.target += c.pyqTarget; totals.att += cs.pyqAttempted || 0; totals.cor += cs.pyqCorrect || 0; totals.time += cs.pyqTimeMin || 0;
  });
  const acc = totals.att ? Math.round(totals.cor / totals.att * 1000) / 10 : null;

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row spread wrap">
        <div>
          <div className="h1">PYQ Tracker</div>
          <div className="small muted">Timed previous-year questions, chapter by chapter.</div>
        </div>
        <button className="btn primary" onClick={() => setModal(true)}><Plus size={14} /> Log PYQ session</button>
      </div>

      <Card className="tight">
        <div className="row" style={{ gap: 26, flexWrap: 'wrap' }}>
          <Stat v={`${totals.att}`} k={`Attempted / ${totals.target}`} />
          <Stat v={totals.cor} k="Correct" />
          <Stat v={totals.att - totals.cor} k="Wrong" />
          <Stat v={acc !== null ? `${acc}%` : '—'} k="Accuracy" />
          <Stat v={totals.att && totals.time ? `${Math.round(totals.time / totals.att * 10) / 10}m` : '—'} k="Avg time / Q" />
          <div style={{ flex: 1, minWidth: 140, alignSelf: 'center' }}><PBar pct={totals.att / totals.target * 100} /></div>
        </div>
      </Card>

      <div className="seg" style={{ alignSelf: 'flex-start' }}>
        {['All', ...SUBJECTS].map((s) => <button key={s} className={sub === s ? 'on' : ''} onClick={() => setSub(s)}>{s === 'Mathematics' ? 'Maths' : s}</button>)}
      </div>

      <Card className="tight" style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Chapter</th><th>Target</th><th>Attempted</th><th>Correct</th><th>Wrong</th><th>Accuracy</th><th className="hide-m">Avg time</th><th style={{ width: 120 }}>Coverage</th></tr></thead>
          <tbody>
            {list.map((c) => {
              const cs = D.chState(c.id);
              const att = cs.pyqAttempted || 0, cor = cs.pyqCorrect || 0;
              const a = att ? Math.round(cor / att * 1000) / 10 : null;
              return (
                <tr key={c.id} className="click" onClick={() => setRoute({ page: 'chapter', id: c.id })}>
                  <td><span className={`t-sub sub-${c.subject}`} style={{ marginRight: 8 }}>{c.subject.slice(0, 4)}</span><b>{c.name}</b></td>
                  <td className="num">{c.pyqTarget}</td>
                  <td className="num">{att || '—'}</td>
                  <td className="num">{att ? cor : '—'}</td>
                  <td className="num">{att ? att - cor : '—'}</td>
                  <td className="num" style={a !== null && a < 60 ? { color: 'var(--red)' } : null}>{a !== null ? `${a}%` : '—'}</td>
                  <td className="num hide-m">{att && cs.pyqTimeMin ? `${Math.round(cs.pyqTimeMin / att * 10) / 10}m` : '—'}</td>
                  <td><PBar pct={att / c.pyqTarget * 100} green={att >= c.pyqTarget} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {modal && <Modal title="Log PYQ session" onClose={() => setModal(false)}><PyqForm onDone={() => setModal(false)} /></Modal>}
    </div>
  );
}
