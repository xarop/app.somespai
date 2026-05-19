import { z } from 'zod';

/**
 * Zod schemas for the reverse-geocode API route.
 *
 * Per AGENTS.md §2, Zod schemas are the single source of truth: they validate
 * the API request server-side and provide types for the client.
 */

export const reverseGeocodeRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  /** BCP-47 language code from `next-intl` (e.g. "ca", "es", "en"). */
  language: z.string().min(2).max(5).optional(),
});

export type ReverseGeocodeRequest = z.infer<typeof reverseGeocodeRequestSchema>;

export const reverseGeocodeResponseSchema = z.object({
  formatted: z.string(),
  street: z.string(),
  road: z.string(),
  houseNumber: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  province: z.string(),
  region: z.string(),
  country: z.string(),
  postalCode: z.string(),
  placeId: z.string(),
  lat: z.number(),
  lng: z.number(),
});

export type ReverseGeocodeResponse = z.infer<
  typeof reverseGeocodeResponseSchema
>;

export const forwardGeocodeRequestSchema = z.object({
  q: z.string().min(1),
  language: z.string().min(2).max(5).optional(),
});

export type ForwardGeocodeRequest = z.infer<typeof forwardGeocodeRequestSchema>;

export const forwardGeocodeResponseSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  formatted: z.string(),
});

export type ForwardGeocodeResponse = z.infer<
  typeof forwardGeocodeResponseSchema
>;

