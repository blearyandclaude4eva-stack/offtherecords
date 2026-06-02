import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updated: z.coerce.date().optional(),
    year: z.string().optional(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    artist: z.string().optional(),
    song: z.string().optional(),
    chartLabel: z.string().optional(),
    chartPosition: z.string().optional(),
    chartUrl: z.string().optional(),
    author: z.string().default("Bernard O'Leary"),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    author: z.string().optional(),
  }),
});

export const collections = { blog, pages };
