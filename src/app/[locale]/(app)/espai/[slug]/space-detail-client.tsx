'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { TopNav } from '@/components/ui/top-nav';
import { SpaceDetailModal } from '@/components/space/space-detail-modal';
import type { Space } from '@/lib/schemas/space';

interface Props {
  space: Space;
  isAdmin?: boolean;
  currentUserId?: string;
}

export function SpaceDetailClient({ space, isAdmin, currentUserId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <div className="app single-space-page">
      <TopNav query={query} onQueryChange={setQuery} hideSearch />
      <div className="single-space-content" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', height: '100%', padding: 'var(--s-7) var(--s-4)', paddingBottom: 'calc(var(--s-7) + env(safe-area-inset-bottom, 0px))', overflowY: 'auto' }}>
        <SpaceDetailModal space={space} onClose={() => router.push('/')} isAdmin={isAdmin} currentUserId={currentUserId} standalone />
      </div>
    </div>
  );
}
