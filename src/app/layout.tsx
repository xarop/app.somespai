import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://app.somespai.net'),
  title: { default: 'Somespai', template: '%s · Somespai' },
  description: 'Marketplace P2P d\'espais.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
