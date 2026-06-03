// Newsletter signup capture.
//   POST /api/subscribe  { email, source?, website? (honeypot), turnstileToken }
// Stores the email in D1 (dedup on unique email). Sending is handled elsewhere/later.
import { json, isEmail } from '../_lib.js';

export async function onRequestPost({ env, request }) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Honeypot: real users never fill `website`. Pretend success, store nothing.
  if (payload.website) return json({ status: 'ok' }, 202);

  const ip = request.headers.get('cf-connecting-ip');
  // TEMP DIAGNOSTIC (2026-06-03): surface the exact Turnstile failure reason on the
  // form so we can pinpoint why subscribe rejects. Revert to verifyTurnstile() after.
  const token = payload.turnstileToken;
  if (env.TURNSTILE_SECRET) {
    if (!token) {
      return json(
        { error: 'DIAG: no token issued — widget did not solve (hostname/render/script).' },
        400,
      );
    }
    const fd = new FormData();
    fd.append('secret', env.TURNSTILE_SECRET);
    fd.append('response', token);
    if (ip) fd.append('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: fd,
    });
    const d = await r.json().catch(() => ({}));
    if (d.success !== true) {
      return json(
        {
          error: `DIAG: verify failed — codes=${JSON.stringify(d['error-codes'] || [])} hostname=${d.hostname || 'n/a'}`,
        },
        400,
      );
    }
  }

  const email = (payload.email ?? '').toString().trim().toLowerCase();
  if (!isEmail(email)) return json({ error: 'Please enter a valid email address.' }, 400);

  const source = (payload.source ?? '').toString().slice(0, 60) || null;
  await env.DB.prepare(
    `INSERT OR IGNORE INTO subscribers (email, status, source, created_at)
     VALUES (?1, 'active', ?2, ?3)`,
  )
    .bind(email, source, Date.now())
    .run();

  // 202 whether new or already-subscribed — don't reveal which.
  return json({ status: 'ok' }, 202);
}
