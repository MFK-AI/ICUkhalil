import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    standfirst: z.string(),
    category: z.string(),
    published: z.coerce.date(),
    reviewed: z.string(),
    nextReview: z.string(),
    keywords: z.string().optional(),
    disclosure: z.string(),
    references: z.string(),
  }),
});

export const collections = { blog };
