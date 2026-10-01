import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

export function Card({ title, right, children, className = '', ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {title && <div className="card-title">{title}{right && <span className="right">{right}</span>}</div>}
      {children}
    </div>
  );
}

export function PBar({ pct, green, style }) {
  return <div className={`pbar ${green ? 'green' : ''}`} style={style}><div style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>;
}

export function CheckBox({ on, onChange, label }) {
  return (
    <button className={`check ${on ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); onChange(!on); }} aria-label={label || (on ? 'Mark incomplete' : 'Mark complete')} title={label}>
      <Check size={13} strokeWidth={3.2} />
    </button>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={wide ? { maxWidth: 720 } : null} role="dialog" aria-label={title}>
        <div className="modal-head">
          <div className="h2">{title}</div>
          <button className="btn ghost icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stat({ v, k, color }) {
  return <div className="stat"><div className="v" style={color ? { color } : null}>{v}</div><div className="k">{k}</div></div>;
}

export function Dot({ status }) { return <span className={`dot ${status}`} />; }

export function Empty({ title, sub }) {
  return <div className="empty"><div className="e1">{title}</div>{sub && <div>{sub}</div>}</div>;
}

export function Field({ label, children }) {
  return <div className="field"><label className="label">{label}</label>{children}</div>;
}

export function fmtMin(min) {
  if (!min) return '0m';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export function StatusTag({ status }) {
  const map = {
    'NOT STARTED': ['', 'Not started'], LEARNING: ['accent', 'Learning'], PYQs: ['yellow', 'PYQs'],
    REVISION: ['yellow', 'Revision'], MASTERED: ['green', 'Mastered'],
  };
  const [cls, label] = map[status] || ['', status];
  return <span className={`tag ${cls}`}>{label}</span>;
}

export function SubjectDot({ subject }) {
  const c = { Physics: 'var(--accent)', Chemistry: 'var(--green)', Mathematics: 'var(--yellow)', General: 'var(--faint)' }[subject];
  return <span className="dot" style={{ background: c, border: 'none' }} />;
}

/* simple SVG line chart */
export function LineChart({ points, height = 160, max = 300, labels = [] }) {
  if (!points.length) return <Empty title="No mocks recorded yet." sub="Scores will chart here as you log mocks." />;
  const w = 600, h = height, padX = 30, padY = 18;
  const n = points.length;
  const x = (i) => n === 1 ? w / 2 : padX + (i * (w - padX * 2)) / (n - 1);
  const y = (v) => h - padY - (v / max) * (h - padY * 2);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Mock score trend">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={padX} x2={w - padX} y1={y(max * f)} y2={y(max * f)} stroke="var(--border)" strokeWidth="1" />
          <text x={4} y={y(max * f) + 4} fontSize="10" fill="var(--faint)">{Math.round(max * f)}</text>
        </g>
      ))}
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p)} r="3.5" fill="var(--accent)" />
          <text x={x(i)} y={y(p) - 9} fontSize="10.5" fill="var(--muted)" textAnchor="middle" fontFamily="var(--mono)">{p}</text>
          {labels[i] && <text x={x(i)} y={h - 3} fontSize="9.5" fill="var(--faint)" textAnchor="middle">{labels[i]}</text>}
        </g>
      ))}
    </svg>
  );
}
