'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from '@/lib/i18n/routing';
import { TopNav } from '@/components/ui/top-nav';
import { SpaceDetailModal } from '@/components/space/space-detail-modal';
import { MOCK_SPACES } from '@/lib/data/mock-spaces';
import type { Space } from '@/lib/schemas/space';

const MapView = dynamic(
  () => import('@/components/map/map-view').then((m) => m.MapView),
  { ssr: false, loading: () => <div className="mapwrap__canvas" style={{ background: 'var(--bg-soft)' }} /> },
);

interface Props {
  space: Space;
  isAdmin?: boolean;
  currentUserId?: string;
}

export function SpaceDetailClient({ space, isAdmin, currentUserId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <div className="app">
      <TopNav query={query} onQueryChange={setQuery} />
      <div className="mapwrap">
        <MapView spaces={MOCK_SPACES} activeSpaceId={space.id} />
        <SpaceDetailModal space={space} onClose={() => router.push('/')} isAdmin={isAdmin} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
