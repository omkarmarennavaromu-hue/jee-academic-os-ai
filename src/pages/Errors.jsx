import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { Card, Modal, Empty, CheckBox } from '../components/ui.jsx';
import { chapterById, SUBJECTS, MISTAKE_TYPES, prettyDate } from '../plan.js';
import { ErrorForm } from '../components/forms.jsx';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

export default function Errors() {
  const { state, A } = useStore();
  const [modal, setModal] = useState(false);
  const [sub, setSub] = useState('All');
  const [show, setShow] = useState('open'); // open | resolved | all
  const [openId, setOpenId] = useState(null);

  const list = state.errors.filter((e) =>
    (sub === 'All' || e.subject === sub) &&
    (show === 'all' || (show === 'open' ? !e.resolved : e.resolved))
  );
  const openCount = state.errors.filter((e) => !e.resolved).length;

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row spread wrap">
        <div>
          <div className="h1">Error Notebook</div>
          <div className="small muted">{state.errors.length} logged · {openCount} unresolved</div>
        </div>
        <button className="btn primary" onClick={() => setModal(true)}><Plus size={14} /> Log mistake</button>
      </div>

      <div className="row wrap">
        <div className="seg">{['All', ...SUBJECTS].map((s) => <button key={s} className={sub === s ? 'on' : ''} onClick={() => setSub(s)}>{s === 'Mathematics' ? 'Maths' : s}</button>)}</div>
        <div className="seg">{[['open', 'Unresolved'], ['resolved', 'Resolved'], ['all', 'All']].map(([v, l]) => <button key={v} className={show === v ? 'on' : ''} onClick={() => setShow(v)}>{l}</button>)}</div>
      </div>

      {list.length === 0
        ? <Card><Empty title={state.errors.length === 0 ? 'No errors yet.' : 'Nothing here.'} sub={state.errors.length === 0 ? 'Good. Your error notebook is clean — keep it honest when mistakes happen.' : 'Adjust the filters.'} /></Card>
        : <div className="col" style={{ gap: 8 }}>
            {list.map((e) => {
              const ch = e.chapterId ? chapterById[e.chapterId] : null;
              const open = openId === e.id;
              return (
                <Card key={e.id} className="tight">
                  <div className="row" style={{ cursor: 'pointer' }} onClick={() => setOpenId(open ? null : e.id)}>
                    <CheckBox on={e.resolved} onChange={(v) => A.patchError(e.id, { resolved: v })} label="Resolved" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ gap: 8 }}>
                        <span className={`t-sub sub-${e.subject}`}>{e.subject}</span>
                        {ch && <span className="small muted">{ch.name}</span>}
                        <span className={`tag ${e.resolved ? 'green' : 'yellow'}`} style={{ fontSize: 10 }}>{e.type}</span>
                        {e.bucket && <span className="tag red" style={{ fontSize: 10 }}>Bucket {e.bucket}</span>}
                      </div>
                      <div className="t-title" style={{ textDecoration: e.resolved ? 'line-through' : 'none', opacity: e.resolved ? 0.6 : 1 }}>{e.question}</div>
                      <div className="small faint">{prettyDate(e.date)}{e.reattempt && ` · reattempt ${prettyDate(e.reattempt)}`}</div>
                    </div>
                    {open ? <ChevronDown size={15} className="muted" /> : <ChevronRight size={15} className="muted" />}
                  </div>
                  {open && (
                    <div style={{ marginTop: 10, paddingLeft: 31 }}>
                      {e.solution && <div className="small" style={{ marginBottom: 6 }}><span className="faint">SOLUTION · </span>{e.solution}</div>}
                      {e.lesson && <div className="small" style={{ marginBottom: 6 }}><span className="faint">LESSON · </span>{e.lesson}</div>}
                      <button className="btn ghost sm" style={{ color: 'var(--red)' }} onClick={() => A.deleteError(e.id)}><Trash2 size={12} /> Delete</button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>}

      {modal && <Modal title="Log mistake" onClose={() => setModal(false)}><ErrorForm onDone={() => setModal(false)} /></Modal>}
    </div>
  );
}
