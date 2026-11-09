import { getSpaces } from "@/lib/supabase/spaces";
import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "./home-client";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getBrand } from "@/lib/brand";
import { WorkshopsHome } from "@/components/workshop/workshops-home";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const brand = getBrand();
  if (brand.id === "somtallers") {
    const titles = {
      ca: "Tallers i activitats creatives a prop teu",
      es: "Talleres y actividades creativas cerca de ti",
      en: "Creative workshops and activities near you",
    };
    const title = titles[locale as keyof typeof titles] ?? titles.ca;
    return {
      title,
      description: brand.tagline,
      metadataBase: new URL(brand.domain),
      alternates: { canonical: `${brand.domain}${locale === "ca" ? "" : `/${locale}`}` },
      openGraph: { title: `${brand.name} — ${title}`, description: brand.tagline, url: brand.domain },
    };
  }
  const t = await getTranslations({ locale });
  const title = t("seo.homeTitle");
  const desc = t("seo.homeDesc");

  return {
    title,
    description: desc,
    alternates: {
      canonical: `https://app.somespai.net${locale === "ca" ? "" : `/${locale}`}`,
      languages: {
        ca: "https://app.somespai.net",
        es: "https://app.somespai.net/es",
        en: "https://app.somespai.net/en",
      },
    },
    openGraph: {
      title: `${title} · Somespai`,
      description: desc,
      type: "website",
      url: `https://app.somespai.net${locale === "ca" ? "" : `/${locale}`}`,
    },
  };
}

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    date?: string;
    location?: string;
    latitude?: string;
    longitude?: string;
  }>;
}) {
  const brand = getBrand();
  if (brand.id === "somtallers") {
    const [{ locale }, filters] = await Promise.all([params, searchParams]);
    const latitude = filters.latitude ? Number(filters.latitude) : undefined;
    const longitude = filters.longitude ? Number(filters.longitude) : undefined;
    return (
      <WorkshopsHome
        locale={locale}
        category={filters.category}
        date={filters.date}
        location={filters.location}
        latitude={latitude}
        longitude={longitude}
      />
    );
  }
  const [{ locale }, spaces, supabase] = await Promise.all([
    params,
    getSpaces(),
    createClient(),
  ]);
  const t = await getTranslations({ locale });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    if (
      user.email === process.env.ADMIN_EMAIL ||
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
    ) {
      isAdmin = true;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      if (profile?.is_admin) isAdmin = true;
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Somespai",
    url: "https://app.somespai.net",
    description: t("seo.homeDesc"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://app.somespai.net/espais?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
        initialSpaces={spaces}
        isAdmin={isAdmin}
        currentUserId={user?.id}
      />
    </>
  );
}
