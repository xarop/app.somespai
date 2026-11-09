'use client';

import { useEffect, useState } from 'react';
import type { AuthChangeEvent, AuthError, Session, User } from '@supabase/supabase-js';
import { AuthModal } from '@/components/ui/auth-modal';
import { createClient } from '@/lib/supabase/client';

const labels = {
  ca: 'El meu compte',
  es: 'Mi cuenta',
  en: 'My account',
} as const;

const signInLabels = {
  ca: 'Inicia sessió',
  es: 'Iniciar sesión',
  en: 'Sign in',
} as const;

export function WorkshopAccount({ locale }: { locale: string }) {
  const [signedIn, setSignedIn] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error }: {
      data: { user: User | null };
      error: AuthError | null;
    }) => {
      if (error) console.error('[WorkshopAccount] Could not read auth state:', error.message);
      setSignedIn(!!data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((
      _event: AuthChangeEvent,
      session: Session | null,
    ) => {
      setSignedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const localePrefix = locale === 'ca' ? '' : `/${locale}`;
  const label = labels[locale as keyof typeof labels] ?? labels.ca;
  const signInLabel = signInLabels[locale as keyof typeof signInLabels] ?? signInLabels.ca;

  return (
    <>
      {signedIn ? (
        <a className="workshop-header__account" href={`${localePrefix}/perfil`}>{label}</a>
      ) : (
        <button className="workshop-header__account-button" type="button" onClick={() => setAuthOpen(true)}>
          {signInLabel}
        </button>
      )}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
