'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/icon';
import { createClient } from '@/lib/supabase/client';
import { submitContactAction } from './actions';
import type { ContactState } from './actions';

const TYPES = ['space', 'bug', 'suggestion', 'question', 'other'] as const;

type ReportReason = 'unavailable' | 'wrongdata' | 'report';

const REASON_TYPE: Record<ReportReason, string> = {
  unavailable: 'bug',
  wrongdata: 'bug',
  report: 'other',
};

const REASON_TEMPLATE_KEY: Record<ReportReason, Parameters<ReturnType<typeof useTranslations<'contact'>>>[0]> = {
  unavailable: 'reportUnavailableTemplate',
  wrongdata: 'reportWrongDataTemplate',
  report: 'reportAbuseTemplate',
};

interface ContactFormProps {
  spaceTitle?: string;
  spaceAddress?: string;
  spaceUrl?: string;
  reason?: string;
}

export function ContactForm({ spaceTitle, spaceAddress, spaceUrl, reason }: ContactFormProps) {
  const t = useTranslations('contact');
  const [state, formAction, isPending] = useActionState<ContactState, FormData>(
    submitContactAction,
    null,
  );

  const isSpaceContact = !!(spaceTitle);
  const reportReason = (reason && reason in REASON_TYPE) ? reason as ReportReason : null;
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user) {
        if (nameRef.current && !nameRef.current.value) {
          nameRef.current.value =
            user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';
        }
        if (emailRef.current && !emailRef.current.value) {
          emailRef.current.value = user.email ?? '';
        }
      }
      setUserLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isSpaceContact || !messageRef.current) return;
    let template: string;
    if (reportReason) {
      template = t(REASON_TEMPLATE_KEY[reportReason], {
        title: spaceTitle ?? '',
        address: spaceAddress ?? spaceTitle ?? '',
        url: spaceUrl ?? '',
      });
    } else {
      template = t('spaceMessageTemplate', {
        title: spaceTitle ?? '',
        address: spaceAddress ?? spaceTitle ?? '',
      });
    }
    if (!messageRef.current.value) {
      messageRef.current.value = template;
    }
  }, [isSpaceContact, reportReason, spaceTitle, spaceAddress, spaceUrl, t]);

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
          ref={nameRef}
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
          ref={emailRef}
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
              <input
                type="radio"
                name="type"
                value={type}
                required
                defaultChecked={
                reportReason
                  ? type === REASON_TYPE[reportReason]
                  : isSpaceContact
                  ? type === 'space'
                  : type === 'question'
              }
              />
              <span>{t(`type${type.charAt(0).toUpperCase() + type.slice(1)}` as Parameters<typeof t>[0])}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="field">
        <span className="field__label">{t('fieldMessage')} *</span>
        <textarea
          ref={messageRef}
          name="message"
          className="field__input field__textarea"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder={t('fieldMessagePlaceholder')}
        />
      </label>

      <button type="submit" className="btn-primary contact-submit" disabled={isPending || !userLoaded}>
        {isPending ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
