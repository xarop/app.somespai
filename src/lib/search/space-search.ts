import type { Space, SpaceType } from '@/lib/schemas/space';

type SupportedLocale = 'ca' | 'es' | 'en';

interface SearchRule {
  spaceTypes?: SpaceType[];
  expansions?: string[];
}

interface SearchToken {
  terms: string[];
  spaceTypes: SpaceType[];
}

const STOPWORDS: Record<SupportedLocale, Set<string>> = {
  ca: new Set(['a', 'al', 'als', 'de', 'del', 'dels', 'la', 'les', 'el', 'els', 'en', 'per', 'prop', 'cerca', 'd']),
  es: new Set(['a', 'al', 'de', 'del', 'la', 'las', 'el', 'los', 'en', 'por', 'cerca']),
  en: new Set(['a', 'an', 'the', 'in', 'at', 'near', 'of', 'to', 'for', 'on']),
};

const RAW_SEARCH_RULES: Record<SupportedLocale, Record<string, SearchRule>> = {
  ca: {
    traster: { spaceTypes: ['storage'], expansions: ['storage', 'magatzem', 'emmagatzematge', 'guardar'] },
    trasters: { spaceTypes: ['storage'], expansions: ['storage'] },
    magatzem: { spaceTypes: ['storage'], expansions: ['storage', 'traster'] },
    magatzems: { spaceTypes: ['storage'], expansions: ['storage', 'traster'] },
    emmagatzematge: { spaceTypes: ['storage'], expansions: ['storage', 'traster'] },
    guardar: { spaceTypes: ['storage'], expansions: ['storage', 'traster'] },
    coworking: { spaceTypes: ['workspace'], expansions: ['workspace', 'oficina', 'despatx'] },
    workspace: { spaceTypes: ['workspace'], expansions: ['coworking', 'oficina', 'despatx'] },
    oficina: { spaceTypes: ['workspace'], expansions: ['workspace', 'coworking'] },
    oficines: { spaceTypes: ['workspace'], expansions: ['workspace', 'coworking'] },
    despatx: { spaceTypes: ['workspace'], expansions: ['workspace', 'coworking'] },
    despatxos: { spaceTypes: ['workspace'], expansions: ['workspace', 'coworking'] },
    parquing: { spaceTypes: ['parking'], expansions: ['parking'] },
    parking: { spaceTypes: ['parking'], expansions: ['parquing'] },
    jardi: { spaceTypes: ['garden'], expansions: ['garden', 'exterior', 'terrassa'] },
    jardins: { spaceTypes: ['garden'], expansions: ['garden'] },
    exterior: { spaceTypes: ['garden'], expansions: ['garden'] },
    exteriors: { spaceTypes: ['garden'], expansions: ['garden'] },
    terrassa: { spaceTypes: ['garden'], expansions: ['garden'] },
    terrasses: { spaceTypes: ['garden'], expansions: ['garden'] },
    estudi: { spaceTypes: ['room'], expansions: ['studio', 'room', 'sala'] },
    estudis: { spaceTypes: ['room'], expansions: ['studio', 'room'] },
    sala: { spaceTypes: ['room'], expansions: ['room', 'reunions', 'polivalent'] },
    sales: { spaceTypes: ['room'], expansions: ['room'] },
    reunions: { spaceTypes: ['room'], expansions: ['room', 'sala'] },
    polivalent: { spaceTypes: ['room'], expansions: ['room', 'sala'] },
    polivalents: { spaceTypes: ['room'], expansions: ['room', 'sales'] },
    storage: { spaceTypes: ['storage'], expansions: ['traster'] },
    slot: { spaceTypes: ['storage', 'workspace', 'garden', 'room', 'parking'], expansions: [] },
    espais: { spaceTypes: ['storage', 'workspace', 'garden', 'room', 'parking'], expansions: [] },
  },
  es: {
    trastero: { spaceTypes: ['storage'], expansions: ['storage', 'almacen', 'guardar'] },
    trasteros: { spaceTypes: ['storage'], expansions: ['storage'] },
    almacen: { spaceTypes: ['storage'], expansions: ['storage', 'trastero'] },
    almacenes: { spaceTypes: ['storage'], expansions: ['storage', 'trastero'] },
    guardar: { spaceTypes: ['storage'], expansions: ['storage', 'trastero'] },
    coworking: { spaceTypes: ['workspace'], expansions: ['workspace', 'oficina', 'despacho'] },
    workspace: { spaceTypes: ['workspace'], expansions: ['coworking', 'oficina', 'despacho'] },
    oficina: { spaceTypes: ['workspace'], expansions: ['workspace', 'coworking'] },
    oficinas: { spaceTypes: ['workspace'], expansions: ['workspace', 'coworking'] },
    despacho: { spaceTypes: ['workspace'], expansions: ['workspace', 'coworking'] },
    despachos: { spaceTypes: ['workspace'], expansions: ['workspace', 'coworking'] },
    parking: { spaceTypes: ['parking'], expansions: ['aparcamiento'] },
    aparcamiento: { spaceTypes: ['parking'], expansions: ['parking'] },
    aparcamientos: { spaceTypes: ['parking'], expansions: ['parking'] },
    jardin: { spaceTypes: ['garden'], expansions: ['garden', 'exterior', 'terraza'] },
    jardines: { spaceTypes: ['garden'], expansions: ['garden'] },
    exterior: { spaceTypes: ['garden'], expansions: ['garden'] },
    exteriores: { spaceTypes: ['garden'], expansions: ['garden'] },
    terraza: { spaceTypes: ['garden'], expansions: ['garden'] },
    terrazas: { spaceTypes: ['garden'], expansions: ['garden'] },
    estudio: { spaceTypes: ['room'], expansions: ['studio', 'room', 'sala'] },
    estudios: { spaceTypes: ['room'], expansions: ['studio', 'room'] },
    sala: { spaceTypes: ['room'], expansions: ['room', 'reuniones', 'polivalente'] },
    salas: { spaceTypes: ['room'], expansions: ['room'] },
    reuniones: { spaceTypes: ['room'], expansions: ['room', 'sala'] },
    polivalente: { spaceTypes: ['room'], expansions: ['room', 'sala'] },
    polivalentes: { spaceTypes: ['room'], expansions: ['room', 'salas'] },
    storage: { spaceTypes: ['storage'], expansions: ['trastero'] },
    espacio: { spaceTypes: ['storage', 'workspace', 'garden', 'room', 'parking'], expansions: [] },
    espacios: { spaceTypes: ['storage', 'workspace', 'garden', 'room', 'parking'], expansions: [] },
  },
  en: {
    storage: { spaceTypes: ['storage'], expansions: ['traster', 'trastero', 'warehouse', 'keeping'] },
    warehouse: { spaceTypes: ['storage'], expansions: ['storage'] },
    keeping: { spaceTypes: ['storage'], expansions: ['storage'] },
    coworking: { spaceTypes: ['workspace'], expansions: ['workspace', 'office', 'desk'] },
    workspace: { spaceTypes: ['workspace'], expansions: ['coworking', 'office'] },
    workspaces: { spaceTypes: ['workspace'], expansions: ['coworking'] },
    office: { spaceTypes: ['workspace'], expansions: ['workspace', 'coworking'] },
    offices: { spaceTypes: ['workspace'], expansions: ['workspace'] },
    desk: { spaceTypes: ['workspace'], expansions: ['workspace'] },
    desks: { spaceTypes: ['workspace'], expansions: ['workspace'] },
    parking: { spaceTypes: ['parking'], expansions: ['garage'] },
    parkings: { spaceTypes: ['parking'] },
    garage: { spaceTypes: ['parking'], expansions: ['parking'] },
    garden: { spaceTypes: ['garden'], expansions: ['outdoor', 'terrace', 'patio'] },
    gardens: { spaceTypes: ['garden'] },
    outdoor: { spaceTypes: ['garden'], expansions: ['garden'] },
    outdoors: { spaceTypes: ['garden'], expansions: ['garden'] },
    terrace: { spaceTypes: ['garden'], expansions: ['garden'] },
    terraces: { spaceTypes: ['garden'], expansions: ['garden'] },
    patio: { spaceTypes: ['garden'], expansions: ['garden'] },
    patios: { spaceTypes: ['garden'], expansions: ['garden'] },
    studio: { spaceTypes: ['room'], expansions: ['room'] },
    studios: { spaceTypes: ['room'], expansions: ['room'] },
    room: { spaceTypes: ['room'], expansions: ['meeting', 'multipurpose'] },
    rooms: { spaceTypes: ['room'] },
    meeting: { spaceTypes: ['room'], expansions: ['room'] },
    multipurpose: { spaceTypes: ['room'], expansions: ['room'] },
    space: { spaceTypes: ['storage', 'workspace', 'garden', 'room', 'parking'], expansions: [] },
    spaces: { spaceTypes: ['storage', 'workspace', 'garden', 'room', 'parking'], expansions: [] },
    all: { spaceTypes: ['storage', 'workspace', 'garden', 'room', 'parking'], expansions: [] },
  },
};

function normalizeSearchRules(
  rules: Record<SupportedLocale, Record<string, SearchRule>>,
): Record<SupportedLocale, Record<string, SearchRule>> {
  return (Object.keys(rules) as SupportedLocale[]).reduce((normalizedRules, locale) => {
    const localeRules = rules[locale];
    normalizedRules[locale] = Object.entries(localeRules).reduce<Record<string, SearchRule>>((acc, [token, rule]) => {
      acc[normalizeSearchText(token)] = {
        spaceTypes: rule.spaceTypes,
        expansions: rule.expansions?.map(normalizeSearchText),
      };
      return acc;
    }, {});
    return normalizedRules;
  }, {} as Record<SupportedLocale, Record<string, SearchRule>>);
}

const SEARCH_RULES = normalizeSearchRules(RAW_SEARCH_RULES);

function resolveLocale(locale: string): SupportedLocale {
  const normalizedLocale = locale.toLowerCase().split('-')[0];
  if (normalizedLocale === 'ca' || normalizedLocale === 'es' || normalizedLocale === 'en') {
    return normalizedLocale;
  }
  return 'en';
}

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/['’]/g, '')
    .trim();
}

function tokenizeQuery(query: string, locale: SupportedLocale): string[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  const stopwords = STOPWORDS[locale];
  return normalized
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => Boolean(token) && !stopwords.has(token));
}

function buildSearchTokens(query: string, locale: string): SearchToken[] {
  const resolvedLocale = resolveLocale(locale);
  const rules = SEARCH_RULES[resolvedLocale];
  const tokens = tokenizeQuery(query, resolvedLocale);

  return tokens.map((token) => {
    const rule = rules[token];
    const terms = Array.from(new Set([token, ...(rule?.expansions ?? [])]));
    return {
      terms,
      spaceTypes: rule?.spaceTypes ?? [],
    };
  });
}

function getSpaceSearchText(space: Space): string {
  return normalizeSearchText(
    [space.title, space.description, space.address, space.neighborhood, space.city, space.region, ...(space.amenities ?? [])]
      .filter(Boolean)
      .join(' '),
  );
}

function matchesToken(space: Space, searchText: string, token: SearchToken): boolean {
  if (token.spaceTypes.includes(space.type)) return true;
  return token.terms.some((term) => searchText.includes(term));
}

export function filterSpacesByQuery(spaces: Space[], query: string, locale: string): Space[] {
  if (!query.trim()) return spaces;

  const searchTokens = buildSearchTokens(query, locale);
  if (searchTokens.length === 0) return spaces;

  return spaces.filter((space) => {
    const searchText = getSpaceSearchText(space);
    return searchTokens.every((token) => matchesToken(space, searchText, token));
  });
}
