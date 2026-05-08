import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSpaceBySlug } from "@/lib/supabase/spaces";
import { createClient } from "@/lib/supabase/server";
import { SpaceDetailClient } from "./space-detail-client";

// Always render dynamically — cookies() is required for auth state
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  try {
    const space = await getSpaceBySlug(slug);
    if (!space) return {};

    const t = await getTranslations({ locale });
    const typeLabel = t(`filter.${space.type as any}`);
    const cityText = space.city ? ` a ${space.city}` : "";

    const pageTitle = `${space.title} - ${typeLabel}${cityText}`;
    const desc = space.description
      ? space.description.substring(0, 155) +
        (space.description.length > 155 ? "..." : "")
      : undefined;

    const canonicalPath = `/slot/${slug}`;

    return {
      title: pageTitle,
      description: desc,
      alternates: {
        canonical: `https://coslot.space${locale === "ca" ? "" : `/${locale}`}${canonicalPath}`,
        languages: {
          ca: `https://coslot.space${canonicalPath}`,
          es: `https://coslot.space/es${canonicalPath}`,
          en: `https://coslot.space/en${canonicalPath}`,
        },
      },
      openGraph: {
        title: pageTitle,
        description: desc,
        type: "website",
        ...(space.photos && space.photos.length > 0
          ? { images: [space.photos[0]] }
          : {}),
      },
    };
  } catch {
    return {};
  }
}

export default async function SpaceDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [space, supabase] = await Promise.all([
    getSpaceBySlug(slug),
    createClient(),
  ]);
  if (!space) notFound();

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
    "@type": "Product",
    name: space.title,
    description: space.description || undefined,
    image: space.photos?.length ? space.photos : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (space.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: `https://coslot.space/${locale}/slot/${space.slug}`,
    },
    aggregateRating:
      space.reviewsCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: space.rating.toFixed(1),
            reviewCount: space.reviewsCount,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SpaceDetailClient
        space={space}
        isAdmin={isAdmin}
        currentUserId={user?.id}
      />
    </>
  );
}
