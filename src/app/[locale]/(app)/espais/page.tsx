import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageNav } from '@/components/ui/page-nav';
import { getAllActiveSpaces } from '@/lib/supabase/spaces-seo';
import { EspaisClient } from './espais-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: `${t('seo.allSpacesTitle')} — somespai`,
    description: t('seo.allSpacesDesc'),
  };
}

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function EspaisPage({ params }: Props) {
  const { locale } = await params;
  const [spaces, t] = await Promise.all([
    getAllActiveSpaces(),
    getTranslations('seo'),
  ]);

  return (
    <>
      <PageNav />
      <div className="seo-page">
        <div className="seo-page__inner seo-page__inner--wide">
          <nav className="seo-breadcrumb">
            <a href={`/${locale}`}>somespai</a>
            <span>›</span>
            <span>{t('allSpacesTitle')}</span>
          </nav>

          <header className="seo-page__header">
            <h1>{t('allSpacesTitle')}</h1>
            <p className="seo-page__desc">{t('allSpacesDesc')}</p>
          </header>

          <EspaisClient spaces={spaces} locale={locale} />
        </div>
      </div>
    </>
  );
}
