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
  ip_hash     TEXT,                                   -- sha256(IP_SALT + ip); raw IP never stored, rate-limit only
  created_at  INTEGER NOT NULL                        -- unix epoch ms
);

-- Primary read path: approved comments for a post, in order.
CREATE INDEX IF NOT EXISTS idx_comments_slug_status
  ON comments (slug, status, created_at);

-- Moderation queue.
CREATE INDEX IF NOT EXISTS idx_comments_status
  ON comments (status, created_at);

-- Per-IP rate limiting: recent comments by ip_hash.
CREATE INDEX IF NOT EXISTS idx_comments_ip_hash
  ON comments (ip_hash, created_at);

-- Newsletter subscribers. Raw email is stored (a sender needs the real address);
-- this PII lives only in D1, never in the repo. See specs/active/newsletter-capture.md.
CREATE TABLE IF NOT EXISTS subscribers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT    NOT NULL UNIQUE,
  status      TEXT    NOT NULL DEFAULT 'active',   -- active | unsubscribed
  source      TEXT,                                -- where they signed up
  created_at  INTEGER NOT NULL                     -- unix epoch ms
);
CREATE INDEX IF NOT EXISTS idx_subscribers_status
  ON subscribers (status, created_at);
