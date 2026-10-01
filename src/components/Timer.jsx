import React, { useEffect, useState } from 'react';
import { useStore } from '../store.jsx';
import { Modal } from './ui.jsx';
import { SessionForm } from './forms.jsx';
import { Timer as TimerIcon, Pause, Play, Square } from 'lucide-react';

export default function Timer() {
  const { state, A } = useStore();
  const t = state.timer;
  const [open, setOpen] = useState(false);
  const [logMin, setLogMin] = useState(null);
  const [custom, setCustom] = useState('');
  const [, tick] = useState(0);

  useEffect(() => {
    if (!t || t.paused) return;
    const iv = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(iv);
  }, [t]);

  const remaining = () => {
    if (!t) return 0;
    if (t.paused) return t.pausedRemaining;
    return Math.max(0, t.durationMin * 60 - Math.floor((Date.now() - t.startTs) / 1000));
  };
  const rem = remaining();
  const running = t && !t.paused && rem > 0;
  const finished = t && rem <= 0 && !t.paused;

  useEffect(() => {
    if (finished) {
      const elapsed = t.durationMin;
      A.setTimer(null);
      setLogMin(elapsed);
      setOpen(false);
      try { new AudioContext(); } catch {}
    }
  }, [finished]); // eslint-disable-line

  const start = (min) => { A.setTimer({ startTs: Date.now(), durationMin: min, paused: false }); };
  const pause = () => A.setTimer({ ...t, paused: true, pausedRemaining: rem });
  const resume = () => A.setTimer({ startTs: Date.now() - (t.durationMin * 60 - t.pausedRemaining) * 1000, durationMin: t.durationMin, paused: false });
  const stop = () => {
    const spentMin = Math.round((t.durationMin * 60 - rem) / 60);
    A.setTimer(null);
    setOpen(false);
    if (spentMin >= 1) setLogMin(spentMin);
  };
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <>
      <button className={`btn sm ${t ? 'primary' : ''}`} onClick={() => setOpen(true)} title="Focus timer" style={{ width: '100%', justifyContent: 'center' }}>
        <TimerIcon size={13} />
        {t ? <span className="mono">{mmss(rem)}</span> : 'Focus timer'}
      </button>

      {open && (
        <Modal title="Focus timer" onClose={() => setOpen(false)}>
          {!t ? (
            <div className="col" style={{ gap: 14 }}>
              <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
                {[25, 50, 90].map((m) => <button key={m} className="btn" style={{ padding: '14px 22px', fontSize: 15 }} onClick={() => start(m)}>{m} min</button>)}
              </div>
              <div className="row" style={{ justifyContent: 'center' }}>
                <input type="number" className="input" style={{ width: 110 }} placeholder="Custom" value={custom} onChange={(e) => setCustom(e.target.value)} min="1" />
                <button className="btn" onClick={() => +custom > 0 && start(+custom)} disabled={!+custom}>Start</button>
              </div>
              <div className="small faint" style={{ textAlign: 'center' }}>When the timer ends you log what you completed.</div>
            </div>
          ) : (
            <div className="col" style={{ gap: 16, alignItems: 'center' }}>
              <div className="timer-big">{mmss(rem)}</div>
              <div className="row">
                {t.paused
                  ? <button className="btn primary" onClick={resume}><Play size={14} /> Resume</button>
                  : <button className="btn" onClick={pause}><Pause size={14} /> Pause</button>}
                <button className="btn danger" onClick={stop}><Square size={13} /> Stop & log</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {logMin !== null && (
        <Modal title={`Session done — ${logMin} min. What did you complete?`} onClose={() => setLogMin(null)}>
          <SessionForm preset={{ minutes: logMin }} onDone={() => setLogMin(null)} />
        </Modal>
      )}
    </>
  );
}
