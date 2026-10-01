import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { CHAPTERS, SUBJECTS, MISTAKE_TYPES, RESOURCE_TYPES, todayStr } from '../plan.js';
import { Field } from './ui.jsx';

export function ChapterSelect({ value, onChange, subject, allowNone }) {
  const list = CHAPTERS.filter((c) => !subject || c.subject === subject);
  return (
    <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
      {allowNone && <option value="">— None / general —</option>}
      {!allowNone && !value && <option value="">Select chapter…</option>}
      {list.map((c) => <option key={c.id} value={c.id}>{c.subject.slice(0, 4)} — {c.name}</option>)}
    </select>
  );
}

export function ErrorForm({ onDone, presetChapter }) {
  const { A } = useStore();
  const preset = presetChapter ? CHAPTERS.find((c) => c.id === presetChapter) : null;
  const [f, setF] = useState({
    question: '', subject: preset?.subject || 'Physics', chapterId: presetChapter || '',
    date: todayStr(), type: 'Concept', bucket: '', solution: '', lesson: '', reattempt: '', resolved: false,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target?.value ?? e });
  const submit = () => {
    if (!f.question.trim()) return;
    A.addError({ ...f, chapterId: f.chapterId || null });
    onDone();
  };
  return (
    <div>
      <Field label="Question / description"><textarea className="input" value={f.question} onChange={set('question')} placeholder="What was the question?" /></Field>
      <div className="grid g2">
        <Field label="Subject">
          <select className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value, chapterId: '' })}>
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Chapter"><ChapterSelect value={f.chapterId} onChange={(v) => setF({ ...f, chapterId: v })} subject={f.subject} allowNone /></Field>
        <Field label="Mistake type">
          <select className="input" value={f.type} onChange={set('type')}>{MISTAKE_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </Field>
        <Field label="Bucket (from mock, optional)">
          <select className="input" value={f.bucket} onChange={set('bucket')}>
            <option value="">—</option>
            <option value="2">Bucket 2 — knew it, got it wrong</option>
            <option value="4">Bucket 4 — didn't know</option>
          </select>
        </Field>
        <Field label="Date"><input type="date" className="input" value={f.date} onChange={set('date')} /></Field>
        <Field label="Reattempt on"><input type="date" className="input" value={f.reattempt} onChange={set('reattempt')} /></Field>
      </div>
      <Field label="Correct solution / approach"><textarea className="input" value={f.solution} onChange={set('solution')} /></Field>
      <Field label="Lesson learned"><input className="input" value={f.lesson} onChange={set('lesson')} placeholder="One line. What will you do differently?" /></Field>
      <button className="btn primary" onClick={submit}>Log mistake</button>
    </div>
  );
}

export function PyqForm({ onDone, presetChapter }) {
  const { A } = useStore();
  const [cid, setCid] = useState(presetChapter || '');
  const [att, setAtt] = useState(''); const [cor, setCor] = useState(''); const [time, setTime] = useState('');
  const submit = () => {
    const a = +att || 0, c = Math.min(+cor || 0, a);
    if (!cid || a <= 0) return;
    A.logPyq(cid, a, c, +time || 0);
    onDone();
  };
  return (
    <div>
      <Field label="Chapter"><ChapterSelect value={cid} onChange={setCid} /></Field>
      <div className="grid g3">
        <Field label="Attempted"><input type="number" min="1" className="input" value={att} onChange={(e) => setAtt(e.target.value)} /></Field>
        <Field label="Correct"><input type="number" min="0" className="input" value={cor} onChange={(e) => setCor(e.target.value)} /></Field>
        <Field label="Time (min)"><input type="number" min="0" className="input" value={time} onChange={(e) => setTime(e.target.value)} placeholder="optional" /></Field>
      </div>
      <button className="btn primary" onClick={submit} disabled={!cid || !+att}>Log PYQ session</button>
    </div>
  );
}

export function SessionForm({ onDone, preset }) {
  const { A } = useStore();
  const [f, setF] = useState({ date: todayStr(), subject: 'Physics', type: 'Theory', minutes: preset?.minutes || 60, note: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div>
      <div className="grid g2">
        <Field label="Date"><input type="date" className="input" value={f.date} onChange={set('date')} /></Field>
        <Field label="Minutes"><input type="number" min="1" className="input" value={f.minutes} onChange={set('minutes')} /></Field>
        <Field label="Subject">
          <select className="input" value={f.subject} onChange={set('subject')}>
            {[...SUBJECTS, 'Revision', 'Mock', 'General'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="What did you complete?">
          <select className="input" value={f.type} onChange={set('type')}>
            {['Theory', 'PYQs', 'Revision', 'Mock', 'Error analysis'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Note (optional)"><input className="input" value={f.note} onChange={set('note')} placeholder="e.g. Modern Physics lecture 3" /></Field>
      <button className="btn primary" onClick={() => { if (+f.minutes > 0) { A.addSession({ ...f, minutes: +f.minutes }); onDone(); } }}>Log study time</button>
    </div>
  );
}

export function ResourceForm({ onDone }) {
  const { A } = useStore();
  const [f, setF] = useState({ name: '', subject: 'Physics', chapterId: '', type: 'Lecture', link: '', notes: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div>
      <Field label="Name"><input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Modern Physics one-shot" /></Field>
      <div className="grid g2">
        <Field label="Subject">
          <select className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value, chapterId: '' })}>
            {[...SUBJECTS, 'General'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Chapter"><ChapterSelect value={f.chapterId} onChange={(v) => setF({ ...f, chapterId: v })} subject={f.subject === 'General' ? null : f.subject} allowNone /></Field>
        <Field label="Type"><select className="input" value={f.type} onChange={set('type')}>{RESOURCE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Link"><input className="input" value={f.link} onChange={set('link')} placeholder="https://…" /></Field>
      </div>
      <Field label="Notes"><input className="input" value={f.notes} onChange={set('notes')} /></Field>
      <button className="btn primary" onClick={() => { if (f.name.trim()) { A.addResource({ ...f, chapterId: f.chapterId || null }); onDone(); } }}>Add resource</button>
    </div>
  );
}

export function ExtraTaskForm({ onDone, dateStr }) {
  const { A } = useStore();
  const [f, setF] = useState({ subject: 'Physics', title: '', kind: 'Theory', est: 60 });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div>
      <Field label="Task"><input className="input" value={f.title} onChange={set('title')} placeholder="e.g. Redo capacitance PYQ set" /></Field>
      <div className="grid g3">
        <Field label="Subject"><select className="input" value={f.subject} onChange={set('subject')}>{[...SUBJECTS, 'General'].map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Type"><select className="input" value={f.kind} onChange={set('kind')}>{['Theory', 'PYQs', 'Revision', 'Mock', 'Error Analysis'].map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Est. min"><input type="number" className="input" value={f.est} onChange={set('est')} /></Field>
      </div>
      <button className="btn primary" onClick={() => { if (f.title.trim()) { A.addExtra(dateStr || todayStr(), { ...f, est: +f.est || 0 }); onDone(); } }}>Add task</button>
    </div>
  );
}
