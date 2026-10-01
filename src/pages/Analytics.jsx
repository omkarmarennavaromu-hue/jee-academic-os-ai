import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { Card, Stat, LineChart, Empty, fmtMin, Modal } from '../components/ui.jsx';
import { CHAPTERS, chaptersOf, SUBJECTS, prettyDate, shortDate } from '../plan.js';
import { SessionForm } from '../components/forms.jsx';
import { Plus } from 'lucide-react';

export default function Analytics() {
  const { state, A, D } = useStore();
  const [modal, setModal] = useState(false);
  const mocks = state.mocks;

  // overall
  const completed = CHAPTERS.filter((c) => D.chState(c.id).completedOn).length;
  const pyqTot = CHAPTERS.reduce((a, c) => a + c.pyqTarget, 0);
  const pyqAtt = CHAPTERS.reduce((a, c) => a + (D.chState(c.id).pyqAttempted || 0), 0);
  const revTot = state.revisions.length;
  const revDone = state.revisions.filter((r) => r.done).length;
  const avgMock = mocks.length ? Math.round(mocks.reduce((a, m) => a + m.total, 0) / mocks.length) : null;
  const bestMock = mocks.length ? Math.max(...mocks.map((m) => m.total)) : null;
  const recentMock = mocks.length ? mocks[mocks.length - 1].total : null;

  // study log grouped by date
  const byDate = {};
  state.sessions.forEach((s) => { (byDate[s.date] = byDate[s.date] || []).push(s); });
  const dates = Object.keys(byDate).sort().reverse().slice(0, 14);

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="h1">Analytics</div>

      <Card title="OVERALL">
        <div className="row" style={{ gap: 28, flexWrap: 'wrap' }}>
          <Stat v={`${Math.round(completed / 46 * 100)}%`} k={`Syllabus · ${completed}/46 ch`} />
          <Stat v={`${Math.round(pyqAtt / pyqTot * 100)}%`} k={`PYQs · ${pyqAtt}/${pyqTot}`} />
          <Stat v={revTot ? `${Math.round(revDone / revTot * 100)}%` : '—'} k={`Revision · ${revDone}/${revTot}`} />
          <Stat v={mocks.length} k="Mocks taken" />
          <Stat v={avgMock ?? '—'} k="Avg mock" />
          <Stat v={bestMock ?? '—'} k="Best mock" />
          <Stat v={recentMock ?? '—'} k="Recent mock" />
        </div>
      </Card>

      <Card title="MOCK SCORE TREND">
        <LineChart points={mocks.map((m) => m.total)} labels={mocks.map((m) => shortDate(m.date))} />
      </Card>

      <div className="grid g3">
        {SUBJECTS.map((sub) => {
          const chs = chaptersOf(sub);
          const done = chs.filter((c) => D.chState(c.id).completedOn).length;
          const att = chs.reduce((a, c) => a + (D.chState(c.id).pyqAttempted || 0), 0);
          const cor = chs.reduce((a, c) => a + (D.chState(c.id).pyqCorrect || 0), 0);
          const acc = att ? Math.round(cor / att * 1000) / 10 : null;
          const key = sub === 'Physics' ? 'phy' : sub === 'Chemistry' ? 'chem' : 'math';
          const mockAvg = mocks.length ? Math.round(mocks.reduce((a, m) => a + (m[key] || 0), 0) / mocks.length) : null;
          return (
            <Card key={sub} title={sub.toUpperCase()}>
              <div className="grid g2" style={{ gap: 10 }}>
                <Stat v={`${done}/${chs.length}`} k="Chapters" />
                <Stat v={acc !== null ? `${acc}%` : '—'} k="PYQ accuracy" />
                <Stat v={att} k="PYQs done" />
                <Stat v={mockAvg ?? '—'} k="Avg mock /100" />
              </div>
            </Card>
          );
        })}
      </div>

      <Card title="STUDY LOG" right={<button className="btn sm" onClick={() => setModal(true)}><Plus size={12} /> Add entry</button>}>
        {dates.length === 0
          ? <Empty title="No study sessions logged." sub="Use the focus timer or log time manually — it all lands here." />
          : <div className="col" style={{ gap: 10 }}>
              {dates.map((d) => {
                const items = byDate[d];
                const total = items.reduce((a, s) => a + s.minutes, 0);
                return (
                  <div key={d}>
                    <div className="row spread small" style={{ fontWeight: 700 }}>
                      <span>{prettyDate(d)}</span><span className="mono">{fmtMin(total)}</span>
                    </div>
                    <div className="col" style={{ gap: 2, marginTop: 3 }}>
                      {items.map((s) => (
                        <div key={s.id} className="row spread small muted" style={{ paddingLeft: 10 }}>
                          <span>{s.subject} — {s.type}{s.note ? ` · ${s.note}` : ''}</span>
                          <span className="row" style={{ gap: 6 }}>
                            <span className="mono">{fmtMin(s.minutes)}</span>
                            <button className="btn ghost sm" onClick={() => A.deleteSession(s.id)} aria-label="Delete">✕</button>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>}
      </Card>

      {modal && <Modal title="Log study time" onClose={() => setModal(false)}><SessionForm onDone={() => setModal(false)} /></Modal>}
    </div>
  );
}
