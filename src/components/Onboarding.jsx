import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { Field, fmtMin } from './ui.jsx';
import { prettyDate, dayToDate, TOTAL_DAYS } from '../plan.js';
import { ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const { state, A, start } = useStore();
  const [f, setF] = useState({
    name: state.settings.name || 'Omkar',
    targetMarks: '', targetPercentile: '', dailyFullMin: state.settings.dailyFullMin,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = () => {
    A.saveSettings({
      name: f.name.trim() || 'Omkar',
      targetMarks: f.targetMarks, targetPercentile: f.targetPercentile,
      dailyFullMin: +f.dailyFullMin || 540,
      onboarded: true,
    });
  };
  return (
    <div className="onboard">
      <div style={{ width: '100%', maxWidth: 430 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div className="small" style={{ letterSpacing: '.2em', fontWeight: 700, color: 'var(--accent)' }}>JEE MAIN 2027</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.02em', margin: '8px 0 6px' }}>111-Day Academic OS</h1>
          <div className="muted" style={{ fontSize: 14 }}>
            {prettyDate(start)} <span className="faint">→</span> {prettyDate(dayToDate(start, TOTAL_DAYS))}
          </div>
          <div className="small faint" style={{ marginTop: 10 }}>111 days · 46 chapters · one execution system</div>
        </div>
        <div className="card" style={{ padding: 26 }}>
          <Field label="Name"><input className="input" value={f.name} onChange={set('name')} /></Field>
          <div className="grid g2">
            <Field label="Target marks (/300)"><input type="number" className="input" value={f.targetMarks} onChange={set('targetMarks')} placeholder="e.g. 220" /></Field>
            <Field label="Target percentile"><input type="number" step="0.1" className="input" value={f.targetPercentile} onChange={set('targetPercentile')} placeholder="e.g. 99" /></Field>
          </div>
          <Field label={`Daily target (minutes) — currently ${fmtMin(+f.dailyFullMin || 0)}`}>
            <input type="number" className="input" value={f.dailyFullMin} onChange={set('dailyFullMin')} />
          </Field>
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 0', fontSize: 14, marginTop: 6 }} onClick={go}>
            START PLAN <ArrowRight size={15} />
          </button>
        </div>
        <div className="small faint" style={{ textAlign: 'center', marginTop: 16 }}>
          Everything is stored locally on this device. No account, no cloud.
        </div>
      </div>
    </div>
  );
}
