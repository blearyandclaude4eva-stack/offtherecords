// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Lazy-load in-body markdown images (the hero is rendered separately in
// [slug].astro and stays eager). Defers below-the-fold images so they don't
// compete with the LCP image on first paint. See docs/specs (workshop repo).
function rehypeLazyImages() {
  return (tree) => {
    const walk = (node) => {
      if (node.type === 'element' && node.tagName === 'img') {
        node.properties = node.properties || {};
        if (!('loading' in node.properties)) node.properties.loading = 'lazy';
        if (!('decoding' in node.properties)) node.properties.decoding = 'async';
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    walk(tree);
  };
}

// Original site lived at this domain; keep it so URLs, RSS and sitemap are correct.
export default defineConfig({
  site: 'https://off-the-records.com',
  // Keep the noindexed moderation page out of the sitemap.
  integrations: [sitemap({ filter: (page) => !page.includes('/admin') })],
  markdown: {
    // Bodies contain raw <iframe> embeds (YouTube/Spotify) — allow them through.
    smartypants: false,
    rehypePlugins: [rehypeLazyImages],
  },
});
