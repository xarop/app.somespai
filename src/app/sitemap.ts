import type { MetadataRoute } from "next";
import {
  getDistinctCities,
  getDistinctCityTypePairs,
  getAllSlugsPublic,
} from "@/lib/supabase/spaces-seo";
import { TYPE_TO_SLUG_BY_LOCALE } from "@/lib/seo/type-slugs";
import type { SpaceType } from "@/lib/schemas/space";

const BASE = "https://app.somespai.net";
const LOCALES = ["ca", "es", "en"] as const;

export const revalidate = 0; // Force generating fresh sitemap

function u(path: string, locale: string): string {
  const prefix = locale === "ca" ? "" : `/${locale}`;
  return `${BASE}${prefix}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cities, pairs, slugs] = await Promise.all([
    getDistinctCities(),
    getDistinctCityTypePairs(),
    getAllSlugsPublic(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  for (const locale of LOCALES) {
    entries.push({
      url: u("/", locale),
      changeFrequency: "daily",
      priority: 1.0,
    });
    entries.push({
      url: u("/espais", locale),
      changeFrequency: "daily",
      priority: 0.8,
    });
    entries.push({
      url: u("/ajuda", locale),
      changeFrequency: "monthly",
      priority: 0.5,
    });
    entries.push({
      url: u("/sitemap", locale),
      changeFrequency: "weekly",
      priority: 0.4,
    });
  }

  // Space detail pages
  for (const slug of slugs) {
    for (const locale of LOCALES) {
      entries.push({
        url: u(`/espai/${slug}`, locale),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  // City pages
  for (const city of cities) {
    const citySlug = city.toLowerCase();
    for (const locale of LOCALES) {
      entries.push({
        url: u(`/${citySlug}`, locale),
        changeFrequency: "daily",
        priority: 0.9,
      });
    }
  }

  // City+type pages
  for (const { city, type } of pairs) {
    const citySlug = city.toLowerCase();
    for (const locale of LOCALES) {
      const typeSlug = TYPE_TO_SLUG_BY_LOCALE[locale]?.[type as SpaceType];
      if (!typeSlug) continue;
      entries.push({
        url: u(`/${citySlug}/${typeSlug}`, locale),
        changeFrequency: "daily",
        priority: 0.85,
      });
    }
  }

  return entries;
}
