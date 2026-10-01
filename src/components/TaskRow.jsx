import React from 'react';
import { useStore } from '../store.jsx';
import { CheckBox, fmtMin } from './ui.jsx';
import { chapterById, REVISION_LABELS } from '../plan.js';

export function TaskRow({ task, day, onOpenChapter }) {
  const { A, D } = useStore();
  const st = D.dayTaskStatus(day, task.id);
  const done = st === 'done';
  const skipped = st === 'skipped' || st === 'moved';
  const ch = task.chapterId ? chapterById[task.chapterId] : null;
  const toggle = (on) => {
    A.setTask(day, task.id, on ? 'done' : null);
    if (on && task.completesChapter && task.chapterId) A.completeChapter(task.chapterId);
  };
  return (
    <div className={`task-row ${done || skipped ? 'done' : ''}`} style={{ cursor: ch ? 'pointer' : 'default' }}
      onClick={() => ch && onOpenChapter && onOpenChapter(ch.id)}>
      <CheckBox on={done} onChange={toggle} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={`t-sub sub-${task.subject}`}>{task.subject === 'General' ? task.kind : task.subject}</div>
        <div className="t-title">{task.title}</div>
        <div className="t-meta">{task.subject !== 'General' && `${task.kind} · `}{task.est ? fmtMin(task.est) : ''}
          {task.completesChapter && !done && <span className="faint"> · completes chapter → starts revision cycle</span>}
          {skipped && <span> · {st}</span>}
        </div>
      </div>
    </div>
  );
}

export function RevisionRow({ rev, onOpenChapter }) {
  const { A, now } = useStore();
  const ch = chapterById[rev.chapterId];
  if (!ch) return null;
  const overdue = rev.due < now && !rev.done;
  return (
    <div className={`task-row ${rev.done ? 'done' : ''}`} style={{ cursor: 'pointer' }} onClick={() => onOpenChapter && onOpenChapter(ch.id)}>
      <CheckBox on={rev.done} onChange={(on) => A.setRevisionDone(rev.id, on)} />
      <div style={{ flex: 1 }}>
        <div className={`t-sub sub-${ch.subject}`}>{ch.subject}</div>
        <div className="t-title">{ch.name}</div>
        <div className="t-meta">{REVISION_LABELS[rev.type]}{overdue && <span style={{ color: 'var(--red)' }}> · overdue ({rev.due})</span>}</div>
      </div>
      <span className={`tag ${overdue ? 'red' : 'accent'}`}>{rev.type === 'p3' ? 'P3' : rev.type.replace('d', '+')}</span>
    </div>
  );
}

export function ExtraRow({ task, dateStr }) {
  const { A } = useStore();
  return (
    <div className={`task-row ${task.done ? 'done' : ''}`}>
      <CheckBox on={!!task.done} onChange={(on) => A.setExtraDone(dateStr, task.id, on)} />
      <div style={{ flex: 1 }}>
        <div className={`t-sub sub-${task.subject}`}>{task.subject}</div>
        <div className="t-title">{task.title}</div>
        <div className="t-meta">{task.kind} · {fmtMin(task.est)}{task.fromDay ? ` · recovered from Day ${task.fromDay}` : ' · added task'}</div>
      </div>
      <button className="btn ghost sm" onClick={() => A.removeExtra(dateStr, task.id)} aria-label="Remove">✕</button>
    </div>
  );
}
