import { setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getBrand, getSomespaiUrl } from '@/lib/brand';
import { WorkshopHeader } from '@/components/workshop/workshop-header';
import { WorkshopPublishForm } from './publish-form';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ space?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const brand = getBrand();
  return {
    title: locale === 'en' ? `List a workshop · ${brand.name}` : locale === 'es' ? `Publicar un taller · ${brand.name}` : `Publica un taller · ${brand.name}`,
  };
}

export default async function PublishWorkshopPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { space: spaceSlug } = (await searchParams) ?? {};
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let spaces: { id: string; slug: string; title: string; city: string | null }[] = [];
  if (user) {
    const { data, error } = await supabase
      .from('spaces')
      .select('id, slug, title, city')
      .eq('status', 'active')
      .eq('is_workshop_venue', true)
      .order('title', { ascending: true })
      .limit(200);
    if (error) throw new Error(`Could not load Somespai spaces: ${error.message}`);
    spaces = data ?? [];
  }

  return (
    <main className="workshop-publish-page">
      <WorkshopHeader locale={locale} />
      <section className="workshop-publish">
        <a className="workshop-back" href={locale === 'ca' ? '/' : `/${locale}/`}>←</a>
        <h1>{locale === 'en' ? 'List a workshop' : locale === 'es' ? 'Publica un taller' : 'Publica un taller'}</h1>
        <p>
          {locale === 'en'
            ? 'Share your activity and let people contact you directly.'
            : locale === 'es'
              ? 'Comparte tu actividad y deja que te contacten directamente.'
              : 'Comparteix la teva activitat i deixa que t’hi contactin directament.'}
        </p>
        {user ? (
          <WorkshopPublishForm
            locale={locale}
            spaces={spaces}
            somespaiUrl={getSomespaiUrl()}
            defaultSpaceId={spaces.find((space) => space.slug === spaceSlug)?.id ?? ''}
          />
        ) : (
          <div className="workshop-login-note">
            <p>{locale === 'en' ? 'Sign in with your Somespai account to publish.' : locale === 'es' ? 'Inicia sesión con tu cuenta de Somespai para publicar.' : 'Inicia sessió amb el teu compte de Somespai per publicar.'}</p>
            <a className="workshop-button workshop-button--primary" href={locale === 'ca' ? '/' : `/${locale}/`}>
              {locale === 'en' ? 'Go to sign in' : locale === 'es' ? 'Ir a iniciar sesión' : 'Ves a iniciar sessió'}
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
