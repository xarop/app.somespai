'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/routing';
import { Icon } from '@/components/ui/icon';

const LOCALES = [
  { code: 'ca', label: 'Català' },
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
] as const;

interface TopNavProps {
  query: string;
  onQueryChange: (value: string) => void;
}

export function TopNav({ query, onQueryChange }: TopNavProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [langOpen, setLangOpen] = useState(false);
  const langWrapRef = useRef<HTMLDivElement>(null);

  // Close lang menu on outside click
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      if (langWrapRef.current && !langWrapRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [langOpen]);

  function switchLocale(next: string) {
    setLangOpen(false);
    router.replace(pathname, { locale: next as 'ca' | 'es' | 'en' });
  }

  return (
    <header className="topnav glass">
      <a className="topnav__brand" href="/" aria-label={t('brand.name')}>
        <span className="topnav__brand-mark" />
        <span>{t('brand.name')}</span>
      </a>

      <label className="topnav__search">
        <Icon name="search" size={18} />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('nav.searchPlaceholder')}
          aria-label={t('nav.searchPlaceholder')}
        />
      </label>

      <div className="topnav__actions">
        <a
          href="/design-system"
          className="iconbtn"
          aria-label={t('nav.designSystem')}
          title={t('nav.designSystem')}
        >
          <Icon name="grid" size={20} />
        </a>

        <div className="lang-wrap" ref={langWrapRef}>
          <button
            type="button"
            className="iconbtn"
            aria-label={t('lang.label')}
            aria-expanded={langOpen}
            onClick={() => setLangOpen((v) => !v)}
          >
            <Icon name="globe" size={20} />
          </button>
          <div className="langmenu glass" role="menu" hidden={!langOpen}>
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                role="menuitemradio"
                aria-pressed={locale === l.code}
                onClick={() => switchLocale(l.code)}
              >
                <span className="lang-code">{l.code.toUpperCase()}</span>
                <span>{l.label}</span>
                {locale === l.code && <Icon name="check" size={14} />}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="iconbtn"
          aria-label={t('nav.signIn')}
          title={t('nav.signIn')}
        >
          <Icon name="user" size={20} />
        </button>
      </div>
    </header>
  );
}
