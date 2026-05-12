'use client';

import { useEffect, useState } from 'react';
import { getFavoriteIds } from '@/lib/supabase/favorites-actions';
import { createClient } from '@/lib/supabase/client';

interface FavoriteSpace {
  id: string;
  slug: string;
  title: string;
  city: string | null;
  address: string | null;
}

interface Props {
  locale: string;
  noFavoritesText: string;
}

export function FavoritesSection({ locale, noFavoritesText }: Props) {
  const [spaces, setSpaces] = useState<FavoriteSpace[] | null>(null);

  useEffect(() => {
    (async () => {
      const ids = await getFavoriteIds();
      if (ids.length === 0) { setSpaces([]); return; }
      const supabase = createClient();
      const { data } = await supabase
        .from('spaces')
        .select('id, slug, title, city, address')
        .in('id', ids)
        .neq('status', 'removed');
      setSpaces(data ?? []);
    })();
  }, []);

  if (spaces === null) return null;
  if (spaces.length === 0) return (
    <p style={{ color: 'var(--ink-mute)', padding: 'var(--s-4) 0' }}>{noFavoritesText}</p>
  );

  return (
    <div className="perfil-spaces">
      {spaces.map((space) => (
        <div key={space.id} className="perfil-space-row">
          <div className="perfil-space-row__info">
            <span className="perfil-space-row__title">{space.title}</span>
            <span className="perfil-space-row__status" style={{ color: 'var(--ink-mute)' }}>
              {space.city ?? space.address ?? ''}
            </span>
          </div>
          <a href={`/${locale}/espai/${space.slug}`} className="perfil-space-row__edit">
            →
          </a>
        </div>
      ))}
    </div>
  );
}
