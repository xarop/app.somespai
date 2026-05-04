'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Space } from '@/lib/schemas/space';
import { Icon, type IconName } from '@/components/ui/icon';

const TYPE_ICON: Record<Space['type'], IconName> = {
  storage: 'storage',
  workspace: 'workspace',
  garden: 'garden',
  room: 'room',
};

interface SpaceCardProps {
  space: Space;
  liked: boolean;
  onSelect: (space: Space) => void;
  onToggleLike: (id: string) => void;
}

export function SpaceCard({ space, liked, onSelect, onToggleLike }: SpaceCardProps) {
  const t = useTranslations();
  const locale = useLocale();

  const localeMap: Record<string, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' };
  const formattedPrice = new Intl.NumberFormat(localeMap[locale] ?? 'ca-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(space.priceCents / 100);

  return (
    <article
      className="card"
      role="button"
      tabIndex={0}
      aria-label={space.title}
      onClick={() => onSelect(space)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(space);
        }
      }}
    >
      <div className="card__media" data-type={space.type}>
        <Icon name={TYPE_ICON[space.type]} size={52} className="card__glyph" />
        {space.isFeatured && <span className="card__featured">{t('card.featured')}</span>}
        <button
          type="button"
          className="card__like"
          aria-pressed={liked}
          aria-label={t('card.like')}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(space.id);
          }}
        >
          <Icon name="heart" size={18} />
        </button>
      </div>

      <div className="card__body">
        <h3 className="card__title">{space.title}</h3>
        <p className="card__meta">
          <span>{space.address}</span>
          {space.sizeM2 != null && (
            <>
              <span className="card__dot" aria-hidden="true" />
              <span>{t('card.size', { n: space.sizeM2 })}</span>
            </>
          )}
        </p>
        <div className="card__footer">
          <p className="card__price">
            {formattedPrice}
            <span className="card__price-unit">{t(`card.${space.priceUnit}`)}</span>
          </p>
          <p className="card__rating">
            <Icon name="star" size={14} />
            <span>{space.rating.toFixed(1)}</span>
            <span style={{ opacity: 0.5 }}>({space.reviewsCount})</span>
          </p>
        </div>
      </div>
    </article>
  );
}
