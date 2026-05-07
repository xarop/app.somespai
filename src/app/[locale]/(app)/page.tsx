import { getSpaces } from '@/lib/supabase/spaces';
import { createClient } from '@/lib/supabase/server';
import { HomeClient } from './home-client';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t('seo.homeTitle'),
    description: t('seo.homeDesc'),
  };
}

export default async function HomePage() {
  const [spaces, supabase] = await Promise.all([getSpaces(), createClient()]);
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
  return <HomeClient initialSpaces={spaces} isAdmin={isAdmin} currentUserId={user?.id} />;
}
