import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getSpacesByOwner } from '@/lib/supabase/spaces';
import { PageNav } from '@/components/ui/page-nav';
import { FavoritesSection } from './favorites-section';
import { ProfileForm } from './profile-form';
import { getProfileAction } from './profile-actions';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: `${t('user.mySpaces')} — somespai`,
    description: t('auth.leadSignIn'),
  };
}

export default async function PerfilPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const [spaces, profile] = await Promise.all([
    getSpacesByOwner(user.id),
    getProfileAction(),
  ]);
  const t = await getTranslations('user');

  return (
    <>
    <PageNav />
    <div className="page-form">
      <div className="page-form__inner">
        <header className="page-form__header">
          <a href="/" className="page-form__back">←</a>
          <h1>{t('mySpaces')}</h1>
          <p className="page-form__subtitle">{user.email}</p>
        </header>

        {/* Profile data */}
        <h2 style={{ marginTop: 'var(--s-4)', marginBottom: 'var(--s-3)', fontSize: 'var(--t-lg)', fontWeight: 600 }}>
          {t('profileTitle')}
        </h2>
        <ProfileForm displayName={profile.displayName} phone={profile.phone} />

        {/* Spaces */}
        <h2 style={{ marginTop: 'var(--s-7)', marginBottom: 'var(--s-2)', fontSize: 'var(--t-lg)', fontWeight: 600 }}>
          {t('mySpacesTitle')}
        </h2>
        {spaces.length === 0 ? (
          <p style={{ color: 'var(--ink-mute)', padding: 'var(--s-4) 0' }}>{t('noSpaces')}</p>
        ) : (
          <div className="perfil-spaces">
            {spaces.map((space) => (
              <div key={space.id} className="perfil-space-row">
                <div className="perfil-space-row__info">
                  <span className="perfil-space-row__title">{space.title}</span>
                  <span className={`perfil-space-row__status perfil-space-row__status--${space.status}`}>
                    {space.status === 'active' ? t('statusActive') : t('statusPaused')}
                  </span>
                </div>
                <a href={`/${locale}/editar/${space.slug}`} className="perfil-space-row__edit">
                  {t('editSpace')}
                </a>
              </div>
            ))}
          </div>
        )}

        <h2 style={{ marginTop: 'var(--s-6)', marginBottom: 'var(--s-2)', fontSize: 'var(--t-lg)', fontWeight: 600 }}>
          {t('myFavorites')}
        </h2>

        <FavoritesSection locale={locale} noFavoritesText={t('noFavorites')} />
      </div>
    </div>
    </>
  );
}
