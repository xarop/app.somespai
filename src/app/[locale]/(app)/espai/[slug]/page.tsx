// Supported locales for static export
const SUPPORTED_LOCALES = ['ca', 'es', 'en'];

export function generateStaticParams() {
  // For each locale and each mock space, return a param object
  return SUPPORTED_LOCALES.flatMap((locale) =>
    MOCK_SPACES.map((space) => ({
      locale,
      slug: space.slug,
    }))
  );
}
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { MOCK_SPACES } from '@/lib/data/mock-spaces';
import { SpaceDetailClient } from './space-detail-client';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const space = MOCK_SPACES.find((s) => s.slug === slug);
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

  const space = MOCK_SPACES.find((s) => s.slug === slug);
  if (!space) notFound();

  return <SpaceDetailClient space={space} />;
}
