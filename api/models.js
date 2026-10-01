/* Vercel Edge Function — list OpenRouter free models (no key exposure). */
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (process.env.ACCESS_CODE && req.headers.get('x-app-code') !== process.env.ACCESS_CODE) {
    return new Response(JSON.stringify({ error: { message: 'Wrong or missing access code' } }), { status: 401 });
  }
  const upstream = await fetch('https://openrouter.ai/api/v1/models', {
    headers: process.env.OPENROUTER_API_KEY ? { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } : {},
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=3600' },
  });
}
