import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Recursive } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { routing } from '@/lib/i18n/routing';
import { isMockEnabled } from '@/lib/supabase/server';

function MockupBanner() {
  if (!isMockEnabled()) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, textAlign: 'center', fontSize: '10px', color: 'var(--bg)', background: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px', zIndex: 99999 }}>
      Mockup Mode — Dades de prova (Manteniment)
    </div>
  );
}

const recursive = Recursive({
  subsets: ['latin'],
  axes: ['CASL', 'MONO', 'slnt', 'CRSV'],
  display: 'swap',
  variable: '--font-recursive',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={recursive.variable}>
      <head />
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-364235874"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-364235874');
          `}
        </Script>
        <NextIntlClientProvider messages={messages}>
          <MockupBanner />
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
