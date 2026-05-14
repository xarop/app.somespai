import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { PageNav } from '@/components/ui/page-nav';
import { getCitiesWithStats } from '@/lib/supabase/spaces-seo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('cities');
  return {
    title: `${t('title')} — somespai`,
    description: t('subtitle'),
  };
}

export default async function CitatsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('cities');

  const cities = await getCitiesWithStats();

  return (
    <>
      <PageNav />
      <div className="page-form">
        <div className="page-form__inner page-form__inner--wide">

          <header className="page-form__header">
            <a href={`/${locale}`} className="page-form__back">← Inici</a>
            <h1>{t('title')}</h1>
            <p className="page-form__subtitle">{t('subtitle')}</p>
          </header>

          <div className="cities-grid">
            {cities.map(({ city, count, neighborhoods }) => (
              <a
                key={city}
                href={`/${locale}/${city.toLowerCase()}`}
                className="city-card"
              >
                <div className="city-card__head">
                  <span className="city-card__name">{city}</span>
                  <span className="city-card__count">
                    {t('spaces', { n: count })}
                  </span>
                </div>
                {neighborhoods.length > 0 && (
                  <div className="city-card__neighborhoods">
                    {neighborhoods.slice(0, 8).map(({ name }) => (
                      <span key={name} className="city-card__nbhd">{name}</span>
                    ))}
                    {neighborhoods.length > 8 && (
                      <span className="city-card__nbhd city-card__nbhd--more">
                        +{neighborhoods.length - 8}
                      </span>
                    )}
                  </div>
                )}
              </a>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
