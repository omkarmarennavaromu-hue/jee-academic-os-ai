import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { Card, Modal, Empty } from '../components/ui.jsx';
import { chapterById, RESOURCE_TYPES, SUBJECTS } from '../plan.js';
import { ResourceForm } from '../components/forms.jsx';
import { Plus, ExternalLink, Trash2 } from 'lucide-react';

export default function Resources() {
  const { state, A } = useStore();
  const [modal, setModal] = useState(false);
  const [sub, setSub] = useState('All');
  const list = state.resources.filter((r) => sub === 'All' || r.subject === sub);

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row spread wrap">
        <div>
          <div className="h1">Resources</div>
          <div className="small muted">Lectures, PDFs, notes, PYQ sets — one flat list, no file manager.</div>
        </div>
        <button className="btn primary" onClick={() => setModal(true)}><Plus size={14} /> Add resource</button>
      </div>
      <div className="seg" style={{ alignSelf: 'flex-start' }}>
        {['All', ...SUBJECTS, 'General'].map((s) => <button key={s} className={sub === s ? 'on' : ''} onClick={() => setSub(s)}>{s === 'Mathematics' ? 'Maths' : s}</button>)}
      </div>
      {list.length === 0
        ? <Card><Empty title="No resources saved." sub="Add links to your lectures, PDFs and PYQ sets." /></Card>
        : <div className="col" style={{ gap: 8 }}>
            {list.map((r) => (
              <Card key={r.id} className="tight">
                <div className="row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span className={`t-sub sub-${r.subject}`}>{r.subject}</span>
                      <span className="tag" style={{ fontSize: 10 }}>{r.type}</span>
                      {r.chapterId && chapterById[r.chapterId] && <span className="small muted">{chapterById[r.chapterId].name}</span>}
                    </div>
                    <div className="t-title">{r.name}</div>
                    {r.notes && <div className="small faint">{r.notes}</div>}
                  </div>
                  {r.link && <a className="btn sm" href={r.link} target="_blank" rel="noreferrer"><ExternalLink size={12} /> Open</a>}
                  <button className="btn ghost sm" onClick={() => A.deleteResource(r.id)} aria-label="Delete"><Trash2 size={12} /></button>
                </div>
              </Card>
            ))}
          </div>}
      {modal && <Modal title="Add resource" onClose={() => setModal(false)}><ResourceForm onDone={() => setModal(false)} /></Modal>}
    </div>
  );
}
