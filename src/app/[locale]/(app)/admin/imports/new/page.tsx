import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { ImportSearch } from './import-search';
import { PageNav } from '@/components/ui/page-nav';

export default async function ImportNewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  let authorized = false;
  if (user) {
    if (user.email === adminEmail) {
      authorized = true;
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (profile?.is_admin) authorized = true;
    }
  }

  if (!authorized) redirect('/');

  const locale = await getLocale();

  return (
    <>
      <PageNav />
      <div className="page-form">
        <div className="page-form__inner page-form__inner--wide">
          <header className="page-form__header">
            <a href={`/${locale}/admin`} className="page-form__back">
              ←
            </a>
            <h1>Importar espais de Google Places</h1>
          </header>
          <ImportSearch />
        </div>
      </div>
    </>
  );
}
