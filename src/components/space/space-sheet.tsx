'use client';

import { useTranslations } from 'next-intl';
import type { Space } from '@/lib/schemas/space';
import { SpaceCard } from './space-card';

export type SortId = 'distance' | 'price' | 'rating';

const SORT_OPTIONS: SortId[] = ['distance', 'price', 'rating'];

interface SpaceSheetProps {
  spaces: Space[];
  likedIds: Set<string>;
  sort: SortId;
  onSortChange: (sort: SortId) => void;
  onSelect: (space: Space) => void;
  onToggleLike: (id: string) => void;
}

export function SpaceSheet({ spaces, likedIds, sort, onSortChange, onSelect, onToggleLike }: SpaceSheetProps) {
  const t = useTranslations();

  const sortLabel: Record<SortId, string> = {
    distance: t('sheet.sortDistance'),
    price: t('sheet.sortPrice'),
    rating: t('sheet.sortRating'),
  };

  if (spaces.length === 0) {
    return (
      <section className="sheet glass" aria-label="Spaces">
        <span className="sheet__handle" aria-hidden="true" />
        <div className="empty">{t('sheet.empty')}</div>
      </section>
    );
  }

  return (
    <section className="sheet glass" aria-label="Spaces">
      <span className="sheet__handle" aria-hidden="true" />
      <header className="sheet__header">
        <h2 className="sheet__count">{t('sheet.count', { n: spaces.length })}</h2>
        <div className="sheet__sort-bar" role="group">
          {SORT_OPTIONS.map((id) => (
            <button
              key={id}
              type="button"
              className="sort-btn"
              data-active={id === sort}
              onClick={() => onSortChange(id)}
            >
              {sortLabel[id]}
            </button>
          ))}
        </div>
      </header>
      <div className="cards stagger">
        {spaces.map((space) => (
          <SpaceCard
            key={space.id}
            space={space}
            liked={likedIds.has(space.id)}
            onSelect={onSelect}
            onToggleLike={onToggleLike}
          />
        ))}
      </div>
    </section>
  );
}
