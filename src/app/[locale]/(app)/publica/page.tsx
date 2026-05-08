import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PublishForm } from './publish-form';
import { PageNav } from '@/components/ui/page-nav';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: `${t('publish.title')} — BRAND_NAME_PLACEHOLDER`,
    description: t('publish.subtitle'),
  };
}

export default async function PublicarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const t = await getTranslations('publish');

  return (
    <>
    <PageNav />
    <div className="page-form">
      <div className="page-form__inner">
        <header className="page-form__header">
          <a href="/" className="page-form__back">← {''}</a>
          <h1>{t('title')}</h1>
          <p className="page-form__subtitle">{t('subtitle')}</p>
        </header>
        <PublishForm isLoggedIn={!!user} />
      </div>
    </div>
    </>
  );
}
