import React from 'react';
import { useStore } from '../store.jsx';
import { Card, Empty } from '../components/ui.jsx';
import { RevisionRow } from '../components/TaskRow.jsx';
import { chapterById, prettyDate } from '../plan.js';

export default function Revision() {
  const { state, setRoute, now } = useStore();
  const revs = state.revisions;
  const overdue = revs.filter((r) => !r.done && r.due < now).sort((a, b) => a.due < b.due ? -1 : 1);
  const today = revs.filter((r) => !r.done && r.due === now);
  const upcoming = revs.filter((r) => !r.done && r.due > now).sort((a, b) => a.due < b.due ? -1 : 1);
  const done = revs.filter((r) => r.done).sort((a, b) => (b.doneOn || '') < (a.doneOn || '') ? -1 : 1);
  const open = (id) => setRoute({ page: 'chapter', id });

  return (
    <div className="col" style={{ gap: 16 }}>
      <div>
        <div className="h1">Revision</div>
        <div className="small muted">Complete a chapter → +2 day cold recall → +10 day retrieval set → +30 day mixed retrieval → Phase 3 full pass.</div>
      </div>
      {revs.length === 0 && (
        <Card><Empty title="No revisions scheduled yet." sub="They are created automatically the moment you mark a chapter complete." /></Card>
      )}
      {overdue.length > 0 && (
        <Card title={`OVERDUE — ${overdue.length}`}>
          <div className="col" style={{ gap: 8 }}>{overdue.map((r) => <RevisionRow key={r.id} rev={r} onOpenChapter={open} />)}</div>
        </Card>
      )}
      {today.length > 0 && (
        <Card title="DUE TODAY">
          <div className="col" style={{ gap: 8 }}>{today.map((r) => <RevisionRow key={r.id} rev={r} onOpenChapter={open} />)}</div>
        </Card>
      )}
      {upcoming.length > 0 && (
        <Card title="UPCOMING">
          <div className="col" style={{ gap: 8 }}>{upcoming.slice(0, 15).map((r) => <RevisionRow key={r.id} rev={r} onOpenChapter={open} />)}
            {upcoming.length > 15 && <div className="small faint">+{upcoming.length - 15} more scheduled</div>}
          </div>
        </Card>
      )}
      {done.length > 0 && (
        <Card title={`COMPLETED — ${done.length}`}>
          <div className="col" style={{ gap: 4 }}>
            {done.slice(0, 10).map((r) => {
              const ch = chapterById[r.chapterId];
              return <div key={r.id} className="small muted row spread"><span>{ch?.subject} — {ch?.name} · {r.type === 'p3' ? 'Phase 3' : r.type.replace('d', '+') + ' day'}</span><span className="mono">{r.doneOn}</span></div>;
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
