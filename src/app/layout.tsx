import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://APP_DOMAIN_PLACEHOLDER'),
  title: { default: 'BRAND_NAME_CAP_PLACEHOLDER - Marketplace P2P d\'espais', template: '%s · BRAND_NAME_CAP_PLACEHOLDER' },
  description: 'Trasters, garatges, sales, estudis i jardins. Lloga i posa de lloguer els teus espais propers de forma fàcil i directa.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'BRAND_NAME_CAP_PLACEHOLDER — Marketplace P2P d\'espais',
    description: 'Troba els millors trasters, sales, jardins i estudis a prop teu per llogar.',
    url: 'https://APP_DOMAIN_PLACEHOLDER',
    siteName: 'BRAND_NAME_CAP_PLACEHOLDER',
    locale: 'ca_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BRAND_NAME_CAP_PLACEHOLDER',
    description: 'Marketplace P2P d\'espais',
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
