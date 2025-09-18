import { defineCollection, z } from 'astro:content';

const portfolioCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['rings', 'necklaces', 'earrings', 'bracelets', 'custom', 'sculptures', 'pendants', 'pins']),
    language: z.enum(['de', 'en']),
    price: z.string().optional(),
    featured: z.boolean().default(false),
    image: z.string(),
    gallery: z.array(z.string()).optional(),
    youtubeVideoId: z.string().optional(),
    youtubeAspectRatio: z.enum(['16:9', '9:16']).optional().default('16:9'),
    videoUrl: z.string().optional(), // For backward compatibility
    materials: z.array(z.string()).optional(),
    client: z.string().optional(),
    projectDate: z.string().optional(),
    dimensions: z.string().optional(),
    weight: z.string().optional(),
    certifications: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    publishedAt: z.date(),
  }),
});

const classesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    excerpt: z.string(),
    category: z.enum(['education', 'care', 'investment', 'design', '3d-design']),
    language: z.enum(['de', 'en']),
    categoryDisplay: z.string(),
    image: z.string(),
    duration: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'all-levels']).default('beginner'),
    featured: z.boolean().default(false),
    author: z.string().default('Gesa Pickbrenner'),
    tags: z.array(z.string()).optional(),
    link: z.string(),
    platform: z.string().optional(),
    directLink: z.string().optional(),
    publishedAt: z.date(),
    updatedAt: z.date().optional(),
  }),
});

export const collections = {
  portfolio: portfolioCollection,
  classes: classesCollection,
};
