'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/icon';
import { submitContactAction } from './actions';
import type { ContactState } from './actions';

const TYPES = ['bug', 'suggestion', 'question', 'other'] as const;

export function ContactForm() {
  const t = useTranslations('contact');
  const [state, formAction, isPending] = useActionState<ContactState, FormData>(
    submitContactAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="contact-success">
        <Icon name="check" size={40} />
        <h2>{t('successTitle')}</h2>
        <p>{t('successBody')}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="contact-form">
      {state && !state.ok && (
        <div className="form-error">{t('errorSubmit')}</div>
      )}

      <label className="field">
        <span className="field__label">{t('fieldName')} *</span>
        <input
          name="name"
          type="text"
          className="field__input"
          required
          maxLength={100}
          autoComplete="name"
        />
      </label>

      <label className="field">
        <span className="field__label">{t('fieldEmail')} *</span>
        <input
          name="email"
          type="email"
          className="field__input"
          required
          maxLength={200}
          autoComplete="email"
        />
      </label>

      <div className="field">
        <span className="field__label">{t('fieldType')} *</span>
        <div className="contact-type-picker">
          {TYPES.map((type) => (
            <label key={type} className="contact-type-option">
              <input type="radio" name="type" value={type} required defaultChecked={type === 'question'} />
              <span>{t(`type${type.charAt(0).toUpperCase() + type.slice(1)}` as Parameters<typeof t>[0])}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="field">
        <span className="field__label">{t('fieldMessage')} *</span>
        <textarea
          name="message"
          className="field__input field__textarea"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder={t('fieldMessagePlaceholder')}
        />
      </label>

      <button type="submit" className="btn-primary contact-submit" disabled={isPending}>
        {isPending ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
