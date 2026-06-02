// Comments API for a single post.
//   GET  /api/comments/:slug  -> approved comments, oldest first
//   POST /api/comments/:slug  -> insert a pending comment (Turnstile + honeypot)
import { json, sha256hex, validateComment, verifyTurnstile } from '../../_lib.js';

export async function onRequestGet({ params, env }) {
  const slug = params.slug;
  const { results } = await env.DB.prepare(
    `SELECT id, author, email_hash, body, parent_id, created_at
       FROM comments
      WHERE slug = ?1 AND status = 'approved'
      ORDER BY created_at ASC`,
  )
    .bind(slug)
    .all();
  return json({ comments: results ?? [] });
}

export async function onRequestPost({ params, env, request }) {
  const slug = params.slug;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Honeypot: real users never fill `website`. Pretend success, store nothing.
  if (payload.website) return json({ status: 'pending' }, 202);

  const ip = request.headers.get('cf-connecting-ip');
  const ok = await verifyTurnstile(env, payload.turnstileToken, ip);
  if (!ok) return json({ error: 'Spam check failed. Please try again.' }, 400);

  const check = validateComment(payload);
  if (!check.ok) return json({ error: check.error }, 400);
  const { author, body, email, parentId } = check.value;

  const emailHash = email ? await sha256hex(email.toLowerCase()) : null;
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO comments (slug, author, email_hash, body, status, parent_id, created_at)
     VALUES (?1, ?2, ?3, ?4, 'pending', ?5, ?6)`,
  )
    .bind(slug, author, emailHash, body, parentId, now)
    .run();

  // Post-moderation: not visible until approved.
  return json({ status: 'pending' }, 202);
}
