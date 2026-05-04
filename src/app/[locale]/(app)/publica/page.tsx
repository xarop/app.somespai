import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PublishForm } from './publish-form';

export default async function PublicarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const t = await getTranslations('publish');

  return (
    <div className="page-form">
      <div className="page-form__inner">
        <header className="page-form__header">
          <a href="/" className="page-form__back">← {''}</a>
          <h1>{t('title')}</h1>
          <p className="page-form__subtitle">{t('subtitle')}</p>
        </header>
        <PublishForm />
      </div>
    </div>
  );
}
