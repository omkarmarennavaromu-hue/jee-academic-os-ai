import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { Card, Field, Empty } from '../components/ui.jsx';
import { buildContext, systemPrompt, streamChat, fetchFreeModels, DEFAULT_MODELS } from '../ai.js';
import { Sparkles, Send, Square, Trash2, KeyRound, RefreshCw, Server } from 'lucide-react';

function ServerModeSetup() {
  const { A } = useStore();
  const [code, setCode] = useState('');
  return (
    <div className="row wrap" style={{ gap: 8 }}>
      <input className="input" style={{ maxWidth: 220 }} placeholder="Access code (only if you set one)" value={code} onChange={(e) => setCode(e.target.value)} />
      <button className="btn" onClick={() => A.saveSettings({ aiKey: code.trim() ? `server:${code.trim()}` : 'server' })}>
        <Server size={14} /> Use server key
      </button>
    </div>
  );
}

export default function Coach() {
  const store = useStore();
  const { state, A, D, currentDay, now, start } = store;
  const s = state.settings;
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [includeData, setIncludeData] = useState(true);
  const [models, setModels] = useState(DEFAULT_MODELS);
  const [loadingModels, setLoadingModels] = useState(false);
  const abortRef = useRef(null);
  const endRef = useRef(null);
  const chat = state.aiChat || [];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat.length, chat[chat.length - 1]?.content?.length]);

  const ask = async (text) => {
    const q = (text || input).trim();
    if (!q || busy || !s.aiKey) return;
    setErr(''); setInput(''); setBusy(true);
    const userMsg = { role: 'user', content: q };
    let msgs = [...chat, userMsg];
    A.setAiChat([...msgs, { role: 'assistant', content: '' }]);
    const apiMessages = [
      ...(includeData ? [{ role: 'system', content: systemPrompt(buildContext({ state, D, currentDay, now, start })) }] : [{ role: 'system', content: 'You are a concise, factual JEE Main 2027 tutor for Physics, Chemistry and Mathematics.' }]),
      ...msgs.slice(-12), // last turns only — keeps free-tier tokens low
    ];
    const ac = new AbortController();
    abortRef.current = ac;
    let acc = '';
    try {
      for await (const delta of streamChat({ key: s.aiKey, model: s.aiModel, messages: apiMessages, signal: ac.signal })) {
        acc += delta;
        A.setAiChat([...msgs, { role: 'assistant', content: acc }]);
      }
      if (!acc) throw new Error('Empty response — the free model may be rate-limited. Try again or switch models.');
    } catch (e) {
      if (e.name !== 'AbortError') {
        setErr(String(e.message || e));
        if (!acc) A.setAiChat(msgs); // drop empty assistant bubble
      }
    } finally {
      setBusy(false); abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const loadModels = async () => {
    setLoadingModels(true); setErr('');
    try { const list = await fetchFreeModels(s.aiKey); if (list.length) setModels(list); }
    catch (e) { setErr('Could not load model list: ' + e.message); }
    finally { setLoadingModels(false); }
  };

  const QUICK = [
    ['Daily briefing', 'Give me a short daily briefing: what exactly should I do today, in what order, and what is at risk of slipping (overdue revisions, missed days, weaknesses). Be specific to my data.'],
    ['What to fix first', 'Based on my mocks, errors and PYQ accuracy, what are the top 3 things to fix this week, and concretely how?'],
    ['Analyze last mock', 'Analyze my most recent mock using the four buckets and over-4-minute count. What does it say about knowledge vs execution vs pacing? Give me an action plan.'],
    ['Quiz my weakest chapter', 'Pick my weakest chapter from the data and ask me 3 JEE Main level questions on it, one at a time. Wait for my answer before continuing.'],
  ];

  if (!s.aiKey) {
    return (
      <div className="col" style={{ gap: 16, maxWidth: 680 }}>
        <div>
          <div className="h1 row" style={{ gap: 8 }}><Sparkles size={20} /> AI Coach</div>
          <div className="small muted">A study coach that reads your live progress — tasks, revisions, mocks, errors — and answers accordingly.</div>
        </div>
        <Card title="ONE-TIME SETUP — FREE">
          <ol className="small" style={{ paddingLeft: 18, lineHeight: 2 }}>
            <li>Go to <a href="https://openrouter.ai" target="_blank" rel="noreferrer">openrouter.ai</a> → sign up free (Google login works)</li>
            <li>Open <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noreferrer">openrouter.ai/settings/keys</a> → <b>Create Key</b> → copy it (<span className="mono">sk-or-…</span>)</li>
            <li>Paste it below. Free models cost nothing (free tier: ~50 requests/day).</li>
          </ol>
          <Field label="OpenRouter API key">
            <input className="input" type="password" placeholder="sk-or-v1-…" onChange={(e) => A.saveSettings({ aiKey: e.target.value.trim() })} />
          </Field>
          <div className="small faint">
            Stored only in this browser's local storage. Never put into the app code, the GitHub repo, or JSON exports.
            Set a spending limit of $0 on the key for extra safety — free models will still work.
          </div>
        </Card>
        <Card title="OR: HOSTED ON VERCEL (KEY ON THE SERVER)">
          <div className="small muted" style={{ marginBottom: 10 }}>
            If this app is deployed on Vercel with <span className="mono">OPENROUTER_API_KEY</span> set in the project's
            environment variables, no key is needed here — the browser talks to <span className="mono">/api/chat</span> and the key stays server-side.
          </div>
          <ServerModeSetup />
        </Card>
      </div>
    );
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row spread wrap">
        <div>
          <div className="h1 row" style={{ gap: 8 }}><Sparkles size={20} /> AI Coach</div>
          <div className="small muted">Knows your live data{includeData ? '' : ' (data sharing off)'} · free model via OpenRouter</div>
        </div>
        <div className="row wrap">
          <select className="input" style={{ width: 'auto', maxWidth: 260 }} value={s.aiModel} onChange={(e) => A.saveSettings({ aiModel: e.target.value })} title="Model">
            {[...new Set([s.aiModel, ...models])].map((m) => <option key={m} value={m}>{m.replace(':free', '')}</option>)}
          </select>
          <button className="btn sm" onClick={loadModels} disabled={loadingModels} title="Fetch the current list of free models"><RefreshCw size={12} /> {loadingModels ? '…' : 'Free models'}</button>
          <button className="btn ghost sm" onClick={() => A.saveSettings({ aiKey: '' })} title="Remove API key"><KeyRound size={12} /> Key</button>
          <button className="btn ghost sm" onClick={() => A.setAiChat([])} disabled={!chat.length}><Trash2 size={12} /> Clear</button>
        </div>
      </div>

      <Card className="tight" style={{ minHeight: 320 }}>
        {chat.length === 0 ? (
          <div className="col" style={{ gap: 10, padding: '14px 4px' }}>
            <Empty title="Ask anything — the coach already sees your progress." sub="Doubts, strategy, concept explanations, mock analysis, quick quizzes." />
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              {QUICK.map(([label, prompt]) => (
                <button key={label} className="btn sm" onClick={() => ask(prompt)}>{label}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="col" style={{ gap: 10, padding: '4px 2px' }}>
            {chat.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                background: m.role === 'user' ? 'var(--accent-soft)' : 'var(--card2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '9px 13px',
                fontSize: 13.5,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.55,
              }}>
                {m.content || (busy && i === chat.length - 1 ? '…' : '')}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </Card>

      {err && <div className="small" style={{ color: 'var(--red)' }}>{err}</div>}

      <div className="row" style={{ gap: 8 }}>
        <textarea
          className="input" rows={2} style={{ resize: 'none', minHeight: 44 }}
          placeholder="Ask a doubt, request a quiz, or ask what to do next…  (Enter to send, Shift+Enter for newline)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
        />
        {busy
          ? <button className="btn danger" onClick={stop} title="Stop generating"><Square size={14} /></button>
          : <button className="btn primary" onClick={() => ask()} disabled={!input.trim()} title="Send"><Send size={14} /></button>}
      </div>

      <label className="row small muted" style={{ gap: 6, cursor: 'pointer' }}>
        <input type="checkbox" checked={includeData} onChange={(e) => setIncludeData(e.target.checked)} />
        Share my progress data with the model (needed for personalised coaching)
      </label>
      {chat.length > 0 && (
        <div className="row wrap">
          {QUICK.map(([label, prompt]) => (
            <button key={label} className="btn ghost sm" onClick={() => ask(prompt)} disabled={busy}>{label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
