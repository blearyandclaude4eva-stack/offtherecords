# Off The Records

Static [Astro](https://astro.build) rebuild of the *Off The Records* blog — "Stories
about and inspired by UK Top 40 hits from 1975 to 1999." Migrated off self-hosted
WordPress (which kept falling over) to a free static deploy on Cloudflare Pages.

This is the **deployable site repo**. The migration tooling, the WordPress export
(which contains reader PII), and the project docs/specs live separately in the local
workshop at `~/Data/Projects/off-the-records/` and are not part of this repo.

## Commands

| Command           | Action                                      |
| ----------------- | ------------------------------------------- |
| `npm install`     | Install dependencies                        |
| `npm run dev`     | Local dev server at `localhost:4321`        |
| `npm run build`   | Build static site to `./dist/`              |
| `npm run preview` | Preview the production build locally        |

## Structure

- `src/content/blog/` — 102 published posts (Markdown + frontmatter), migrated from the WXR export.
- `src/content/pages/` — 4 static pages (About, Newsletter, Archive, Privacy).
- `src/content.config.ts` — content collection schemas.
- `src/pages/[slug].astro` — renders posts and pages at root-level URLs (`/kris-kross-jump/`), preserving the original WordPress permalinks.
- `src/pages/rss.xml.js` — RSS feed (handy for the planned Buttondown newsletter).
- `functions/` — Cloudflare Pages Functions (comments API + health check).
- `db/schema.sql` — comments table schema for D1.

Content was generated from the WordPress export by the migration scripts in the
workshop folder; all 305 images are localized into `public/images/`.

## Deploy (Cloudflare Pages)

The site is a static Astro build; Cloudflare Pages serves `dist/` and auto-runs any
Pages Functions in `functions/`. Config lives in `wrangler.toml`.

**Pages project settings** (dashboard, when connecting the repo):
- Build command: `npm run build`
- Build output directory: `dist`

**Comments database (D1)** — one-time setup:
```sh
npx wrangler login
npm run db:create        # prints a database_id → paste it into wrangler.toml
npm run db:apply         # applies db/schema.sql to the remote D1
```

**Local Functions + D1 dev (with comments):**
```sh
npm run build
npm run db:apply:local   # create the comments table in the local D1
npm run db:seed:local    # optional: fake comments to see the UI
npm run cf:dev           # serves dist/ + functions/ with the D1 binding
```
Local secrets live in `.dev.vars` (git-ignored): `ADMIN_TOKEN` for moderation;
`TURNSTILE_SECRET` left unset locally so the spam check is skipped.

**Comments env vars (set on the Pages project for production):**
- `PUBLIC_TURNSTILE_SITEKEY` — Turnstile widget key (public)
- `TURNSTILE_SECRET` — Turnstile server key; while unset, spam verification is skipped
- `ADMIN_TOKEN` — bearer token for the moderation endpoints (`/api/admin/comments`)

Health check after deploy: `GET /api/health` → `{ "ok": true, "d1": true }` confirms
the Functions runtime and D1 binding are live.
