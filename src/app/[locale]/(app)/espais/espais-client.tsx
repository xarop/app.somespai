'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { Space, SpaceType } from '@/lib/schemas/space';
import { TYPE_TO_SLUG } from '@/lib/seo/type-slugs';
import { Icon } from '@/components/ui/icon';

const TYPES: Array<{ id: SpaceType }> = [
  { id: 'workspace' },
  { id: 'room' },
  { id: 'storage' },
  { id: 'garden' },
];

const ALL_AMENITIES = [
  'wifi', 'ac', 'heating', 'parking', 'access_24h', 'kitchen',
  'meeting_room', 'projector', 'whiteboard', 'terrace', 'bbq', 'pool',
];

interface Props {
  spaces: Space[];
  locale: string;
}

export function EspaisClient({ spaces, locale }: Props) {
  const t = useTranslations();

  const cities = useMemo(() => {
    const seen = new Set<string>();
    for (const s of spaces) if (s.city) seen.add(s.city);
    return [...seen].sort();
  }, [spaces]);

  const [typeFilter, setTypeFilter] = useState<SpaceType | ''>('');
  const [cityFilter, setCityFilter] = useState('');
  const [amenityFilters, setAmenityFilters] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState(0);
  const [maxPriceCents, setMaxPriceCents] = useState(0);

  const filtered = useMemo(() => {
    return spaces.filter((s) => {
      if (typeFilter && s.type !== typeFilter) return false;
      if (cityFilter && s.city?.toLowerCase() !== cityFilter.toLowerCase()) return false;
      if (amenityFilters.size > 0) {
        for (const a of amenityFilters) {
          if (!s.amenities.includes(a)) return false;
        }
      }
      if (minRating > 0 && s.rating < minRating) return false;
      if (maxPriceCents > 0 && s.priceCents > maxPriceCents) return false;
      return true;
    });
  }, [spaces, typeFilter, cityFilter, amenityFilters, minRating, maxPriceCents]);

  function toggleAmenity(a: string) {
    setAmenityFilters((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  }

  function clearFilters() {
    setTypeFilter('');
    setCityFilter('');
    setAmenityFilters(new Set());
    setMinRating(0);
    setMaxPriceCents(0);
  }

  const hasFilters = typeFilter || cityFilter || amenityFilters.size > 0 || minRating > 0 || maxPriceCents > 0;

  return (
    <div className="espais-layout">
      {/* Sidebar filters */}
      <aside className="espais-filters">
        {hasFilters && (
          <div className="espais-filters__header">
            <button type="button" className="espais-filters__clear" onClick={clearFilters}>
              {t('seo.clearFilters')}
            </button>
          </div>
        )}

        {/* City */}
        <div className="espais-filter-group">
          <label className="espais-filter-group__label" htmlFor="city-filter">{t('seo.filterCity')}</label>
          <select
            id="city-filter"
            className="espais-filter-select"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="">{t('seo.allCities')}</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="espais-filter-group">
          <label className="espais-filter-group__label">{t('seo.filterType')}</label>
          <div className="espais-filter-chips">
            <button
              type="button"
              className="chip"
              aria-pressed={typeFilter === ''}
              onClick={() => setTypeFilter('')}
            >
              <span>{t('seo.allTypes')}</span>
            </button>
            {TYPES.map(({ id }) => (
              <button
                key={id}
                type="button"
                className="chip"
                data-type={id}
                aria-pressed={typeFilter === id}
                onClick={() => setTypeFilter(typeFilter === id ? '' : id)}
              >
                <span className="chip__icon">
                  <Icon name={id} size={16} />
                </span>
                <span>{t(`filter.${id}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="espais-filter-group">
          <label className="espais-filter-group__label">{t('seo.filterRating')}</label>
          <div className="espais-filter-chips">
            {[0, 1, 2, 3, 4].map((r) => (
              <button
                key={r}
                type="button"
                className="chip"
                aria-pressed={minRating === r}
                onClick={() => setMinRating(r)}
              >
                {r}★
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="espais-filter-group">
          <label className="espais-filter-group__label" htmlFor="price-filter">{t('seo.filterPrice')}</label>
          <select
            id="price-filter"
            className="espais-filter-select"
            value={maxPriceCents}
            onChange={(e) => setMaxPriceCents(Number(e.target.value))}
          >
            <option value={0}>Sense límit</option>
            <option value={5000}>50 €</option>
            <option value={10000}>100 €</option>
            <option value={20000}>200 €</option>
            <option value={50000}>500 €</option>
          </select>
        </div>

        {/* Amenities */}
        <div className="espais-filter-group">
          <label className="espais-filter-group__label">{t('seo.filterAmenities')}</label>
          <div className="espais-filter-chips espais-filter-chips--wrap">
            {ALL_AMENITIES.map((a) => (
              <button
                key={a}
                type="button"
                className="chip chip--sm"
                aria-pressed={amenityFilters.has(a)}
                onClick={() => toggleAmenity(a)}
              >
                {t(`amenity.${a}`)}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Results */}
      <main className="espais-results">
        <p className="espais-results__count">
          {t('seo.results', { n: filtered.length })}
        </p>

        {filtered.length === 0 ? (
          <p className="espais-results__empty">{t('seo.noResults')}</p>
        ) : (
          <div className="espais-table">
            {filtered.map((space) => (
              <a
                key={space.id}
                href={`/${locale}/espai/${space.slug}`}
                className="espais-row"
              >
                {space.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={space.photos[0]} alt={space.title} className="espais-row__photo" loading="lazy" />
                ) : (
                  <div className="espais-row__photo espais-row__photo--empty" />
                )}
                <div className="espais-row__main">
                  <span className="espais-row__title">{space.title}</span>
                  <span className="espais-row__location">
                    {[space.neighborhood, space.city].filter(Boolean).join(', ')}
                  </span>
                  {space.description && (
                    <span className="espais-row__desc">{space.description.slice(0, 120)}{space.description.length > 120 ? '…' : ''}</span>
                  )}
                </div>
                <div className="espais-row__meta">
                  <span className={`espais-row__type espais-row__type--${space.type}`}>
                    {t(`filter.${space.type}`)}
                  </span>
                  {space.priceCents > 0 && (
                    <span className="espais-row__price">
                      {(space.priceCents / 100).toLocaleString('ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                      <span>/{space.priceUnit === 'month' ? 'mes' : space.priceUnit === 'day' ? 'dia' : 'h'}</span>
                    </span>
                  )}
                  {space.rating > 0 && (
                    <span className="espais-row__rating">★ {space.rating.toFixed(1)}</span>
                  )}
                  {space.isFeatured && <span className="espais-row__featured">Destacat</span>}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
