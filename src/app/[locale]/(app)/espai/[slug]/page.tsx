import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getSpaceBySlug, getAllSlugs } from '@/lib/supabase/spaces';
import { createClient } from '@/lib/supabase/server';
import { SpaceDetailClient } from './space-detail-client';

// Supported locales for static export
const SUPPORTED_LOCALES = ['ca', 'es', 'en'];

export async function generateStaticParams() {
  try {
    const slugs = await getAllSlugs();
    return SUPPORTED_LOCALES.flatMap((locale) =>
      slugs.map((slug) => ({ locale, slug })),
    );
  } catch {
    // Supabase unavailable at build time (e.g. static export without DB).
    return [];
  }
}

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const space = await getSpaceBySlug(slug);
  if (!space) return {};
  return {
    title: space.title,
    description: space.description ?? undefined,
    openGraph: {
      title: space.title,
      description: space.description ?? undefined,
      type: 'website',
    },
  };
}

export default async function SpaceDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [space, supabase] = await Promise.all([getSpaceBySlug(slug), createClient()]);
  if (!space) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.email === process.env.ADMIN_EMAIL;

  return <SpaceDetailClient space={space} isAdmin={isAdmin} currentUserId={user?.id} />;
}
