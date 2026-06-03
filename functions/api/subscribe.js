// Newsletter signup capture.
//   POST /api/subscribe  { email, source?, website? (honeypot), turnstileToken }
// Stores the email in D1 (dedup on unique email). Sending is handled elsewhere/later.
import { json, isEmail, verifyTurnstile } from '../_lib.js';

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
  const ok = await verifyTurnstile(env, payload.turnstileToken, ip);
  if (!ok) return json({ error: 'Spam check failed. Please try again.' }, 400);

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
