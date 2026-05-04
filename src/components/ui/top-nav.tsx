'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/routing';
import { Icon } from '@/components/ui/icon';
import { AuthModal } from '@/components/ui/auth-modal';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const LOCALES = [
  { code: 'ca', label: 'Català' },
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
] as const;

interface TopNavProps {
  query: string;
  onQueryChange: (value: string) => void;
  onLocationFound?: (lat: number, lng: number) => void;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'ca,es,en' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (
      data.address?.quarter ??
      data.address?.suburb ??
      data.address?.neighbourhood ??
      data.address?.city_district ??
      data.address?.city ??
      null
    );
  } catch {
    return null;
  }
}

export function TopNav({ query, onQueryChange, onLocationFound }: TopNavProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [placeholder, setPlaceholder] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Geolocation placeholder
  useEffect(() => {
    setPlaceholder(t('nav.searchLocating'));
    if (!navigator.geolocation) {
      setPlaceholder(t('nav.searchPlaceholder'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        onLocationFound?.(lat, lng);
        const name = await reverseGeocode(lat, lng);
        setPlaceholder(name ? `Cerca espais a ${name}…` : t('nav.searchPlaceholder'));
      },
      () => setPlaceholder(t('nav.searchPlaceholder')),
      { timeout: 6000, maximumAge: 60_000 },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth state
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  function switchLocale(next: string) {
    setMenuOpen(false);
    router.replace(pathname, { locale: next as 'ca' | 'es' | 'en' });
  }

  async function handleSignOut() {
    setMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  function handleAuthClick() {
    setMenuOpen(false);
    setAuthOpen(true);
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? null;

  return (
    <>
      <header className="topnav glass">
        <a className="topnav__brand" href="/" aria-label={t('brand.name')}>
          <svg className="topnav__brand-mark" width="26" height="26" viewBox="0 0 103 103" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="102.813" height="102.813" rx="51.4065" fill="var(--primary)"/>
            <path d="M23.4217 70.6662C22.0036 70.6662 20.9078 70.2795 20.1344 69.506C19.3867 68.7583 19.0128 67.6754 19.0128 66.2574V36.5557C19.0128 35.1376 19.3867 34.0548 20.1344 33.3071C20.9078 32.5336 22.0036 32.1469 23.4217 32.1469H29.5322V35.7435H24.1178C23.2927 35.7435 22.8802 36.1561 22.8802 36.9811V65.7546C22.8802 66.5796 23.2927 66.9922 24.1178 66.9922H29.5322V70.6662H23.4217Z" fill="var(--primary-ink)"/>
            <path d="M73.281 70.6662V66.9922H78.6953C79.5204 66.9922 79.9329 66.5796 79.9329 65.7546V36.9811C79.9329 36.1561 79.5204 35.7435 78.6953 35.7435H73.281V32.1469H79.3915C80.8095 32.1469 81.8924 32.5336 82.6401 33.3071C83.4136 34.0548 83.8003 35.1376 83.8003 36.5557V66.2574C83.8003 67.6754 83.4136 68.7583 82.6401 69.506C81.8924 70.2795 80.8095 70.6662 79.3915 70.6662H73.281Z" fill="var(--primary-ink)"/>
          </svg>
          <span>{t('brand.name')}</span>
        </a>

        <label className="topnav__search">
          <Icon name="search" size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
          />
        </label>

        <div className="topnav__actions">
          <a href="/publica" className="btn-publish">
            {t('nav.publish')}
          </a>

          <div className="menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="iconbtn menu-toggle"
              aria-label="Menú"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
            >
              {userInitial ? (
                <span className="user-initial">{userInitial}</span>
              ) : (
                <Icon name="menu" size={20} />
              )}
            </button>

            <div className="dropmenu glass" role="menu" hidden={!menuOpen}>
              {/* Auth */}
              {user ? (
                <>
                  <div className="dropmenu__item dropmenu__item--muted">
                    {user.email}
                  </div>
                  <button type="button" role="menuitem" onClick={handleSignOut}>
                    {t('user.signOut')}
                  </button>
                </>
              ) : (
                <button type="button" role="menuitem" onClick={handleAuthClick}>
                  <Icon name="user" size={16} />
                  {t('nav.signIn')}
                </button>
              )}

              <div className="dropmenu__divider" />

              {/* Language */}
              <div className="dropmenu__item dropmenu__item--label">{t('lang.label')}</div>
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={locale === l.code}
                  onClick={() => switchLocale(l.code)}
                >
                  <span className="lang-code">{l.code.toUpperCase()}</span>
                  <span>{l.label}</span>
                  {locale === l.code && <Icon name="check" size={14} />}
                </button>
              ))}

              <div className="dropmenu__divider" />

              {/* Design system link */}
              <a href="/design-system" role="menuitem" onClick={() => setMenuOpen(false)}>
                <Icon name="grid" size={16} />
                {t('nav.designSystem')}
              </a>
            </div>
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
