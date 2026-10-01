import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { Card, PBar, StatusTag, CheckBox, Modal, Empty, fmtMin, Field } from '../components/ui.jsx';
import { CHAPTERS, chaptersOf, SUBJECTS, chapterById, chapterPlanInfo, dayToDate, prettyDate, REVISION_LABELS, CHAPTER_STATUSES } from '../plan.js';
import { PyqForm, ErrorForm } from '../components/forms.jsx';
import { ArrowLeft, Plus } from 'lucide-react';

export function Subjects() {
  const { D, setRoute } = useStore();
  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="h1">Subjects</div>
      <div className="grid g3">
        {SUBJECTS.map((sub) => {
          const chs = chaptersOf(sub);
          const avg = Math.round(chs.reduce((a, c) => a + D.chapterProgress(c.id), 0) / chs.length);
          const mastered = chs.filter((c) => ['MASTERED'].includes(D.chapterStatus(c.id))).length;
          return (
            <Card key={sub} title={sub.toUpperCase()} right={<span className="mono">{avg}%</span>}>
              <PBar pct={avg} />
              <div className="small muted" style={{ margin: '10px 0 12px' }}>{chs.length} chapters · {mastered} mastered</div>
              <div className="col" style={{ gap: 4 }}>
                {chs.map((c) => (
                  <button key={c.id} className="row spread" style={{ textAlign: 'left', padding: '6px 8px', borderRadius: 6 }}
                    onClick={() => setRoute({ page: 'chapter', id: c.id })}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                    <span className="small" style={{ fontWeight: 600 }}>{c.name}</span>
                    <span className="row" style={{ gap: 8 }}>
                      <span className="tag" style={{ fontSize: 10 }}>T{c.tier}</span>
                      <span className="mono small muted" style={{ width: 38, textAlign: 'right' }}>{D.chapterProgress(c.id)}%</span>
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function ChaptersPage() {
  const { D, setRoute, state } = useStore();
  const [sub, setSub] = useState('All');
  const [tier, setTier] = useState(0);
  const list = CHAPTERS.filter((c) => (sub === 'All' || c.subject === sub) && (!tier || c.tier === tier));
  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row spread wrap">
        <div className="h1">Chapters <span className="muted" style={{ fontSize: 15, fontWeight: 400 }}>46 total</span></div>
        <div className="row">
          <div className="seg">{['All', ...SUBJECTS].map((s) => <button key={s} className={sub === s ? 'on' : ''} onClick={() => setSub(s)}>{s === 'Mathematics' ? 'Maths' : s}</button>)}</div>
          <div className="seg">{[[0, 'All'], [1, 'Tier 1'], [2, 'Tier 2']].map(([v, l]) => <button key={v} className={tier === v ? 'on' : ''} onClick={() => setTier(v)}>{l}</button>)}</div>
        </div>
      </div>
      <Card className="tight" style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Chapter</th><th>Tier</th><th className="hide-m">Phase</th><th className="hide-m">Planned</th><th>Status</th><th style={{ width: 130 }}>Progress</th><th className="hide-m">PYQs</th><th className="hide-m">Acc.</th><th className="hide-m">Errors</th></tr></thead>
          <tbody>
            {list.map((c) => {
              const cs = D.chState(c.id);
              const info = chapterPlanInfo(c.id);
              const att = cs.pyqAttempted || 0;
              const acc = att ? Math.round((cs.pyqCorrect || 0) / att * 1000) / 10 : null;
              const errs = D.chapterErrors(c.id).filter((e) => !e.resolved).length;
              return (
                <tr key={c.id} className="click" onClick={() => setRoute({ page: 'chapter', id: c.id })}>
                  <td><span className={`t-sub sub-${c.subject}`} style={{ marginRight: 8 }}>{c.subject.slice(0, 4)}</span><b>{c.name}</b></td>
                  <td><span className={`tag ${c.tier === 1 ? 'accent' : ''}`}>T{c.tier}</span></td>
                  <td className="hide-m num">{c.tier === 1 ? 'P1' : 'P2'}</td>
                  <td className="hide-m num">D{info.firstDay}–{info.lastDay}</td>
                  <td><StatusTag status={D.chapterStatus(c.id)} /></td>
                  <td><PBar pct={D.chapterProgress(c.id)} /></td>
                  <td className="hide-m num">{att}/{c.pyqTarget}</td>
                  <td className="hide-m num">{acc !== null ? `${acc}%` : '—'}</td>
                  <td className="hide-m num" style={errs ? { color: 'var(--red)' } : null}>{errs || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function ChapterDetail({ id }) {
  const { state, A, D, setRoute, start, now } = useStore();
  const c = chapterById[id];
  const [modal, setModal] = useState(null);
  if (!c) return <Empty title="Chapter not found." />;
  const cs = D.chState(id);
  const info = chapterPlanInfo(id);
  const revs = state.revisions.filter((r) => r.chapterId === id);
  const errs = D.chapterErrors(id);
  const unresolved = errs.filter((e) => !e.resolved);
  const att = cs.pyqAttempted || 0, cor = cs.pyqCorrect || 0;
  const acc = att ? Math.round(cor / att * 1000) / 10 : null;
  const status = D.chapterStatus(id);
  const revByType = Object.fromEntries(revs.map((r) => [r.type, r]));

  return (
    <div className="col" style={{ gap: 16 }}>
      <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => setRoute({ page: 'chapters' })}><ArrowLeft size={14} /> All chapters</button>
      <div className="row spread wrap">
        <div>
          <div className={`t-sub sub-${c.subject}`}>{c.subject}</div>
          <div className="h1">{c.name}</div>
          <div className="row" style={{ marginTop: 6 }}>
            <span className={`tag ${c.tier === 1 ? 'accent' : ''}`}>Tier {c.tier}</span>
            <span className="tag">Phase {c.tier === 1 ? 1 : 2} · Days {info.firstDay}–{info.lastDay}</span>
            <span className="tag">P3 revision · Day {info.p3Day}</span>
            <StatusTag status={status} />
          </div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 160 }}>
          <div className="mono" style={{ fontSize: 26, fontWeight: 700 }}>{D.chapterProgress(id)}%</div>
          <PBar pct={D.chapterProgress(id)} style={{ marginTop: 6 }} />
        </div>
      </div>

      <div className="grid g2">
        <Card title="THEORY">
          <div className="col" style={{ gap: 10 }}>
            <label className="row" style={{ cursor: 'pointer' }}>
              <CheckBox on={!!cs.theoryDone} onChange={(v) => A.patchChapter(id, { theoryDone: v })} /> Concepts completed
            </label>
            <label className="row" style={{ cursor: 'pointer' }}>
              <CheckBox on={!!cs.notesDone} onChange={(v) => A.patchChapter(id, { notesDone: v })} /> Notes / one-page summary made
            </label>
            <div className="divider" style={{ margin: '4px 0' }} />
            {cs.completedOn
              ? <div className="row spread">
                  <span className="small muted">Completed {prettyDate(cs.completedOn)} · revision cycle active</span>
                  <button className="btn ghost sm" onClick={() => A.uncompleteChapter(id)}>Undo</button>
                </div>
              : <button className="btn primary sm" onClick={() => A.completeChapter(id)}>Mark chapter complete → schedule +2 / +10 / +30 recall</button>}
          </div>
        </Card>

        <Card title="PYQs" right={<button className="btn sm" onClick={() => setModal('pyq')}><Plus size={12} /> Log session</button>}>
          <div className="row" style={{ gap: 20 }}>
            <div className="stat"><div className="v">{att}<span className="muted" style={{ fontSize: 13 }}>/{c.pyqTarget}</span></div><div className="k">Attempted</div></div>
            <div className="stat"><div className="v">{cor}</div><div className="k">Correct</div></div>
            <div className="stat"><div className="v">{att - cor}</div><div className="k">Wrong</div></div>
            <div className="stat"><div className="v">{acc !== null ? `${acc}%` : '—'}</div><div className="k">Accuracy</div></div>
            <div className="stat"><div className="v">{att && cs.pyqTimeMin ? `${Math.round(cs.pyqTimeMin / att * 10) / 10}m` : '—'}</div><div className="k">Avg time / Q</div></div>
          </div>
          <PBar pct={att / c.pyqTarget * 100} green={att >= c.pyqTarget} style={{ marginTop: 12 }} />
        </Card>

        <Card title="REVISION CYCLE">
          {revs.length === 0
            ? <Empty title="Not scheduled yet." sub="Mark the chapter complete to create +2 / +10 / +30 / Phase 3 recall." />
            : <div className="col" style={{ gap: 9 }}>
                {['d2', 'd10', 'd30', 'p3'].map((t) => {
                  const r = revByType[t];
                  if (!r) return null;
                  const overdue = !r.done && r.due < now;
                  return (
                    <div key={t} className="row">
                      <CheckBox on={r.done} onChange={(v) => A.setRevisionDone(r.id, v)} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{REVISION_LABELS[t]}</span>
                      <span className={`small mono ${overdue ? '' : 'muted'}`} style={overdue ? { color: 'var(--red)' } : null}>{r.done ? `done ${r.doneOn}` : r.due}</span>
                    </div>
                  );
                })}
              </div>}
        </Card>

        <Card title="ERRORS" right={<button className="btn sm" onClick={() => setModal('error')}><Plus size={12} /> Log mistake</button>}>
          {errs.length === 0
            ? <Empty title="No errors logged." sub="Good. Keep the notebook honest." />
            : <div className="col" style={{ gap: 6 }}>
                <div className="small muted">{unresolved.length} unresolved · {errs.length} total</div>
                {errs.slice(0, 5).map((e) => (
                  <div key={e.id} className="row small" style={{ gap: 8 }}>
                    <span className={`tag ${e.resolved ? 'green' : 'red'}`} style={{ fontSize: 10 }}>{e.resolved ? 'OK' : e.type}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.question}</span>
                  </div>
                ))}
                <button className="btn ghost sm" onClick={() => setRoute({ page: 'errors' })}>Open error notebook →</button>
              </div>}
        </Card>
      </div>

      <Card title="NOTES">
        <textarea className="input" rows={5} placeholder="Formulas, traps, standard results, reminders…"
          value={cs.notes || ''} onChange={(e) => A.patchChapter(id, { notes: e.target.value })} />
      </Card>

      <Card title="STATUS OVERRIDE" className="tight">
        <div className="row wrap">
          <span className="small muted">Auto: derived from your activity. Override:</span>
          {CHAPTER_STATUSES.map((s) => (
            <button key={s} className={`btn sm ${cs.statusOverride === s ? 'primary' : ''}`}
              onClick={() => A.patchChapter(id, { statusOverride: cs.statusOverride === s ? null : s })}>{s}</button>
          ))}
        </div>
      </Card>

      {modal === 'pyq' && <Modal title={`Log PYQs — ${c.name}`} onClose={() => setModal(null)}><PyqForm presetChapter={id} onDone={() => setModal(null)} /></Modal>}
      {modal === 'error' && <Modal title={`Log mistake — ${c.name}`} onClose={() => setModal(null)}><ErrorForm presetChapter={id} onDone={() => setModal(null)} /></Modal>}
    </div>
  );
}
