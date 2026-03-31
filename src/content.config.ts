import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const days = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/days' }),
  schema: z.object({
    painting: z.array(z.string()).default([]),
    writing: z.array(z.string()).default([]),
    code: z.array(z.string()).default([]),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = { days, writing };
