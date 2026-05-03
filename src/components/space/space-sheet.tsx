'use client';

import { useTranslations } from 'next-intl';
import type { Space } from '@/lib/schemas/space';
import { SpaceCard } from './space-card';

interface SpaceSheetProps {
  spaces: Space[];
  likedIds: Set<string>;
  onSelect: (space: Space) => void;
  onToggleLike: (id: string) => void;
}

export function SpaceSheet({ spaces, likedIds, onSelect, onToggleLike }: SpaceSheetProps) {
  const t = useTranslations();

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
        <span className="sheet__sort">{t('sheet.sort')}</span>
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
