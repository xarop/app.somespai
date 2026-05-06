'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { SpaceType } from '@/lib/schemas/space';
import { Icon, type IconName } from '@/components/ui/icon';
import { SpaceTypesInfoModal } from './space-types-info-modal';

export type FilterId = 'all' | SpaceType | 'featured';

interface FilterBarProps {
  active: FilterId;
  onChange: (id: FilterId) => void;
}

const FILTERS: ReadonlyArray<{
  id: FilterId;
  iconName: IconName | null;
  labelKey: string;
}> = [
  { id: 'all', iconName: null, labelKey: 'filter.all' },
  { id: 'workspace', iconName: 'workspace', labelKey: 'filter.workspace' },
  { id: 'garden', iconName: 'garden', labelKey: 'filter.garden' },
  { id: 'room', iconName: 'room', labelKey: 'filter.room' },
  { id: 'storage', iconName: 'storage', labelKey: 'filter.storage' },
  { id: 'parking', iconName: 'parking', labelKey: 'filter.parking' },
  { id: 'featured', iconName: 'star', labelKey: 'filter.featured' },
];

export function FilterBar({ active, onChange }: FilterBarProps) {
  const t = useTranslations();
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      <nav className="filterbar" aria-label="Filters">
        <button
          type="button"
          className="chip chip--info"
          aria-label={t('typeInfo.title')}
          onClick={() => setInfoOpen(true)}
        >
          <i aria-hidden="true">i</i>
        </button>

        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="chip"
            aria-pressed={active === f.id}
            data-type={f.id !== 'all' ? f.id : undefined}
            onClick={() => onChange(f.id)}
          >
            {f.iconName && (
              <span className="chip__icon">
                <Icon name={f.iconName} size={16} />
              </span>
            )}
            <span>{t(f.labelKey)}</span>
          </button>
        ))}
      </nav>

      <SpaceTypesInfoModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        onSelectType={(type) => { onChange(type); setInfoOpen(false); }}
      />
    </>
  );
}
