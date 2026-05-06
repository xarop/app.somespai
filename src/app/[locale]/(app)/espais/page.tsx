import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageNav } from '@/components/ui/page-nav';
import { getAllActiveSpaces } from '@/lib/supabase/spaces-seo';
import { EspaisClient } from './espais-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Tots els espais — somespai',
    description: "Llistat complet d'espais disponibles a Somespai: estudis, trasters, sales i exteriors. Cerca i filtra per tipus, ciutat i equipaments.",
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
