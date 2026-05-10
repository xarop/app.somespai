'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Icon } from './icon';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const t = useTranslations();
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  const [mode, setMode] = useState<'signIn' | 'signUp' | 'resetPassword'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setPassword('');
      setLoading(false);
      setError(null);
      setSuccessMsg(null);
      setMode('signIn');
    }
  }, [open]);

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

  return (
    <dialog ref={dialogRef} data-modal aria-labelledby="auth-title">
      <button type="button" className="modal__close" aria-label={t('typeInfo.close')} onClick={onClose}>
        <Icon name="close" size={18} />
      </button>

      <div style={{ padding: 'var(--s-7) var(--s-5) var(--s-5)' }}>
        <h2 id="auth-title" style={{ fontSize: 'var(--t-xl)', fontWeight: 700, marginBottom: 'var(--s-2)' }}>
          {mode === 'signIn' ? t('auth.titleSignIn') : mode === 'signUp' ? t('auth.titleSignUp') : t('auth.titleReset')}
        </h2>
        <p style={{ color: 'var(--ink-mute)', fontSize: 'var(--t-sm)', marginBottom: 'var(--s-5)' }}>
          {mode === 'signIn' ? t('auth.leadSignIn') : mode === 'signUp' ? t('auth.leadSignUp') : t('auth.leadReset')}
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
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

          {isDevAdmin && (
            <p style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-mute)', margin: 0 }}>
              🛠 Dev mode — entra directament sense contrasenya
            </p>
          )}
          
          {error && <p className="form-error" style={{ margin: 0 }}>{error}</p>}
          {successMsg && <p className="form-success" style={{ margin: 0, color: 'green', fontSize: 'var(--t-sm)' }}>{successMsg}</p>}
          
          <button type="submit" data-variant="primary" disabled={loading} style={{ marginTop: 'var(--s-1)' }}>
            {loading ? '…' : (mode === 'signIn' ? t('auth.sendSignIn') : mode === 'signUp' ? t('auth.sendSignUp') : t('auth.sendReset'))}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: 'var(--s-3)' }}>
             {mode === 'signIn' && (
               <button type="button" className="inline-link" onClick={toggleResetMode} style={{ fontSize: 'var(--t-sm)', display: 'block', margin: '0 auto var(--s-2)' }}>
                 {t('auth.toggleToReset')}
               </button>
             )}
             {mode === 'resetPassword' ? (
               <button type="button" className="inline-link" onClick={toggleResetMode} style={{ fontSize: 'var(--t-sm)' }}>
                 {t('auth.toggleToSignIn')}
               </button>
             ) : (
               <button type="button" className="inline-link" onClick={toggleMode} style={{ fontSize: 'var(--t-sm)' }}>
                 {mode === 'signIn' ? t('auth.toggleToSignUp') : t('auth.toggleToSignIn')}
               </button>
             )}
          </div>
        </form>
      </div>
    </dialog>
  );
}
