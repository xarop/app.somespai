'use client';

import { useState, useMemo, useCallback } from 'react';
import { TopNav } from '@/components/ui/top-nav';
import { MapView } from '@/components/map/map-view';
import { FilterBar, type FilterId } from '@/components/space/filter-bar';
import { SpaceSheet } from '@/components/space/space-sheet';
import { SpaceDetailModal } from '@/components/space/space-detail-modal';
import { MOCK_SPACES } from '@/lib/data/mock-spaces';
import type { Space } from '@/lib/schemas/space';

export default function HomePage() {
  const [filter, setFilter] = useState<FilterId>('all');
  const [query, setQuery] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

  const filteredSpaces = useMemo(() => {
    let list = MOCK_SPACES;
    if (filter === 'featured') list = list.filter((s) => s.isFeatured);
    else if (filter !== 'all') list = list.filter((s) => s.type === filter);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.address ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [filter, query]);

  const toggleLike = useCallback((id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="app">
      <TopNav query={query} onQueryChange={setQuery} />
      <div className="mapwrap">
        <MapView
          spaces={filteredSpaces}
          activeSpaceId={selectedSpace?.id ?? null}
          onSelect={setSelectedSpace}
        />
        <FilterBar active={filter} onChange={setFilter} />
        <SpaceSheet
          spaces={filteredSpaces}
          likedIds={likedIds}
          onSelect={setSelectedSpace}
          onToggleLike={toggleLike}
        />
        <SpaceDetailModal
          space={selectedSpace}
          onClose={() => setSelectedSpace(null)}
        />
      </div>
    </div>
  );
}
