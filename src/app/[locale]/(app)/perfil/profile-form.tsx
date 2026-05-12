'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { updateProfileAction } from './profile-actions';

interface ProfileFormProps {
  displayName: string | null;
  phone: string | null;
}

export function ProfileForm({ displayName, phone }: ProfileFormProps) {
  const t = useTranslations('user');
  const [name, setName] = useState(displayName ?? '');
  const [tel, setTel] = useState(phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateProfileAction(name, tel);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <label className="field">
        <span className="field__label">{t('profileName')}</span>
        <input
          type="text"
          className="field__input"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={80}
          placeholder={t('profileName')}
        />
      </label>
      <label className="field">
        <span className="field__label">{t('profilePhone')}</span>
        <input
          type="tel"
          className="field__input"
          value={tel}
          onChange={e => setTel(e.target.value)}
          maxLength={30}
          placeholder="+34 600 000 000"
        />
      </label>
      {error && <p style={{ color: 'var(--danger)', fontSize: 'var(--t-sm)' }}>{error}</p>}
      {saved && <p style={{ color: 'var(--success)', fontSize: 'var(--t-sm)' }}>{t('profileSaved')}</p>}
      <button type="submit" data-variant="primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
        {saving ? t('profileSaving') : t('profileSave')}
      </button>
    </form>
  );
}
