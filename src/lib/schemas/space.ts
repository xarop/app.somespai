import { z } from 'zod';

export const spaceTypeSchema = z.enum(['storage', 'workspace', 'garden', 'room']);
export type SpaceType = z.infer<typeof spaceTypeSchema>;

export const spaceSchema = z.object({
  id: z.string().uuid().or(z.string()),
  slug: z.string().min(1),
  ownerId: z.string().optional(),
  title: z.string().min(2).max(120),
  description: z.string().max(2000).nullable(),
  type: spaceTypeSchema,
  priceCents: z.number().int().nonnegative(),
  currency: z.string().default('EUR'),
  sizeM2: z.number().nonnegative().nullable(),
  address: z.string().nullable(),
  neighborhood: z.string().default('Vila de Gràcia'),
  city: z.string().default('Barcelona'),
  region: z.string().default('Catalunya'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string().url()).default([]),
  isFeatured: z.boolean().default(false),
  rating: z.number().min(0).max(5).default(0),
  reviewsCount: z.number().int().nonnegative().default(0),
  status: z.enum(['active', 'paused', 'removed']).default('active'),
  priceUnit: z.enum(['month', 'day', 'hour']).default('month'),
  phone: z.string().nullable().default(null),
  emailContact: z.string().nullable().default(null),
  whatsapp: z.string().nullable().default(null),
  web: z.string().nullable().default(null),
  contactDefault: z.enum(['phone', 'whatsapp', 'email', 'web']).default('web'),
});

export type Space = z.infer<typeof spaceSchema>;

export const spaceFilterSchema = z.object({
  type: spaceTypeSchema.optional(),
  featuredOnly: z.boolean().default(false),
  query: z.string().default(''),
  maxPriceCents: z.number().int().nonnegative().optional(),
  centerLat: z.number().optional(),
  centerLng: z.number().optional(),
  radiusM: z.number().int().positive().optional(),
});

export type SpaceFilter = z.infer<typeof spaceFilterSchema>;
