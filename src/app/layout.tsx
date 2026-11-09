import type { ReactNode } from 'react';
import './globals.css';
import { getBrand } from '@/lib/brand';

const brand = getBrand();
export const metadata = {
  metadataBase: new URL(brand.domain),
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s · ${brand.name}` },
  description: brand.tagline,
  icons: { icon: brand.logo },
  openGraph: {
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.tagline,
    url: brand.domain,
    siteName: brand.name,
    locale: 'ca_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: brand.name,
    description: brand.tagline,
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
