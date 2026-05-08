import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://app.somespai.net'),
  title: { default: 'Somespai - Marketplace P2P d\'espais', template: '%s · Somespai' },
  description: 'Trasters, garatges, sales, estudis i jardins. Lloga i posa de lloguer els teus espais propers de forma fàcil i directa.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Somespai — Marketplace P2P d\'espais',
    description: 'Troba els millors trasters, sales, jardins i estudis a prop teu per llogar.',
    url: 'https://app.somespai.net',
    siteName: 'Somespai',
    locale: 'ca_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Somespai',
    description: 'Marketplace P2P d\'espais',
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
