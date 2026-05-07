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

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  let authorized = false;
  if (user) {
    if (user.email === adminEmail) {
      authorized = true;
    } else {
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (profile?.is_admin) {
        authorized = true;
      }
    }
  }

  if (!authorized) {
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
        </header>
        <AdminDashboard spaces={spaces} initialEditId={edit} mainAdminEmail={adminEmail} />
      </div>
    </div>
    </>
  );
}
