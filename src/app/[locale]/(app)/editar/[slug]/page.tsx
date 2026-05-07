import { notFound, redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getSpaceBySlugForOwner } from '@/lib/supabase/spaces';
import { EditSpaceForm } from './edit-form';
import { PageNav } from '@/components/ui/page-nav';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function EditSpacePage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  let isAdmin = false;
  if (user.email === process.env.ADMIN_EMAIL || user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    isAdmin = true;
  } else {
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (profile?.is_admin) isAdmin = true;
  }
  const space = await getSpaceBySlugForOwner(slug, user.id);
  if (!space) notFound();

  const t = await getTranslations('edit');

  return (
    <>
    <PageNav />
    <div className="page-form">
      <div className="page-form__inner">
        <header className="page-form__header">
          <a href={`/${locale}/espai/${space.slug}`} className="page-form__back">←</a>
          <h1>{t('title')}</h1>
          <p className="page-form__subtitle">{space.title}</p>
        </header>
        <EditSpaceForm space={space} isAdmin={isAdmin} />
      </div>
    </div>
    </>
  );
}
