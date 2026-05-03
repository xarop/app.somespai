'use client';

import { useTranslations } from 'next-intl';
import type { SpaceType } from '@/lib/schemas/space';
import { Icon, type IconName } from '@/components/ui/icon';

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
  { id: 'storage', iconName: 'storage', labelKey: 'filter.storage' },
  { id: 'workspace', iconName: 'workspace', labelKey: 'filter.workspace' },
  { id: 'garden', iconName: 'garden', labelKey: 'filter.garden' },
  { id: 'room', iconName: 'room', labelKey: 'filter.room' },
  { id: 'featured', iconName: 'star', labelKey: 'filter.featured' },
];

export function FilterBar({ active, onChange }: FilterBarProps) {
  const t = useTranslations();

  return (
    <nav className="filterbar" aria-label="Filters">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          className="chip"
          aria-pressed={active === f.id}
          onClick={() => onChange(f.id)}
        >
          {f.iconName && <Icon name={f.iconName} size={16} />}
          <span>{t(f.labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
