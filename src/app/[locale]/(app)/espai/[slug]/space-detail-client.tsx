'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { TopNav } from '@/components/ui/top-nav';
import { SpaceDetailModal } from '@/components/space/space-detail-modal';
import type { Space } from '@/lib/schemas/space';
import { getFavoriteIds, toggleFavorite } from '@/lib/supabase/favorites-actions';

interface Props {
  space: Space;
  isAdmin?: boolean;
  currentUserId?: string;
}

export function SpaceDetailClient({ space, isAdmin, currentUserId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    getFavoriteIds().then(ids => setLiked(ids.includes(space.id)));
  }, [space.id]);

  const handleToggleLike = useCallback(async (id: string) => {
    setLiked(v => !v);
    try {
      await toggleFavorite(id);
    } catch (err) {
      setLiked(v => !v); // revert
      if ((err as Error)?.message !== 'not-authenticated') {
        console.error('[like] toggleFavorite failed:', err);
      }
    }
  }, []);

  return (
    <div className="app single-space-page">
      <TopNav query={query} onQueryChange={setQuery} hideSearch />
      <div className="single-space-content" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: 'var(--s-7) var(--s-4)' }}>
        <SpaceDetailModal
          space={space}
          onClose={() => router.push('/')}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          standalone
          liked={liked}
          onToggleLike={handleToggleLike}
        />
      </div>
    </div>
  );
}
