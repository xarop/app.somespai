import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSpaceBySlug } from "@/lib/supabase/spaces";
import { createClient } from "@/lib/supabase/server";
import { getSomtallersUrl } from "@/lib/brand";
import { getWorkshopsBySpace } from "@/lib/supabase/workshops";
import { SpaceWorkshops } from "@/components/space/space-workshops";
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

    const canonicalPath = `/espai/${slug}`;

    return {
      title: pageTitle,
      description: desc,
      alternates: {
        canonical: `https://app.somespai.net${locale === "ca" ? "" : `/${locale}`}${canonicalPath}`,
        languages: {
          ca: `https://app.somespai.net${canonicalPath}`,
          es: `https://app.somespai.net/es${canonicalPath}`,
          en: `https://app.somespai.net/en${canonicalPath}`,
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

  let isWorkshopVenue = false;
  let workshops: Awaited<ReturnType<typeof getWorkshopsBySpace>> = [];
  try {
    const { data: venue } = await supabase
      .from("spaces")
      .select("is_workshop_venue")
      .eq("id", space.id)
      .maybeSingle();
    isWorkshopVenue = Boolean(venue?.is_workshop_venue);
    workshops = await getWorkshopsBySpace(space.id);
  } catch (err) {
    console.error("[space workshops] failed:", err);
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
      url: `https://app.somespai.net/${locale}/espai/${space.slug}`,
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
      <SpaceWorkshops
        space={space}
        locale={locale}
        isVenue={isWorkshopVenue || workshops.length > 0}
        workshops={workshops.map((w) => ({
          slug: w.slug,
          title: w.title,
          category: w.category,
          price: w.price,
          next: w.sessions
            .map((s) => s.startTime)
            .filter((d) => new Date(d) >= new Date())
            .sort()[0] ?? null,
        }))}
        tallersUrl={getSomtallersUrl()}
      />
    </>
  );
}
