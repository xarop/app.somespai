import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDistinctCityTypePairs, getSpacesByCity } from '@/lib/supabase/spaces-seo';
import { getTypeFromSlug, getSlugFromType, TYPE_TO_SLUG_BY_LOCALE } from '@/lib/seo/type-slugs';
import { HomeClient } from '@/app/[locale]/(app)/home-client';
import type { SpaceType } from '@/lib/schemas/space';

interface Props {
  params: Promise<{ locale: string; city: string; type: string }>;
}

export async function generateStaticParams({ params }: { params: { locale: string; city: string } }) {
  const { locale, city } = params;
  const pairs = await getDistinctCityTypePairs();
  const cityTypes = [...new Set(
    pairs.filter((p) => p.city.toLowerCase() === city).map((p) => p.type),
  )];
  const slugMap = TYPE_TO_SLUG_BY_LOCALE[locale] ?? TYPE_TO_SLUG_BY_LOCALE.ca;
  return cityTypes
    .map((type) => ({ type: slugMap[type as SpaceType] }))
    .filter((x) => x.type);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: encodedCity, type } = await params;
  const city = decodeURIComponent(encodedCity);
  const dbType = getTypeFromSlug(type, locale);
  if (!dbType) return {};
  const spaces = await getSpacesByCity(city, dbType);
  const cityLabel = spaces[0]?.city ?? city;
  return {
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} a ${cityLabel} — somespai`,
    description: `${spaces.length} ${type} disponibles a ${cityLabel}.`,
  };
}

export default async function CityTypePage({ params }: Props) {
  const { locale, city: encodedCity, type } = await params;
  const city = decodeURIComponent(encodedCity);

  const dbType = getTypeFromSlug(type, locale);
  if (!dbType) notFound();

  const spaces = await getSpacesByCity(city, dbType);
  if (spaces.length === 0) notFound();

  const cityLabel = spaces[0].city ?? city;
  return (
    <HomeClient
      initialSpaces={spaces}
      isAdmin={false}
      initialFilter={dbType}
      cityContext={cityLabel}
      typeContext={dbType}
    />
  );
}
