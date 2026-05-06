import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getAllSpacesAdmin } from '@/lib/supabase/admin';
import { AdminDashboard } from './admin-dashboard';
import { PageNav } from '@/components/ui/page-nav';

interface AdminPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { edit } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/');
  }

  const t = await getTranslations('admin');
  const spaces = await getAllSpacesAdmin();

  return (
    <>
    <PageNav />
    <div className="page-form">
      <div className="page-form__inner page-form__inner--wide">
        <header className="page-form__header">
          <a href="/" className="page-form__back">←</a>
          <h1>{t('title')}</h1>
          <p className="page-form__subtitle">{t('subtitle', { count: spaces.length })}</p>
        </header>
        <AdminDashboard spaces={spaces} initialEditId={edit} />
      </div>
    </div>
    </>
  );
}
