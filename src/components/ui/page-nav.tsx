'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/routing';
import { Icon } from '@/components/ui/icon';
import { AuthModal } from '@/components/ui/auth-modal';
import { createClient } from '@/lib/supabase/client';
import { useNavCities } from '@/hooks/use-nav-cities';
import type { User } from '@supabase/supabase-js';

const LOCALES = [
  { code: 'ca', label: 'Català' },
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
] as const;

export function PageNav() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const cities = useNavCities();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpenAuth = () => setAuthOpen(true);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    return () => window.removeEventListener('open-auth-modal', handleOpenAuth);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const checkAdmin = async (u: User | null) => {
      if (!u) {
        setIsAdmin(false);
        return;
      }
      if (u.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setIsAdmin(true);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', u.id).single();
      setIsAdmin(!!profile?.is_admin);
    };

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      checkAdmin(data.user);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      checkAdmin(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
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
  const year = new Date().getFullYear();

  return (
    <>
      <header className="topnav topnav--page glass">
        <a className="topnav__brand" href="/" aria-label={t('brand.name')}>
          <svg className="topnav__brand-mark" width="34" height="34" viewBox="0 0 103 103" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="102.813" height="102.813" rx="51.4065" fill="var(--primary)"/>
            <path d="M23.4217 70.6662C22.0036 70.6662 20.9078 70.2795 20.1344 69.506C19.3867 68.7583 19.0128 67.6754 19.0128 66.2574V36.5557C19.0128 35.1376 19.3867 34.0548 20.1344 33.3071C20.9078 32.5336 22.0036 32.1469 23.4217 32.1469H29.5322V35.7435H24.1178C23.2927 35.7435 22.8802 36.1561 22.8802 36.9811V65.7546C22.8802 66.5796 23.2927 66.9922 24.1178 66.9922H29.5322V70.6662H23.4217Z" fill="var(--primary-ink)"/>
            <path d="M73.281 70.6662V66.9922H78.6953C79.5204 66.9922 79.9329 66.5796 79.9329 65.7546V36.9811C79.9329 36.1561 79.5204 35.7435 78.6953 35.7435H73.281V32.1469H79.3915C80.8095 32.1469 81.8924 32.5336 82.6401 33.3071C83.4136 34.0548 83.8003 35.1376 83.8003 36.5557V66.2574C83.8003 67.6754 83.4136 68.7583 82.6401 69.506C81.8924 70.2795 80.8095 70.6662 79.3915 70.6662H73.281Z" fill="var(--primary-ink)"/>
          </svg>
          <span>{t('brand.name')}</span>
          <em>beta</em>
        </a>

        <div className="topnav__actions">
          <a
            href="/publica"
            className="btn-publish"
          >
            {t('nav.publish')}
          </a>

          <button
            ref={buttonRef}
            type="button"
            className="iconbtn menu-toggle"
            aria-label="Menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
          >
            {userInitial ? (
              <span className="user-initial">{userInitial}</span>
            ) : (
              <Icon name="menu" size={22} />
            )}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          className="nav-drawer__backdrop"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        ref={drawerRef}
        className="dropmenu glass"
        role="menu"
        data-open={menuOpen ? 'true' : 'false'}
      >
        <div className="dropmenu__header">
          <div className="dropmenu__brand">
            <svg width="26" height="26" viewBox="0 0 103 103" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="102.813" height="102.813" rx="51.4065" fill="var(--primary)"/>
              <path d="M23.4217 70.6662C22.0036 70.6662 20.9078 70.2795 20.1344 69.506C19.3867 68.7583 19.0128 67.6754 19.0128 66.2574V36.5557C19.0128 35.1376 19.3867 34.0548 20.1344 33.3071C20.9078 32.5336 22.0036 32.1469 23.4217 32.1469H29.5322V35.7435H24.1178C23.2927 35.7435 22.8802 36.1561 22.8802 36.9811V65.7546C22.8802 66.5796 23.2927 66.9922 24.1178 66.9922H29.5322V70.6662H23.4217Z" fill="var(--primary-ink)"/>
              <path d="M73.281 70.6662V66.9922H78.6953C79.5204 66.9922 79.9329 66.5796 79.9329 65.7546V36.9811C79.9329 36.1561 79.5204 35.7435 78.6953 35.7435H73.281V32.1469H79.3915C80.8095 32.1469 81.8924 32.5336 82.6401 33.3071C83.4136 34.0548 83.8003 35.1376 83.8003 36.5557V66.2574C83.8003 67.6754 83.4136 68.7583 82.6401 69.506C81.8924 70.2795 80.8095 70.6662 79.3915 70.6662H73.281Z" fill="var(--primary-ink)"/>
            </svg>
            <span className="dropmenu__title">{t('brand.name')}</span>
          </div>
          <button
            type="button"
            className="dropmenu__close"
            aria-label={t('nav.close')}
            onClick={() => setMenuOpen(false)}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="dropmenu__body">
          {user ? (
            <>
              <div className="dropmenu__item dropmenu__item--muted">{user.email}</div>
              <a href={`/${locale}/perfil`} role="menuitem" onClick={() => setMenuOpen(false)}>
                <Icon name="user" size={16} />
                {t('user.mySpaces')}
              </a>
              {isAdmin && (
                <a href={`/${locale}/admin`} role="menuitem" onClick={() => setMenuOpen(false)}>
                  <Icon name="shield" size={16} />
                  Administració
                </a>
              )}
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

          <a href={`/${locale}`} role="menuitem" onClick={() => setMenuOpen(false)}>
            <Icon name="map" size={16} />
            {t('nav.map')}
          </a>

          <a href={`/${locale}/espais`} role="menuitem" onClick={() => setMenuOpen(false)}>
            <Icon name="list" size={16} />
            {t('nav.allSpaces')}
          </a>

          {cities.length > 0 && (
            <>
              <div className="dropmenu__item dropmenu__item--label">{t('nav.cities')}</div>
              {cities.map((city) => (
                <a key={city} href={`/${locale}/${city.toLowerCase()}`} role="menuitem" onClick={() => setMenuOpen(false)}>
                  <Icon name="pin" size={16} />
                  {t('seo.cityTitle', { city })}
                </a>
              ))}
            </>
          )}

          <div className="dropmenu__divider" />

          <a href={`/${locale}/ajuda`} role="menuitem" onClick={() => setMenuOpen(false)}>
            <Icon name="info" size={16} />
            {t('nav.help')}
          </a>

          <a href={`/${locale}/contacte`} role="menuitem" onClick={() => setMenuOpen(false)}>
            <Icon name="mail" size={16} />
            {t('nav.contact')}
          </a>

          <a href="https://www.instagram.com/somespai/" role="menuitem" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>
            <Icon name="instagram" size={16} />
            Instagram
          </a>

          <a href="/design-system" role="menuitem" onClick={() => setMenuOpen(false)}>
            <Icon name="grid" size={16} />
            {t('nav.designSystem')}
          </a>
        </div>

        <div className="dropmenu__footer">
          <div className="dropmenu__item dropmenu__item--label">{t('lang.label')}</div>
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={locale === l.code}
              onClick={() => switchLocale(l.code)}
            >
              <span className="lang-code">{l.code}</span>
              <span>{l.label}</span>
              {locale === l.code && <Icon name="check" size={14} />}
            </button>
          ))}
        </div>

        <div className="dropmenu__copyright">
          <span>© {year} somespai by <a href="https://xarop.com" target="_blank" rel="noopener noreferrer">xarop.com</a></span>
          <nav>
            <a href={`/${locale}/privacitat`} onClick={() => setMenuOpen(false)}>{t('nav.privacy')}</a>
            <a href={`/${locale}/termes`} onClick={() => setMenuOpen(false)}>{t('nav.terms')}</a>
          </nav>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
