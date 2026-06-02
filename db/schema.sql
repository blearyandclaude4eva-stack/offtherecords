-- Off The Records — comments schema (Cloudflare D1 / SQLite).
-- See docs/specs/active/comments.md. Apply with `npm run db:apply` (remote)
-- or `npm run db:apply:local` (local wrangler dev).

CREATE TABLE IF NOT EXISTS comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL,                       -- post id / permalink slug
  author      TEXT    NOT NULL,
  email_hash  TEXT,                                   -- sha256(email); raw email never stored
  body        TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'pending',     -- pending | approved | spam
  parent_id   INTEGER,                                -- one level of threading; NULL = top-level
  created_at  INTEGER NOT NULL                        -- unix epoch ms
);

-- Primary read path: approved comments for a post, in order.
CREATE INDEX IF NOT EXISTS idx_comments_slug_status
  ON comments (slug, status, created_at);

-- Moderation queue.
CREATE INDEX IF NOT EXISTS idx_comments_status
  ON comments (status, created_at);
