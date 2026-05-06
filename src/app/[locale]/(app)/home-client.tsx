'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import type { MapViewProps } from '@/components/map/map-view';
import { TopNav } from '@/components/ui/top-nav';
import { FilterBar, type FilterId } from '@/components/space/filter-bar';
import { SpaceSheet, type SortId } from '@/components/space/space-sheet';
import { SpaceDetailModal } from '@/components/space/space-detail-modal';
import { Icon } from '@/components/ui/icon';
import { GRACIA_CENTER } from '@/lib/data/mock-spaces';
import { getFavoriteIds, toggleFavorite } from '@/lib/supabase/favorites';
import { createClient } from '@/lib/supabase/client';
import type { Space } from '@/lib/schemas/space';

const MapView = dynamic<MapViewProps>(
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
  isAdmin: boolean;
  currentUserId?: string;
  initialFilter?: FilterId;
  cityContext?: string;
  typeContext?: string;
}

export function HomeClient({ initialSpaces, isAdmin, currentUserId, initialFilter, cityContext, typeContext }: HomeClientProps) {
  const t = useTranslations();
  const [filter, setFilter] = useState<FilterId>(initialFilter ?? 'all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortId>('distance');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);
  const [userCenter, setUserCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [view, setView] = useState<'map' | 'list'>('map');

  // Load favorites when user logs in
  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const ids = await getFavoriteIds();
      setLikedIds(ids);
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  }, []);

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

  const contextTypeLabel = typeContext ? t(`filter.${typeContext}`) : undefined;

  const forcedPlaceholder = cityContext
    ? (typeContext
        ? t('nav.searchContext', { typeLabel: contextTypeLabel, location: cityContext })
        : t('nav.searchNear', { location: cityContext }))
    : undefined;

  const locationLabel = useMemo<string | null>(() => {
    if (query.trim()) {
      const q = query.trim();
      return q.charAt(0).toUpperCase() + q.slice(1);
    }
    return cityContext ?? null;
  }, [query, cityContext]);

  const toggleLike = useCallback(async (id: string) => {
    // Optimistic update
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Persist to DB (no-op if not authenticated)
    await toggleFavorite(id);
  }, []);

  return (
    <div className="app">
      <TopNav query={query} onQueryChange={setQuery} onLocationFound={(lat, lng) => setUserCenter({ lat, lng })} forcedPlaceholder={forcedPlaceholder}>
        <FilterBar active={filter} onChange={setFilter} />
      </TopNav>
      <div className="mapwrap" data-view={view}>
        <div className="mapwrap__canvas">
          <MapView
            spaces={filteredSpaces}
            activeSpaceId={selectedSpace?.id ?? null}
            hoveredSpaceId={hoveredSpaceId}
            onSelect={setSelectedSpace}
            userCenter={userCenter}
          />
        </div>
        <SpaceSheet
          spaces={filteredSpaces}
          likedIds={likedIds}
          sort={sort}
          onSortChange={setSort}
          onSelect={setSelectedSpace}
          onToggleLike={toggleLike}
          onHover={setHoveredSpaceId}
          locationLabel={locationLabel}
          typeLabel={contextTypeLabel}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
        />
        <SpaceDetailModal
          space={selectedSpace}
          onClose={() => setSelectedSpace(null)}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
        />
      </div>

      <button
        type="button"
        className="view-toggle"
        onClick={() => setView(v => v === 'map' ? 'list' : 'map')}
        aria-label={view === 'map' ? t('view.showList') : t('view.showMap')}
      >
        <Icon name={view === 'map' ? 'list' : 'map'} size={16} />
        {view === 'map' ? t('view.showList') : t('view.showMap')}
      </button>
    </div>
  );
}
