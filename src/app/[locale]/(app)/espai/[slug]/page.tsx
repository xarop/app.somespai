import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getSpaceBySlug } from '@/lib/supabase/spaces';
import { createClient } from '@/lib/supabase/server';
import { SpaceDetailClient } from './space-detail-client';

// Always render dynamically — cookies() is required for auth state
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
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
  } catch {
    return {};
  }
}

export default async function SpaceDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [space, supabase] = await Promise.all([getSpaceBySlug(slug), createClient()]);
  if (!space) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    if (user.email === process.env.ADMIN_EMAIL || user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      isAdmin = true;
    } else {
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (profile?.is_admin) isAdmin = true;
    }
  }

  return <SpaceDetailClient space={space} isAdmin={isAdmin} currentUserId={user?.id} />;
}
