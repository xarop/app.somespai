import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PageNav } from '@/components/ui/page-nav';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: `${t('legal.termsTitle')} — coslot`,
    description: t('legal.termsTitle'),
  };
}

export default async function TermesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal');

  return (
    <>
      <PageNav />
      <div className="seo-page">
        <div className="seo-page__inner seo-page__inner--wide">
          <header className="seo-page__header">
            <h1>{t('termsTitle')}</h1>
          </header>
          <div style={{ lineHeight: 1.6, color: 'var(--ink)' }}>
            <p>{t('termsPlaceholder')}</p>
          </div>
        </div>
      </div>
    </>
  );
}
