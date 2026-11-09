export type BrandId = 'somespai' | 'somtallers';

export interface BrandConfig {
  id: BrandId;
  name: string;
  tagline: string;
  domain: string;
  logo: string;
  colors: {
    primary: string;
    primaryInk: string;
    accent: string;
  };
}

const brands: Record<BrandId, BrandConfig> = {
  somespai: {
    id: 'somespai',
    name: 'Somespai',
    tagline: "Espais que connecten",
    domain: 'https://app.somespai.net',
    logo: '/favicon.svg',
    colors: { primary: '#6FCF97', primaryInk: '#1a4a2e', accent: '#c45a2c' },
  },
  somtallers: {
    id: 'somtallers',
    name: 'Somtallers',
    tagline: 'Tallers, cursos i activitats creatives',
    domain: 'https://tallers.somespai.net',
    logo: '/somtallers.svg',
    colors: { primary: '#F2A65A', primaryInk: '#5a2f0c', accent: '#2f7f86' },
  },
};

export function getBrand(): BrandConfig {
  return process.env.NEXT_PUBLIC_BRAND === 'somtallers'
    ? brands.somtallers
    : brands.somespai;
}

export function getSomespaiUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SOMESPAI_URL;
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');
  return process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001'
    : 'https://app.somespai.net';
}
