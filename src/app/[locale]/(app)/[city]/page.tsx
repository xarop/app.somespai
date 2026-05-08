import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getDistinctCities, getSpacesByCity } from "@/lib/supabase/spaces-seo";
import { HomeClient } from "@/app/[locale]/(app)/home-client";

interface Props {
  params: Promise<{ locale: string; city: string }>;
}

export async function generateStaticParams() {
  const cities = await getDistinctCities();
  return cities.map((city) => ({ city: city.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: encodedCity } = await params;
  const t = await getTranslations({ locale });
  const city = decodeURIComponent(encodedCity);
  const spaces = await getSpacesByCity(city);
  const cityLabel = spaces[0]?.city ?? city;
  return {
    title: `${t("seo.cityTitle", { city: cityLabel })} — coslot`,
    description: t("seo.cityDesc", { count: spaces.length, city: cityLabel }),
  };
}

export default async function CityPage({ params }: Props) {
  const { city: encodedCity } = await params;
  const city = decodeURIComponent(encodedCity);
  const spaces = await getSpacesByCity(city);
  if (spaces.length === 0) notFound();
  const cityLabel = spaces[0].city ?? city;
  return (
    <HomeClient
      initialSpaces={spaces}
      isAdmin={false}
      cityContext={cityLabel}
    />
  );
}
