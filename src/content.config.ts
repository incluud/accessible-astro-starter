// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content'

// 2. Import loader(s)
import { glob } from 'astro/loaders'

// 3. Define your collection(s)
const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    link: z.string().url().optional(),
  }),
})

const books = defineCollection({
  // Use the loader here too!
  loader: glob({ pattern: '**/*.mdx', base: './src/content/books' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    author: z.string(),
    description: z.string(),
    featuredImage: image(), 
    tags: z.array(z.string()),
  }),
});

// 4. Export collections
export const collections = { projects, books }