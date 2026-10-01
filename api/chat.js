/* Vercel Edge Function — OpenRouter proxy.
   The API key lives ONLY in Vercel env vars (server-side), never in the browser.
   Env vars:
     OPENROUTER_API_KEY  (required)
     ACCESS_CODE         (optional — if set, requests must send matching x-app-code header) */
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (process.env.ACCESS_CODE && req.headers.get('x-app-code') !== process.env.ACCESS_CODE) {
    return new Response(JSON.stringify({ error: { message: 'Wrong or missing access code' } }), { status: 401 });
  }
  if (!process.env.OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: { message: 'OPENROUTER_API_KEY not set in Vercel env vars' } }), { status: 500 });
  }
  let body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://jee-academic-os.vercel.app',
      'X-Title': 'JEE Academic OS',
    },
    body: JSON.stringify({ model: body.model, messages: body.messages, stream: true }),
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
