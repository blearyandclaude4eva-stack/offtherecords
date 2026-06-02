// Verification stub for the Cloudflare Pages Functions + D1 pipeline.
// GET /api/health -> { ok, d1 } where d1 is whether the DB binding resolved and
// the comments table is reachable. Lets us confirm the deploy + binding before
// the full comments API exists (docs/specs/active/comments.md). Safe to delete
// once comments ship.
export async function onRequest(context) {
  const result = { ok: true, d1: false };
  try {
    if (context.env.DB) {
      await context.env.DB.prepare('SELECT 1 FROM comments LIMIT 1').all();
      result.d1 = true;
    }
  } catch {
    result.d1 = false;
  }
  return new Response(JSON.stringify(result), {
    headers: { 'content-type': 'application/json' },
  });
}
