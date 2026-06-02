-- LOCAL prototype seed only. Fake comments, no real reader data.
-- Apply with `npm run db:seed:local` (runs against the local wrangler D1).
DELETE FROM comments;

INSERT INTO comments (slug, author, email_hash, body, status, parent_id, created_at) VALUES
  ('kris-kross-jump',  'Dave',    NULL, 'Loved this. Still know every word.',                 'approved', NULL, 1704067200000),
  ('kris-kross-jump',  'Marie',   NULL, 'The diss-track detail blew my mind.',                'approved', NULL, 1704153600000),
  ('kris-kross-jump',  'Sanjay',  NULL, 'Wore my jeans backwards for a week in 1992.',        'approved', NULL, 1704240000000),
  ('kris-kross-jump',  'spammer', NULL, 'pending one that should NOT show publicly',          'pending',  NULL, 1704326400000),
  ('radiohead-creep',  'Lena',    NULL, 'That skeleton-in-the-closet framing is perfect.',    'approved', NULL, 1704412800000),
  ('radiohead-creep',  'Tom',     NULL, 'Came for the chart facts, stayed for the essay.',    'approved', NULL, 1704499200000);
