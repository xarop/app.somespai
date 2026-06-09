'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Icon } from './icon';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'signIn' | 'signUp' | 'resetPassword';
}

export function AuthModal({ open, onClose, initialMode }: AuthModalProps) {
  const t = useTranslations();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [mode, setMode] = useState<'signIn' | 'signUp' | 'resetPassword'>(initialMode ?? 'signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // Portal target — the topnav ancestor uses backdrop-filter, which would
  // otherwise become the containing block for the fixed dialog and throw off
  // its centring. Rendering into <body> keeps it anchored to the viewport.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) {
      setMode(initialMode ?? 'signIn');
    } else {
      setEmail('');
      setPassword('');
      setDisplayName('');
      setPhone('');
      setLoading(false);
      setError(null);
      setSuccessMsg(null);
    }
  }, [open, initialMode]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClick = (e: MouseEvent) => { if (e.target === dialog) onClose(); };
    const handleClose = () => onClose();
    dialog.addEventListener('click', handleClick);
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('click', handleClick);
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  const isDevAdmin =
    process.env.NODE_ENV === 'development' &&
    !!email &&
    email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;

    // DEV BYPASS: skip password entirely for the local admin email
    if (isDevAdmin) {
      document.cookie = 'dev_admin_bypass=true; path=/';
      try { window.localStorage.setItem('dev_admin_bypass', 'true'); } catch { /* ignore */ }
      window.location.reload();
      return;
    }

    if (mode !== 'resetPassword' && !password) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const supabase = createClient();
    
    if (mode === 'signUp') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim() || undefined,
            phone: phone.trim() || undefined,
          },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
      } else {
        // Assume email confirmation is disabled/we are logged in
        onClose();
        window.location.reload();
      }
    } else if (mode === 'resetPassword') {
      const currentLocaleMatch = window.location.pathname.match(/^\/(ca|es|en)/);
      const currentLocale = currentLocaleMatch ? currentLocaleMatch[1] : 'ca';
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${currentLocale}/perfil`,
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccessMsg(t('auth.resetEmailSent'));
      }
      setLoading(false);
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
      } else {
        onClose();
        window.location.reload();
      }
    }
  }

  function toggleMode() {
    setMode(m => m === 'signIn' ? 'signUp' : 'signIn');
    setError(null);
    setSuccessMsg(null);
  }

  function toggleResetMode() {
    setMode(m => m === 'resetPassword' ? 'signIn' : 'resetPassword');
    setError(null);
    setSuccessMsg(null);
  }

  if (!mounted) return null;

  return createPortal(
    <dialog ref={dialogRef} data-modal aria-labelledby="auth-title">
      <button type="button" className="modal__close" aria-label={t('typeInfo.close')} onClick={onClose}>
        <Icon name="close" size={18} />
      </button>

      <div className="auth-modal__body">
        <h2 id="auth-title" className="auth-modal__title">
          {mode === 'signIn' ? t('auth.titleSignIn') : mode === 'signUp' ? t('auth.titleSignUp') : t('auth.titleReset')}
        </h2>
        <p className="auth-modal__lead">
          {mode === 'signIn' ? t('auth.leadSignIn') : mode === 'signUp' ? t('auth.leadSignUp') : t('auth.leadReset')}
        </p>

        <form onSubmit={handleSubmit} className="auth-modal__form">
          <label className="field">
            <span className="field__label">{t('auth.email')}</span>
            <input
              type="email"
              className="field__input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nom@exemple.cat"
              required
              autoFocus
            />
          </label>
          
          {mode !== 'resetPassword' && !isDevAdmin && (
            <label className="field">
              <span className="field__label">{t('auth.password')}</span>
              <input
                type="password"
                className="field__input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>
          )}

          {mode === 'signUp' && (
            <>
              <label className="field">
                <span className="field__label">{t('user.profileName')}</span>
                <input
                  type="text"
                  className="field__input"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={t('user.profileName')}
                  maxLength={80}
                  autoComplete="name"
                />
              </label>
              <label className="field">
                <span className="field__label auth-modal__label-row">
                  {t('user.profilePhone')}
                  <span className="auth-modal__optional">({t('auth.optional')})</span>
                </span>
                <input
                  type="tel"
                  className="field__input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  maxLength={30}
                />
              </label>
            </>
          )}

          {isDevAdmin && (
            <p className="auth-modal__dev-note">
              🛠 Dev mode — entra directament sense contrasenya
            </p>
          )}

          {error && <p className="form-error auth-modal__msg">{error}</p>}
          {successMsg && <p className="form-success auth-modal__success">{successMsg}</p>}

          <button type="submit" data-variant="primary" disabled={loading} className="auth-modal__submit">
            {loading ? '…' : (mode === 'signIn' ? t('auth.sendSignIn') : mode === 'signUp' ? t('auth.sendSignUp') : t('auth.sendReset'))}
          </button>

          <div className="auth-modal__toggles">
             {mode === 'signIn' && (
               <button type="button" className="inline-link auth-modal__toggle--block" onClick={toggleResetMode}>
                 {t('auth.toggleToReset')}
               </button>
             )}
             {mode === 'resetPassword' ? (
               <button type="button" className="inline-link auth-modal__toggle" onClick={toggleResetMode}>
                 {t('auth.toggleToSignIn')}
               </button>
             ) : (
               <button type="button" className="inline-link auth-modal__toggle" onClick={toggleMode}>
                 {mode === 'signIn' ? t('auth.toggleToSignUp') : t('auth.toggleToSignIn')}
               </button>
             )}
          </div>
        </form>
      </div>
    </dialog>,
    document.body,
  );
}
