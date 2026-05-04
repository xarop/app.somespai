'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { TopNav } from '@/components/ui/top-nav';
import { FilterBar, type FilterId } from '@/components/space/filter-bar';
import { SpaceSheet, type SortId } from '@/components/space/space-sheet';
import { SpaceDetailModal } from '@/components/space/space-detail-modal';
import { GRACIA_CENTER } from '@/lib/data/mock-spaces';
import type { Space } from '@/lib/schemas/space';

const MapView = dynamic(
  () => import('@/components/map/map-view').then((m) => m.MapView),
  { ssr: false, loading: () => <div className="mapwrap__canvas" style={{ background: 'var(--bg-soft)' }} /> },
);

function distanceSq(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dlat = a.lat - b.lat;
  const dlng = a.lng - b.lng;
  return dlat * dlat + dlng * dlng;
}

interface HomeClientProps {
  initialSpaces: Space[];
}

export function HomeClient({ initialSpaces }: HomeClientProps) {
  const [filter, setFilter] = useState<FilterId>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortId>('distance');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [userCenter, setUserCenter] = useState<{ lat: number; lng: number } | null>(null);

  const filteredSpaces = useMemo(() => {
    let list = [...initialSpaces];
    if (filter === 'featured') list = list.filter((s) => s.isFeatured);
    else if (filter !== 'all') list = list.filter((s) => s.type === filter);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((s) =>
        [s.title, s.address, s.neighborhood, s.city, s.region, s.description, ...s.amenities]
          .some((field) => field?.toLowerCase().includes(q)),
      );
    }
    const center = userCenter ?? GRACIA_CENTER;
    if (sort === 'distance') {
      list.sort((a, b) => distanceSq(a, center) - distanceSq(b, center));
    } else if (sort === 'price') {
      list.sort((a, b) => a.priceCents - b.priceCents);
    } else {
      list.sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [initialSpaces, filter, query, sort, userCenter]);

  /** Location label shown in the results count. Null = no query active → show plain count. */
  const locationLabel = useMemo<string | null>(() => {
    if (!query.trim()) return null;
    const q = query.trim();
    return q.charAt(0).toUpperCase() + q.slice(1);
  }, [query]);

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
      <TopNav query={query} onQueryChange={setQuery} onLocationFound={(lat, lng) => setUserCenter({ lat, lng })} />
      <div className="mapwrap">
        <MapView
          spaces={filteredSpaces}
          activeSpaceId={selectedSpace?.id ?? null}
          onSelect={setSelectedSpace}
          userCenter={userCenter}
        />
        <FilterBar active={filter} onChange={setFilter} />
        <SpaceSheet
          spaces={filteredSpaces}
          likedIds={likedIds}
          sort={sort}
          onSortChange={setSort}
          onSelect={setSelectedSpace}
          onToggleLike={toggleLike}
          locationLabel={locationLabel}
        />
        <SpaceDetailModal
          space={selectedSpace}
          onClose={() => setSelectedSpace(null)}
        />
      </div>
    </div>
  );
}
