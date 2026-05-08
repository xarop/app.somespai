import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://coslot.space'),
  title: { default: 'CoSlot - Marketplace P2P d\'espais', template: '%s · CoSlot' },
  description: 'Trasters, garatges, sales, estudis i jardins. Lloga i posa de lloguer els teus espais propers de forma fàcil i directa.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'CoSlot — Marketplace P2P d\'espais',
    description: 'Troba els millors trasters, sales, jardins i estudis a prop teu per llogar.',
    url: 'https://coslot.space',
    siteName: 'CoSlot',
    locale: 'ca_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoSlot',
    description: 'Marketplace P2P d\'espais',
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
