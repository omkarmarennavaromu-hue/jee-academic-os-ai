import React, { useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { Card, Field, fmtMin } from '../components/ui.jsx';
import { Download, Upload, RotateCcw, Mail, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { sendTestEmail, pushSync } from '../emailSync.js';

const ACCENTS = [['#4f7cff', 'Blue'], ['#8b5cf6', 'Violet'], ['#14b8a6', 'Teal'], ['#f59e0b', 'Amber'], ['#ec4899', 'Pink']];

function EmailCard() {
  const { state, A } = useStore();
  const s = state.settings;
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const status = s.emailStatus;

  const run = async (fn, okMsg) => {
    if (!s.emailEndpoint) { setNote('Paste your Apps Script Web App URL first (see email-service/SETUP.md).'); return; }
    setBusy('1'); setNote('');
    try {
      const res = await fn();
      A.saveSettings({ emailStatus: res });
      setNote(res?.ok === false ? `Failed: ${res.error}` : okMsg);
    } catch {
      setNote('Could not reach the endpoint. Check the URL and that the deployment access is "Anyone".');
    } finally { setBusy(''); }
  };

  const lastLog = status?.log?.[0];
  return (
    <Card title={<span className="row" style={{ gap: 6 }}><Mail size={13} /> DAILY EMAIL</span>}>
      <div className="row spread" style={{ marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 650, fontSize: 13.5 }}>Daily JEE plan email</div>
          <div className="small faint">Every day · 12:00 AM · Asia/Kolkata (IST) · 6 Oct 2026 → 24 Jan 2027</div>
        </div>
        <div className="seg">
          <button className={s.emailEnabled ? 'on' : ''} onClick={() => A.saveSettings({ emailEnabled: true })}>ON</button>
          <button className={!s.emailEnabled ? 'on' : ''} onClick={() => A.saveSettings({ emailEnabled: false })}>OFF</button>
        </div>
      </div>
      <div className="grid g2">
        <Field label="Recipient email">
          <input className="input" value={s.emailAddress} onChange={(e) => A.saveSettings({ emailAddress: e.target.value })} />
        </Field>
        <Field label="Send time">
          <input className="input" value="12:00 AM — Asia/Kolkata (IST)" disabled />
        </Field>
      </div>
      <Field label="Endpoint — your Google Apps Script Web App URL (keeps all credentials server-side)">
        <input className="input" placeholder="https://script.google.com/macros/s/…/exec" value={s.emailEndpoint}
          onChange={(e) => A.saveSettings({ emailEndpoint: e.target.value.trim() })} />
      </Field>
      <div className="row wrap">
        <button className="btn primary" disabled={!!busy} onClick={() => run(() => sendTestEmail(s.emailEndpoint, state), 'Test email sent — check your inbox.')}>
          <Send size={13} /> {busy ? 'Working…' : 'SEND TEST EMAIL'}
        </button>
        <button className="btn" disabled={!!busy} onClick={() => run(() => pushSync(s.emailEndpoint, state), 'Synced. The midnight email now has your latest revision data.')}>
          Sync now
        </button>
      </div>
      {note && <div className="small" style={{ marginTop: 10, color: note.startsWith('Failed') || note.startsWith('Could') ? 'var(--red)' : 'var(--green)' }}>{note}</div>}
      <div className="divider" />
      <div className="small muted" style={{ fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>DAILY EMAIL STATUS</div>
      {!status
        ? <div className="small faint">Not connected yet. One-time setup guide: <span className="mono">email-service/SETUP.md</span> (≈5 minutes, free, runs in your own Google account).</div>
        : <div className="col" style={{ gap: 4 }}>
            <div className="row small" style={{ gap: 6 }}>
              {lastLog?.status === 'failed'
                ? <><AlertTriangle size={13} color="var(--yellow)" /> <span>Last event: <b>⚠ Failed</b> {lastLog.date}{lastLog.error ? ` — ${lastLog.error}` : ''}</span></>
                : <><CheckCircle2 size={13} color="var(--green)" /> <span>Last daily email: <b>{status.lastDailyEmailDate ? `✓ Sent ${status.lastDailyEmailDate}` : 'none yet (starts 6 Oct 2026)'}</b></span></>}
            </div>
            {status.snapshotSavedAt && <div className="small faint">Data synced: {new Date(status.snapshotSavedAt).toLocaleString()}</div>}
            {status.log?.length > 0 && (
              <div className="small faint" style={{ marginTop: 4 }}>
                {status.log.slice(0, 5).map((l, i) => <div key={i} className="mono">{l.date} · {l.status}{l.day ? ` · Day ${l.day}` : ''}</div>)}
              </div>
            )}
          </div>}
    </Card>
  );
}

export default function Settings() {
  const { state, A } = useStore();
  const s = state.settings;
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');

  const exportData = () => {
    const safe = { ...state, settings: { ...state.settings, aiKey: '' } };
    const blob = new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jee-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('Backup downloaded.');
  };
  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(r.result);
        if (!obj.settings) throw new Error('bad file');
        A.importData(obj);
        setMsg('Data imported successfully.');
      } catch { setMsg('Import failed — not a valid JEE OS backup file.'); }
    };
    r.readAsText(file);
    e.target.value = '';
  };
  const reset = () => {
    if (confirm('Erase ALL data — progress, mocks, errors, sessions? This cannot be undone.')) {
      if (confirm('Are you absolutely sure? Export a backup first if in doubt.')) A.resetData();
    }
  };

  return (
    <div className="col" style={{ gap: 16, maxWidth: 680 }}>
      <div className="h1">Settings</div>

      <Card title="PROFILE">
        <div className="grid g2">
          <Field label="Name"><input className="input" value={s.name} onChange={(e) => A.saveSettings({ name: e.target.value })} /></Field>
          <Field label="Target marks (/300)"><input type="number" className="input" value={s.targetMarks} onChange={(e) => A.saveSettings({ targetMarks: e.target.value })} /></Field>
          <Field label="Target percentile"><input type="number" step="0.1" className="input" value={s.targetPercentile} onChange={(e) => A.saveSettings({ targetPercentile: e.target.value })} /></Field>
        </div>
      </Card>

      <Card title="DAILY STUDY TARGET">
        <div className="grid g2">
          <Field label={`School day (min) — ${fmtMin(s.dailySchoolMin)}`}>
            <input type="number" className="input" value={s.dailySchoolMin} onChange={(e) => A.saveSettings({ dailySchoolMin: +e.target.value || 0 })} />
          </Field>
          <Field label={`Full day (min) — ${fmtMin(s.dailyFullMin)}`}>
            <input type="number" className="input" value={s.dailyFullMin} onChange={(e) => A.saveSettings({ dailyFullMin: +e.target.value || 0 })} />
          </Field>
        </div>
        <div className="small faint">Source-plan templates: school day ≈ 4h 45m, full day ≈ 9h.</div>
      </Card>

      <Card title="APPEARANCE">
        <div className="grid g2">
          <Field label="Theme">
            <div className="seg">
              {['dark', 'light'].map((t) => <button key={t} className={s.theme === t ? 'on' : ''} onClick={() => A.saveSettings({ theme: t })}>{t[0].toUpperCase() + t.slice(1)}</button>)}
            </div>
          </Field>
          <Field label="Accent">
            <div className="row">
              {ACCENTS.map(([c, name]) => (
                <button key={c} title={name} aria-label={name} onClick={() => A.saveSettings({ accent: c })}
                  style={{ width: 26, height: 26, borderRadius: 99, background: c, border: s.accent === c ? '2.5px solid var(--text)' : '2.5px solid transparent' }} />
              ))}
            </div>
          </Field>
        </div>
      </Card>

      <Card title="PLAN DATES">
        <div className="grid g2">
          <Field label="Start date (Day 1)"><input type="date" className="input" value={s.startDate} onChange={(e) => A.saveSettings({ startDate: e.target.value })} /></Field>
          <Field label="Exam date"><input type="date" className="input" value={s.examDate} onChange={(e) => A.saveSettings({ examDate: e.target.value })} /></Field>
        </div>
        <div className="small faint">Changing the start date re-maps all 111 days. Existing task completions stay attached to day numbers.</div>
      </Card>

      <EmailCard />

      <Card title="DATA">
        <div className="row wrap">
          <button className="btn" onClick={exportData}><Download size={14} /> Export data (JSON)</button>
          <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={14} /> Import data</button>
          <button className="btn danger" onClick={reset}><RotateCcw size={14} /> Reset all data</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importData} />
        </div>
        {msg && <div className="small" style={{ marginTop: 10, color: 'var(--green)' }}>{msg}</div>}
        <div className="small faint" style={{ marginTop: 10 }}>Everything lives in this browser's local storage. Export regularly — it is your only backup.</div>
      </Card>
    </div>
  );
}
