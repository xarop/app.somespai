import type { SpaceType } from '@/lib/schemas/space';

export const SLUG_TO_TYPE_BY_LOCALE: Record<string, Record<string, SpaceType>> = {
  ca: { estudis: 'workspace', sales: 'room', trasters: 'storage', jardins: 'garden' },
  es: { estudios: 'workspace', salas: 'room', trasteros: 'storage', jardines: 'garden' },
  en: { studios: 'workspace', rooms: 'room', storage: 'storage', outdoors: 'garden' },
};

export const TYPE_TO_SLUG_BY_LOCALE: Record<string, Record<SpaceType, string>> = {
  ca: { workspace: 'estudis', room: 'sales', storage: 'trasters', garden: 'jardins' },
  es: { workspace: 'estudios', room: 'salas', storage: 'trasteros', garden: 'jardines' },
  en: { workspace: 'studios', room: 'rooms', storage: 'storage', garden: 'outdoors' },
};

export function getTypeFromSlug(slug: string, locale: string): SpaceType | null {
  return SLUG_TO_TYPE_BY_LOCALE[locale]?.[slug] ?? null;
}

export function getSlugFromType(type: SpaceType, locale: string): string {
  return TYPE_TO_SLUG_BY_LOCALE[locale]?.[type] ?? type;
}

// Legacy CA-only (kept for backwards-compat in places that haven't migrated)
export const SLUG_TO_TYPE = SLUG_TO_TYPE_BY_LOCALE.ca;
export const TYPE_TO_SLUG = TYPE_TO_SLUG_BY_LOCALE.ca;
export const TYPE_SLUGS = Object.keys(SLUG_TO_TYPE_BY_LOCALE.ca);
