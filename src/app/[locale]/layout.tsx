import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { routing } from '@/lib/i18n/routing';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--serif-font',
});
const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--sans-font',
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--mono-font',
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
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body
        style={{
          // Override CSS tokens with Next.js-loaded fonts
          // (the static var names already exist; these CSS vars are extra fallbacks)
        }}
      >
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
