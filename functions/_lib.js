// Shared helpers for the comments Pages Functions. Files starting with `_` are
// not routed by Cloudflare Pages, so this is import-only.

export const MAX_AUTHOR = 80;
export const MAX_BODY = 5000;

// Per-IP rate limiting for comment posting.
export const RATE_LIMIT_MAX = 5; // max comments per window per IP
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extra },
  });
}

export function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
}

export async function sha256hex(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Validate + normalise an incoming comment payload. Returns {ok, value|error}.
export function validateComment(payload) {
  const author = (payload?.author ?? '').toString().trim();
  const body = (payload?.body ?? '').toString().trim();
  const email = (payload?.email ?? '').toString().trim();
  const parentId = payload?.parent_id != null ? Number(payload.parent_id) : null;

  if (!author) return { ok: false, error: 'Name is required.' };
  if (author.length > MAX_AUTHOR) return { ok: false, error: 'Name is too long.' };
  if (!body) return { ok: false, error: 'Comment is required.' };
  if (body.length > MAX_BODY) return { ok: false, error: 'Comment is too long.' };
  if (parentId != null && !Number.isInteger(parentId)) {
    return { ok: false, error: 'Bad parent.' };
  }
  return { ok: true, value: { author, body, email, parentId } };
}

// Verify a Cloudflare Turnstile token. If no secret is configured (local/proto),
// verification is skipped so the prototype runs without keys.
export async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true; // not configured → skip (prototype)
  if (!token) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET.trim());
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

// Salted hash of an IP for rate limiting. Raw IPs are never stored. Falls back
// to a constant when no IP header is present so the limit still groups them.
export async function ipHash(env, ip) {
  const salt = (env.IP_SALT || 'otr-default-salt').trim();
  return sha256hex(`${salt}:${ip || 'unknown'}`);
}

// True if this ip_hash has posted >= RATE_LIMIT_MAX comments in the window.
export async function isRateLimited(env, hash) {
  const since = Date.now() - RATE_LIMIT_WINDOW_MS;
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM comments WHERE ip_hash = ?1 AND created_at >= ?2`,
  )
    .bind(hash, since)
    .first();
  return (row?.n ?? 0) >= RATE_LIMIT_MAX;
}

// Constant-time-ish check that the request carries the admin bearer token.
export function isAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return false;
  const auth = request.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return Boolean(m) && m[1] === env.ADMIN_TOKEN.trim();
}
