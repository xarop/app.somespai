import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageNav } from '@/components/ui/page-nav';
import {
  getDistinctCities,
  getDistinctCityTypePairs,
  getAllActiveSpacesSummary,
} from '@/lib/supabase/spaces-seo';
import { TYPE_TO_SLUG_BY_LOCALE } from '@/lib/seo/type-slugs';
import type { SpaceType } from '@/lib/schemas/space';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'sitemap' });
  return { title: `${t('title')} — coslot`, description: t('desc') };
}

export default async function MapaWebPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [cities, pairs, spaces, t, ts] = await Promise.all([
    getDistinctCities(),
    getDistinctCityTypePairs(),
    getAllActiveSpacesSummary(),
    getTranslations('sitemap'),
    getTranslations('seo'),
  ]);

  const localePrefix = locale === 'ca' ? '' : `/${locale}`;

  // Group city+type pairs by city
  const pairsByCity = new Map<string, string[]>();
  for (const { city, type } of pairs) {
    const typeSlug = TYPE_TO_SLUG_BY_LOCALE[locale]?.[type as SpaceType];
    if (!typeSlug) continue;
    const list = pairsByCity.get(city) ?? [];
    list.push(typeSlug);
    pairsByCity.set(city, list);
  }

  return (
    <>
      <PageNav />
      <div className="seo-page">
        <div className="seo-page__inner">
          <header className="seo-page__header">
            <h1>{t('title')}</h1>
            <p className="seo-page__desc">{t('desc')}</p>
          </header>

          {/* Main pages */}
          <section className="sitemap-section">
            <h2 className="sitemap-section__title">{t('sectionMain')}</h2>
            <ul className="sitemap-list">
              <li><a href={`${localePrefix}/`}>{t('home')}</a></li>
              <li><a href={`${localePrefix}/slots`}>{t('allSpaces')}</a></li>
              <li><a href={`${localePrefix}/ajuda`}>{t('help')}</a></li>
              <li><a href={`${localePrefix}/publica`}>{t('publish')}</a></li>
            </ul>
          </section>

          {/* Cities */}
          <section className="sitemap-section">
            <h2 className="sitemap-section__title">{t('sectionCities')}</h2>
            <div className="sitemap-cities">
              {cities.map((city) => {
                const citySlug = city.toLowerCase();
                const types = pairsByCity.get(city) ?? [];
                return (
                  <div key={city} className="sitemap-city">
                    <a href={`${localePrefix}/${citySlug}`} className="sitemap-city__name">
                      {ts('cityTitle', { city })}
                    </a>
                    {types.length > 0 && (
                      <ul className="sitemap-city__types">
                        {types.map((typeSlug) => (
                          <li key={typeSlug}>
                            <a href={`${localePrefix}/${citySlug}/${typeSlug}`}>
                              {ts(`typeSlugs.${typeSlug}`)}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* All spaces */}
          <section className="sitemap-section">
            <h2 className="sitemap-section__title">{t('sectionSpaces')}</h2>
            <ul className="sitemap-list sitemap-list--spaces">
              {spaces.map((space) => (
                <li key={space.slug}>
                  <a href={`${localePrefix}/slot/${space.slug}`}>
                    {space.title}
                    {space.city && <span className="sitemap-space-city"> — {space.city}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
