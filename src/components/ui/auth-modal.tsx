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
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) { setSent(false); setEmail(''); setLoading(false); setError(null); }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setError(null);

    // DEV BYPASS: intercept local admin sign-in
    if (process.env.NODE_ENV === 'development' && email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      document.cookie = 'dev_admin_bypass=true; path=/';
      if (typeof window !== 'undefined') window.localStorage.setItem('dev_admin_bypass', 'true');
      window.location.reload();
      return;
    }

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (otpError) {
      setError(otpError.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialogRef} data-modal aria-labelledby="auth-title">
      <button type="button" className="modal__close" aria-label={t('typeInfo.close')} onClick={onClose}>
        <Icon name="close" size={18} />
      </button>

      <div style={{ padding: 'var(--s-7) var(--s-5) var(--s-5)' }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: 'var(--s-5) 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--s-3)' }}>📬</div>
            <h2 style={{ fontSize: 'var(--t-lg)', fontWeight: 700, marginBottom: 'var(--s-2)' }}>
              {t('auth.sent')}
            </h2>
            <p style={{ color: 'var(--ink-mute)', fontSize: 'var(--t-sm)' }}>{email}</p>
          </div>
        ) : (
          <>
            <h2 id="auth-title" style={{ fontSize: 'var(--t-xl)', fontWeight: 700, marginBottom: 'var(--s-2)' }}>
              {t('auth.title')}
            </h2>
            <p style={{ color: 'var(--ink-mute)', fontSize: 'var(--t-sm)', marginBottom: 'var(--s-5)' }}>
              {t('auth.lead')}
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
              {error && <p className="form-error" style={{ margin: 0 }}>{error}</p>}
              <button type="submit" data-variant="primary" disabled={loading} style={{ marginTop: 'var(--s-1)' }}>
                {loading ? '…' : t('auth.send')}
              </button>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
