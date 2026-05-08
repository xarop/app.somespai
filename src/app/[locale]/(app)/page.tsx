import { getSpaces } from "@/lib/supabase/spaces";
import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "./home-client";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
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
}: {
  params: Promise<{ locale: string }>;
}) {
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
