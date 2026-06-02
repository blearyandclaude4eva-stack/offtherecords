// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Original site lived at this domain; keep it so URLs, RSS and sitemap are correct.
export default defineConfig({
  site: 'https://off-the-records.com',
  // Keep the noindexed moderation page out of the sitemap.
  integrations: [sitemap({ filter: (page) => !page.includes('/admin') })],
  markdown: {
    // Bodies contain raw <iframe> embeds (YouTube/Spotify) — allow them through.
    smartypants: false,
  },
});
