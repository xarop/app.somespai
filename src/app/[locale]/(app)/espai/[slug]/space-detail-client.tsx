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
  isAdmin?: boolean;
}

export function SpaceDetailClient({ space, isAdmin }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <div className="app">
      <TopNav query={query} onQueryChange={setQuery} />
      <div className="mapwrap">
        <MapView spaces={MOCK_SPACES} activeSpaceId={space.id} />
        <SpaceDetailModal space={space} onClose={() => router.push('/')} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
