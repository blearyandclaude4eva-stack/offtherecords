// Moderation endpoint (token-guarded by ADMIN_TOKEN).
//   GET  /api/admin/comments?status=pending   -> list for review
//   POST /api/admin/comments  {id, action}    -> approve | reject | spam
import { json, isAdmin } from '../../_lib.js';

const ACTIONS = { approve: 'approved', reject: 'rejected', spam: 'spam' };

export async function onRequestGet({ env, request }) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized.' }, 401);
  const status = new URL(request.url).searchParams.get('status') || 'pending';
  const { results } = await env.DB.prepare(
    `SELECT id, slug, author, email_hash, body, status, parent_id, created_at
       FROM comments
      WHERE status = ?1
      ORDER BY created_at ASC`,
  )
    .bind(status)
    .all();
  return json({ comments: results ?? [] });
}

export async function onRequestPost({ env, request }) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized.' }, 401);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const id = Number(payload.id);
  const newStatus = ACTIONS[payload.action];
  if (!Number.isInteger(id) || !newStatus) {
    return json({ error: 'Bad id or action.' }, 400);
  }

  const res = await env.DB.prepare(`UPDATE comments SET status = ?1 WHERE id = ?2`)
    .bind(newStatus, id)
    .run();

  return json({ ok: true, id, status: newStatus, changed: res.meta?.changes ?? 0 });
}
