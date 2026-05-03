'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { TopNav } from '@/components/ui/top-nav';
import { MapView } from '@/components/map/map-view';
import { SpaceDetailModal } from '@/components/space/space-detail-modal';
import { MOCK_SPACES } from '@/lib/data/mock-spaces';
import type { Space } from '@/lib/schemas/space';

interface Props {
  space: Space;
}

/**
 * Renders the space detail as a modal overlay on top of the map.
 * When the user closes the modal, we navigate back to the home page.
 * This keeps the SPA-feel while keeping shareable URLs working.
 */
export function SpaceDetailClient({ space }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <div className="app">
      <TopNav query={query} onQueryChange={setQuery} />
      <div className="mapwrap">
        <MapView spaces={MOCK_SPACES} activeSpaceId={space.id} />
        <SpaceDetailModal space={space} onClose={() => router.push('/')} />
      </div>
    </div>
  );
}
