'use client';

import { useTranslations } from 'next-intl';
import { PageNav } from '@/components/ui/page-nav';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <>
      <PageNav />
      <div className="page-form">
        <div className="page-form__inner" style={{ textAlign: 'center', paddingTop: '4rem', paddingBottom: '4rem' }}>
          <p style={{ fontSize: '6rem', fontWeight: 700, lineHeight: 1, color: 'var(--ink-mute)', margin: 0 }}>
            {t('code')}
          </p>
          <h1 style={{ fontSize: 'var(--t-xl)', fontWeight: 700, margin: 'var(--s-4) 0 var(--s-3)' }}>
            {t('title')}
          </h1>
          <p style={{ color: 'var(--ink-mute)', marginBottom: 'var(--s-7)' }}>
            {t('desc')}
          </p>
          <a href="/" className="btn-primary">{t('back')}</a>
        </div>
      </div>
    </>
  );
}
