import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { CHAPTERS, chapterById, PLAN, REVISION_LABELS } from '../plan.js';
import { Search as SearchIcon, BookOpen, ListTodo, AlertCircle, FileBarChart, Link2, RotateCw } from 'lucide-react';

export default function Search({ onClose }) {
  const { state, setRoute } = useStore();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const hits = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const out = [];
    const match = (s) => s && s.toLowerCase().includes(query);
    CHAPTERS.forEach((c) => { if (match(c.name) || match(c.subject)) out.push({ icon: BookOpen, label: `${c.subject} — ${c.name}`, sub: `Chapter · Tier ${c.tier}`, go: { page: 'chapter', id: c.id } }); });
    const seen = new Set();
    PLAN.forEach((d) => d.tasks.forEach((t) => {
      const key = `${t.title}|${t.kind}`;
      if (!seen.has(key) && (match(t.title) || match(t.kind))) { seen.add(key); out.push({ icon: ListTodo, label: t.title, sub: `Task · Day ${d.n} · ${t.kind}`, go: { page: 'plan', day: d.n } }); }
    }));
    state.revisions.forEach((r) => {
      const ch = chapterById[r.chapterId];
      if (ch && (match(ch.name))) out.push({ icon: RotateCw, label: `${ch.name} — ${REVISION_LABELS[r.type]}`, sub: `Revision · due ${r.due}${r.done ? ' · done' : ''}`, go: { page: 'revision' } });
    });
    state.errors.forEach((e) => {
      const ch = e.chapterId ? chapterById[e.chapterId] : null;
      if (match(e.question) || match(ch?.name)) out.push({ icon: AlertCircle, label: e.question.slice(0, 60), sub: `Error · ${e.subject}${ch ? ' · ' + ch.name : ''}`, go: { page: 'errors' } });
    });
    state.mocks.forEach((m) => { if (match(m.name)) out.push({ icon: FileBarChart, label: `${m.name} — ${m.total}/300`, sub: `Mock · ${m.date}`, go: { page: 'mocks' } }); });
    state.resources.forEach((r) => { if (match(r.name) || match(r.notes)) out.push({ icon: Link2, label: r.name, sub: `Resource · ${r.type}`, go: { page: 'resources' } }); });
    return out.slice(0, 12);
  }, [q, state]);

  useEffect(() => setSel(0), [q]);

  const go = (h) => { setRoute(h.go); onClose(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && hits[sel]) go(hits[sel]);
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 600, padding: 12 }}>
        <div className="row" style={{ borderBottom: hits.length ? '1px solid var(--border)' : 'none', paddingBottom: hits.length ? 10 : 0 }}>
          <SearchIcon size={16} className="muted" />
          <input ref={inputRef} className="input" style={{ border: 'none', background: 'transparent', fontSize: 15 }}
            placeholder="Search chapters, tasks, errors, mocks, resources…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} />
          <span className="kbd">ESC</span>
        </div>
        {hits.length > 0 && (
          <div className="col" style={{ gap: 2, marginTop: 8 }}>
            {hits.map((h, i) => (
              <button key={i} className={`search-hit ${i === sel ? 'sel' : ''}`} onClick={() => go(h)} onMouseEnter={() => setSel(i)}>
                <h.icon size={15} className="muted" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.label}</div>
                  <div className="small faint">{h.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        {q.trim().length >= 2 && hits.length === 0 && <div className="empty" style={{ padding: 18 }}>No results for “{q}”.</div>}
      </div>
    </div>
  );
}
