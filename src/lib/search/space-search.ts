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
    traster: { spaceTypes: ['storage'], expansions: ['storage'] },
    trasters: { spaceTypes: ['storage'], expansions: ['storage'] },
    coworking: { spaceTypes: ['workspace'], expansions: ['workspace'] },
    workspace: { spaceTypes: ['workspace'], expansions: ['coworking'] },
    parquing: { spaceTypes: ['parking'], expansions: ['parking'] },
    parking: { spaceTypes: ['parking'], expansions: ['parquing'] },
    jardi: { spaceTypes: ['garden'], expansions: ['garden'] },
    jardins: { spaceTypes: ['garden'], expansions: ['garden'] },
    estudi: { spaceTypes: ['room'], expansions: ['studio', 'room'] },
    estudis: { spaceTypes: ['room'], expansions: ['studio', 'room'] },
    sala: { spaceTypes: ['room'], expansions: ['room'] },
    sales: { spaceTypes: ['room'], expansions: ['room'] },
    storage: { spaceTypes: ['storage'], expansions: ['traster'] },
  },
  es: {
    trastero: { spaceTypes: ['storage'], expansions: ['storage'] },
    trasteros: { spaceTypes: ['storage'], expansions: ['storage'] },
    coworking: { spaceTypes: ['workspace'], expansions: ['workspace'] },
    workspace: { spaceTypes: ['workspace'], expansions: ['coworking'] },
    parking: { spaceTypes: ['parking'], expansions: ['aparcamiento'] },
    aparcamiento: { spaceTypes: ['parking'], expansions: ['parking'] },
    aparcamientos: { spaceTypes: ['parking'], expansions: ['parking'] },
    jardin: { spaceTypes: ['garden'], expansions: ['garden'] },
    jardines: { spaceTypes: ['garden'], expansions: ['garden'] },
    estudio: { spaceTypes: ['room'], expansions: ['studio', 'room'] },
    estudios: { spaceTypes: ['room'], expansions: ['studio', 'room'] },
    sala: { spaceTypes: ['room'], expansions: ['room'] },
    salas: { spaceTypes: ['room'], expansions: ['room'] },
    storage: { spaceTypes: ['storage'], expansions: ['trastero'] },
  },
  en: {
    storage: { spaceTypes: ['storage'], expansions: ['traster', 'trastero'] },
    coworking: { spaceTypes: ['workspace'], expansions: ['workspace'] },
    workspace: { spaceTypes: ['workspace'], expansions: ['coworking'] },
    workspaces: { spaceTypes: ['workspace'], expansions: ['coworking'] },
    parking: { spaceTypes: ['parking'] },
    parkings: { spaceTypes: ['parking'] },
    garden: { spaceTypes: ['garden'] },
    gardens: { spaceTypes: ['garden'] },
    studio: { spaceTypes: ['room'], expansions: ['room'] },
    studios: { spaceTypes: ['room'], expansions: ['room'] },
    room: { spaceTypes: ['room'] },
    rooms: { spaceTypes: ['room'] },
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
    .filter(Boolean)
    .filter((token) => !stopwords.has(token));
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
    [space.title, space.description, space.address, space.neighborhood, space.city, space.region, ...space.amenities]
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
