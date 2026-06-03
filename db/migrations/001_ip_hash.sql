-- Migration 001: add ip_hash for per-IP rate limiting.
-- schema.sql uses CREATE TABLE IF NOT EXISTS, so the existing remote `comments`
-- table won't pick up the new column on re-apply — run this once against the
-- live DB:  npx wrangler d1 execute off-the-records-comments --remote --file=db/migrations/001_ip_hash.sql
-- (No explicit BEGIN/COMMIT: remote D1 rejects manual transaction control that
--  local accepts — statements run individually.)

ALTER TABLE comments ADD COLUMN ip_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_comments_ip_hash
  ON comments (ip_hash, created_at);
