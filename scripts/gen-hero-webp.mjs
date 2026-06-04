// Generate WebP versions of post hero images for free image-delivery savings.
// Reads every `heroImage` from blog/page frontmatter and writes a sibling .webp
// into public/, skipping ones already present or already WebP. Run via
// `npm run gen:webp` locally; the .webp files are committed so the Cloudflare
// build does no image work. See docs/specs/active/hero-webp.md (workshop repo).
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const contentDirs = ['src/content/blog', 'src/content/pages'].map((d) => path.join(root, d));

const heroes = new Set();
for (const dir of contentDirs) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const text = readFileSync(path.join(dir, file), 'utf8');
    const m = text.match(/^heroImage:\s*["']?([^"'\n]+)["']?\s*$/m);
    if (m) heroes.add(m[1].trim());
  }
}

let made = 0;
let skipped = 0;
let missing = 0;
for (const hero of heroes) {
  if (/\.webp$/i.test(hero)) {
    skipped++;
    continue;
  }
  const src = path.join(root, 'public', hero);
  const out = src.replace(/\.(jpe?g|png)$/i, '.webp');
  if (!existsSync(src)) {
    console.warn(`  missing source: ${hero}`);
    missing++;
    continue;
  }
  if (existsSync(out)) {
    skipped++;
    continue;
  }
  await sharp(src).webp({ quality: 80 }).toFile(out);
  made++;
  console.log(`  + ${path.relative(root, out)}`);
}

console.log(`\nWebP: ${made} created, ${skipped} skipped, ${missing} missing (${heroes.size} heroes)`);
